"""
Ozon Seller API: остатки по товарам (перед createOrder / Ozon Pay + логистика).

Это не Acquiring payapi: проверка идёт отдельными ключами Seller API. В Acquiring
для доставки в ``items[].sku`` должен быть тот же числовой SKU из кабинета продавца.

По справке Ozon Доставки / Seller API: ``POST /v1/analytics/stocks`` — для планирования
поставок, **не** для отображения остатка «доступно к продаже»; для остатков на складах
продавца в таком смысле указан **``v4/product/info/stocks``** — здесь он в основе цепочки
(плюс v3, FBS по складам, related-sku — см. ниже).

В админке в «Ozon SKU» часто вводят **FBS sku** (как в Acquiring `items[].sku`), которое **не
совпадает** с `product_id` в кабинете. Тогда запрос `v4/.../stocks` с `filter.product_id` не
возвращает товар. Запрашиваем остатки и по `product_id`, и по `offer_id`, и по `sku` (v4), плюс
`v3/product/info/list` по списку `sku` — ответы склеиваем; в индексе учитываем `sources[]` (FBS).
Плюс **`/v1/product/info/stocks-by-warehouse/fbs`**: по каждому SKU суммируем `present` по
складам (FBS / rFBS), если в ответе есть значение `present`.
**`/v1/product/related-sku/get`** (док-ция ProductAPI_ProductGetRelatedSKU) — у одного товара
несколько SKU (FBO / FBS и т.д.); по одному введённому в админке ищем **все связанные `sku`**
(группировка по `product_id` в ответе) и сравниваем остаток по **максимуму внутри кластера**.

Ключи: OZON_SELLER_CLIENT_ID, OZON_SELLER_API_KEY (см. кабинет — Product read-only + Warehouse
или Admin read-only). Кэш: OZON_SELLER_STOCK_CACHE_SECONDS (по умолчанию 120).

Документация: https://docs.ozon.ru/api/seller/
"""

from __future__ import annotations

import json
import logging
import os
import zlib
from typing import Any

from django.core.cache import cache
from rest_framework.exceptions import ValidationError

from api.services.http_util import HttpJsonError, post_json

logger = logging.getLogger(__name__)

SELLER_BASE = (os.environ.get("OZON_SELLER_API_URL") or "https://api-seller.ozon.ru").rstrip()

_ENV_SKIP = (os.environ.get("OZON_SELLER_STOCK_CHECK") or "").strip().lower() in (
    "0",
    "false",
    "no",
    "off",
)


def _env_int(name: str, default: int) -> int:
    try:
        return int(str(os.environ.get(name, "")).strip() or str(default))
    except ValueError:
        return default


def seller_credentials() -> tuple[str, str] | None:
    """Пара Client-Id + Api-Key: сначала env, иначе `OzonSellerApiSettings` в админке (1:1 к настройкам)."""
    env_cid = (os.environ.get("OZON_SELLER_CLIENT_ID") or "").strip()
    env_key = (os.environ.get("OZON_SELLER_API_KEY") or "").strip()
    db_cid = ""
    db_key = ""
    try:
        from api.models import SiteSettings

        s = SiteSettings.get_solo()
        cred = s.ozon_seller_api
        db_cid = (cred.client_id or "").strip()
        db_key = (cred.api_key or "").strip()
    except Exception:
        pass
    cid = env_cid or db_cid
    key = env_key or db_key
    if not cid or not key:
        return None
    return cid, key


def _auth_headers(creds: tuple[str, str]) -> dict[str, str]:
    return {"Client-Id": creds[0], "Api-Key": creds[1]}


def _cache_ttl_seconds() -> int:
    return max(15, min(900, _env_int("OZON_SELLER_STOCK_CACHE_SECONDS", 120)))


def _batch_cache_key(skus: list[int]) -> str:
    raw = json.dumps(sorted(skus), separators=(",", ":"), ensure_ascii=True)
    h = zlib.crc32(raw.encode("utf-8")) & 0xFFFFFFFF
    return f"ozon_seller:stocks:batch:v4:{h}:{len(skus)}"


def _coerce_nonneg_int(val: Any) -> int | None:
    if isinstance(val, (int, float)) and val >= 0:
        return int(val)
    return None


def _row_presentish(row: dict[str, Any]) -> int:
    for key in ("present", "count", "stock", "available"):
        w = _coerce_nonneg_int(row.get(key))
        if w is not None and w > 0:
            return w
    return 0


def _extract_present(item: dict[str, Any]) -> int:
    stocks = item.get("stocks")
    if isinstance(stocks, dict):
        p = stocks.get("present")
        w = _coerce_nonneg_int(p) if p is not None else None
        if w is not None and w > 0:
            return w
        inner = stocks.get("stocks")
        if isinstance(inner, list) and inner:
            t = 0
            for s in inner:
                if isinstance(s, dict):
                    t += _row_presentish(s)
            if t > 0:
                return t
    if isinstance(stocks, list) and stocks:
        total = 0
        for s in stocks:
            if not isinstance(s, dict):
                continue
            p = s.get("present")
            if isinstance(p, (int, float)) and p > 0:
                total += int(p)
            else:
                total += _row_presentish(s)
        if total > 0:
            return total
    p = item.get("present")
    if isinstance(p, (int, float)) and p >= 0:
        return int(p)
    return 0


def _items_list(resp: Any) -> list[dict[str, Any]]:
    if not isinstance(resp, dict):
        return []
    r = resp.get("result")
    if isinstance(r, dict) and isinstance(r.get("items"), list):
        items = r.get("items")
    else:
        items = resp.get("items")
    if not isinstance(items, list):
        return []
    return [x for x in items if isinstance(x, dict)]


def _v4_stocks_paginate(
    creds: tuple[str, str],
    *,
    filter_key: str,
    ids: list[str],
) -> list[dict[str, Any]]:
    if not ids:
        return []
    out_items: list[dict[str, Any]] = []
    last_id: str = ""
    url = f"{SELLER_BASE}/v4/product/info/stocks"
    for _ in range(60):
        flt: dict[str, Any] = {"visibility": "ALL", filter_key: ids}
        body: dict[str, Any] = {"filter": flt, "limit": 1000}
        if last_id:
            body["last_id"] = last_id
        data = post_json(url, body, headers=_auth_headers(creds), timeout=45.0)
        out_items.extend(_items_list(data))
        last_id = ""
        if isinstance(data, dict):
            r = data.get("result")
            if isinstance(r, dict) and r.get("last_id"):
                last_id = str(r.get("last_id") or "").strip()
        if not last_id or last_id in ("0", "null"):
            break
    return out_items


def _index_availability(items: list[dict[str, Any]]) -> dict[int, int]:
    """
    best[int_id] = max present для любого id (sku / product_id / offer как число),
    с которым может совпасть ввод из админки. В v3 в ответе часто `sources` (FBS) с полем `sku`.
    """
    best: dict[int, int] = {}
    for item in items:
        sources = item.get("sources")
        if isinstance(sources, list) and sources:
            for src in sources:
                if not isinstance(src, dict):
                    continue
                ps0 = src.get("present")
                if isinstance(ps0, (int, float)) and ps0 >= 0:
                    p_src = int(ps0)
                else:
                    p_src = _row_presentish(src)
                if p_src < 0:
                    p_src = 0
                for key in ("sku", "product_id", "fbs_sku"):
                    raw = src.get(key)
                    if raw is None or raw is False:
                        continue
                    try:
                        k = int(str(raw).strip())
                    except (TypeError, ValueError):
                        continue
                    if k < 0:
                        continue
                    if p_src > best.get(k, -1):
                        best[k] = p_src
        p = _extract_present(item)
        for key in ("sku", "product_id", "id"):
            raw = item.get(key)
            if raw is None or raw is False:
                continue
            try:
                k = int(str(raw).strip())
            except (TypeError, ValueError):
                continue
            if k < 0:
                continue
            if p > best.get(k, -1):
                best[k] = p
        oid = item.get("offer_id")
        if oid is not None and str(oid).strip() != "":
            s = str(oid).strip()
            if s.isdigit():
                try:
                    k = int(s)
                except ValueError:
                    continue
                if p > best.get(k, -1):
                    best[k] = p
    return best


def _related_sku_raw_items(
    creds: tuple[str, str], skus: list[int]
) -> list[dict[str, Any]]:
    if not skus:
        return []
    url = f"{SELLER_BASE}/v1/product/related-sku/get"
    out: list[dict[str, Any]] = []
    for i in range(0, len(skus), 200):
        batch = skus[i : i + 200]
        try:
            data = post_json(url, {"sku": batch}, headers=_auth_headers(creds), timeout=45.0)
        except HttpJsonError as e:
            logger.info("Ozon v1/related-sku: %s", e)
            continue
        if not isinstance(data, dict):
            continue
        items = data.get("items")
        if not isinstance(items, list):
            continue
        for x in items:
            if isinstance(x, dict):
                out.append(x)
    return out


def _sku_to_cluster_map(
    sset: list[int], rel_items: list[dict[str, Any]]
) -> dict[int, set[int]]:
    by_pid: dict[int, set[int]] = {}
    for it in rel_items:
        raw_p = it.get("product_id")
        raw_s = it.get("sku")
        if raw_s is None or raw_s is False or raw_p is None:
            continue
        try:
            pid = int(str(raw_p).strip())
            sk = int(str(raw_s).strip())
        except (TypeError, ValueError):
            continue
        if sk < 0 or pid < 0:
            continue
        by_pid.setdefault(pid, set()).add(sk)
    out: dict[int, set[int]] = {}
    for k in sset:
        cl: set[int] = {k}
        for sgroup in by_pid.values():
            if k in sgroup:
                cl = set(sgroup)
                break
        out[k] = cl
    return out


def _v3_product_info_list_by_sku(
    creds: tuple[str, str], skus: list[int]
) -> list[dict[str, Any]]:
    """
    /v3/product/info/list — по полю `sku` находит товар, даже если в админке не product_id.
    """
    if not skus:
        return []
    url = f"{SELLER_BASE}/v3/product/info/list"
    hdrs = _auth_headers(creds)
    bodies: list[dict[str, Any]] = [
        {"sku": skus},
        {"product_id": [], "offer_id": [], "sku": skus},
        {"sku": [str(x) for x in skus]},
    ]
    for body in bodies:
        try:
            data = post_json(url, body, headers=hdrs, timeout=45.0)
        except HttpJsonError as e:
            logger.info("Ozon v3/product/info/list: %s", e)
            continue
        if not isinstance(data, dict):
            continue
        r = data.get("result")
        if not isinstance(r, dict):
            continue
        items = r.get("items")
        if isinstance(items, list) and items:
            return [x for x in items if isinstance(x, dict)]
    return []


def _v1_fbs_warehouse_present_by_sku(
    creds: tuple[str, str], skus: list[int]
) -> dict[int, int]:
    """
    POST /v1/product/info/stocks-by-warehouse/fbs (см. ProductAPI_ProductStocksByWarehouseFbs):
    остатки FBS и rFBS в разбивке по складам. По одному `sku` может быть несколько строк —
    суммируем `present`.
    """
    if not skus:
        return {}
    url = f"{SELLER_BASE}/v1/product/info/stocks-by-warehouse/fbs"
    hdrs = _auth_headers(creds)
    out: dict[int, int] = {}
    # Разумный лимит на пакет (связанные эндпоинты — до 200 SKU)
    for i in range(0, len(skus), 200):
        batch = skus[i : i + 200]
        try:
            data = post_json(url, {"sku": batch}, headers=hdrs, timeout=45.0)
        except HttpJsonError as e:
            logger.info("Ozon v1/stocks-by-warehouse/fbs: %s", e)
            continue
        if not isinstance(data, dict):
            continue
        rows = data.get("result")
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            raw = row.get("sku")
            if raw is None or raw is False:
                continue
            try:
                k = int(str(raw).strip())
            except (TypeError, ValueError):
                continue
            if k < 0:
                continue
            p0 = row.get("present")
            a = int(p0) if isinstance(p0, (int, float)) and p0 >= 0 else 0
            b = _row_presentish(row)
            q = max(a, b)
            out[k] = out.get(k, 0) + q
    return out


def _fetch_fresh(
    skus: list[int],
    creds: tuple[str, str],
) -> dict[int, int]:
    """v4 + v3 + FBS-склады; related-sku сшивает FBO/FBS-идентификаторы (см. доку)."""
    sset = sorted({s for s in skus if s and s > 0})
    if not sset:
        return {}
    rel = _related_sku_raw_items(creds, sset)
    by_k = _sku_to_cluster_map(sset, rel)
    expanded: set[int] = set()
    for g in by_k.values():
        expanded |= g
    for it in rel:
        raw = it.get("sku")
        if raw is not None and raw is not False:
            try:
                sk = int(str(raw).strip())
            except (TypeError, ValueError):
                pass
            else:
                if sk > 0:
                    expanded.add(sk)
    ex = sorted(x for x in expanded if x > 0)
    if not ex:
        ex = sset
    sset_str = [str(x) for x in ex]
    all_items: list[dict[str, Any]] = []
    all_items.extend(_v4_stocks_paginate(creds, filter_key="product_id", ids=sset_str))
    all_items.extend(_v4_stocks_paginate(creds, filter_key="offer_id", ids=sset_str))
    try:
        all_items.extend(_v4_stocks_paginate(creds, filter_key="sku", ids=sset_str))
    except HttpJsonError as e:
        logger.info("Ozon v4/stocks filter=sku: %s (ok if keys — product_id)", e)
    all_items.extend(_v3_product_info_list_by_sku(creds, ex))
    by_id = _index_availability(all_items)
    fbs = _v1_fbs_warehouse_present_by_sku(creds, ex)
    per: dict[int, int] = {
        n: max(int(by_id.get(n, 0) or 0), int(fbs.get(n, 0) or 0)) for n in ex
    }
    return {k: max((per.get(s, 0) for s in by_k[k]), default=0) for k in sset}


def get_ozon_stock_availability(
    skus: list[int],
) -> dict[int, int] | None:
    """
    Вернуть для каждого id из `skus` число `present` (0 если позиция не вернулась = нет
    в выборке/ноль). None — проверка отключена (нет ключей) или OZON_SELLER_STOCK_CHECK=0.
    """
    if _ENV_SKIP:
        return None
    creds = seller_credentials()
    if not creds:
        return None
    if not skus:
        return {}
    u = sorted({int(x) for x in skus if int(x) > 0})
    if not u:
        return {int(x): 0 for x in skus}
    ttl = _cache_ttl_seconds()
    batch_key = _batch_cache_key(u)
    hit = cache.get(batch_key)
    if isinstance(hit, dict):
        out: dict[int, int] = {}
        for k in u:
            v = hit.get(str(k))
            if v is None:
                v = hit.get(k)
            out[k] = int(v or 0)
        return out
    out = _fetch_fresh(u, creds)
    cache.set(batch_key, {str(k): v for k, v in out.items()}, ttl)
    for k, v in out.items():
        cache.set(f"ozon_seller:stock:single:v4:{k}", v, ttl)
    return out


def validate_ozon_logistics_stock(needed: dict[int, int]) -> None:
    """
    Либо pass, либо DRF ValidationError (общее сообщение) для витрины.
    """
    if _ENV_SKIP:
        return
    if not needed:
        return
    if not seller_credentials():
        return
    try:
        u = sorted(needed.keys())
        avail = get_ozon_stock_availability(u)
    except HttpJsonError as e:
        logger.warning("Ozon Seller stock: HTTP error: %s", e)
        raise ValidationError(
            "Не удалось проверить остаток на Ozon. Повторите попытку чуть позже."
        ) from e
    except (OSError, TypeError, ValueError) as e:
        logger.exception("Ozon Seller stock: %s", e)
        raise ValidationError("Не удалось проверить остаток на Ozon. Повторите попытку чуть позже.")

    if avail is None:
        return
    short: list[str] = []
    for sku, qty in needed.items():
        a = int(avail.get(sku, 0) or 0)
        if a < int(qty):
            short.append(f"Ozon SKU {sku}: в заказе {int(qty)} шт., на Ozon {a} шт.")
    if short:
        msg = "Недостаточно товара на Ozon. " + " ".join(short[:4])
        if len(short) > 4:
            msg += " …"
        raise ValidationError(msg)
