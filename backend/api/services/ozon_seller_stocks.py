"""
Ozon Seller API: остатки по товарам (перед createOrder / Ozon Pay + логистика).

Использует тот же числовой идентификатор, что и в админке (ozon_sku) и в Acquiring `items[].sku`
— в кабинете Ozon этот же номер в ряде экранов показывается как product_id; Seller API
`/v4/product/info/stocks` даёт и `product_id`, и `sku` на товар. Ищем совпадение в ответе
по любому из полей, чтобы ID из админки работал в обоих вариантах.

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
    return f"ozon_seller:stocks:batch:{h}:{len(skus)}"


def _extract_present(item: dict[str, Any]) -> int:
    stocks = item.get("stocks")
    if isinstance(stocks, list) and stocks:
        total = 0
        for s in stocks:
            if not isinstance(s, dict):
                continue
            p = s.get("present")
            if isinstance(p, (int, float)) and p > 0:
                total += int(p)
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
    с которым может совпасть ввод из админки.
    """
    best: dict[int, int] = {}
    for item in items:
        p = _extract_present(item)
        for key in ("sku", "product_id"):
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


def _fetch_fresh(
    skus: list[int],
    creds: tuple[str, str],
) -> dict[int, int]:
    """Для списка идентификаторов из БД: сколько в наличии (по данным v4, лучшая оценка)."""
    sset = sorted({s for s in skus if s and s > 0})
    if not sset:
        return {}
    sset_str = [str(x) for x in sset]
    all_items: list[dict[str, Any]] = []
    all_items.extend(_v4_stocks_paginate(creds, filter_key="product_id", ids=sset_str))
    all_items.extend(_v4_stocks_paginate(creds, filter_key="offer_id", ids=sset_str))
    by_id = _index_availability(all_items)
    return {k: by_id.get(k, 0) for k in sset}


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
        cache.set(f"ozon_seller:stock:single:{k}", v, ttl)
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
            short.append(f"товар (идентификатор Ozon {sku}): нужно {int(qty)}, в наличии {a} на Ozon")
    if short:
        msg = (
            "По данным кабинета Ozon сейчас нельзя оформить такой состав заказа с доставкой Ozon: "
            + "; ".join(short[:4])
        )
        if len(short) > 4:
            msg += " …"
        raise ValidationError(msg)
