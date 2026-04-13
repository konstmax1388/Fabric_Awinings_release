"""
Массовое заполнение bitrix_catalog_id по выгрузке каталога Б24 (XML_ID / артикул WB).

См. команду ``sync_bitrix_catalog_ids`` и docs/astrum-bitrix-crm.md.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Callable

from api.models import Product, ProductVariant
from api.services.bitrix24_rest import BitrixRestError, call_bitrix_webhook

logger = logging.getLogger(__name__)

LIST_PAGE_SIZE = 50
SELECT_MIN = ["id", "iblockId", "xmlId"]


@dataclass(frozen=True)
class Bitrix24CatalogConfig:
    """Источник настроек для вызова REST каталога Б24."""

    webhook_base: str
    product_iblock_id: int | None
    offer_iblock_id: int | None


def resolve_bitrix24_catalog_config(
    *,
    webhook_cli: str = "",
    product_iblock_cli: int | None = None,
    offer_iblock_cli: int | None = None,
) -> Bitrix24CatalogConfig:
    """
    Приоритет: аргументы CLI → поля «Настройки сайта» в админке → переменные окружения (Django settings).
    """
    from django.conf import settings

    from api.models import SiteSettings

    s = SiteSettings.get_solo()

    wh = (webhook_cli or "").strip()
    if not wh:
        wh = (getattr(s, "bitrix24_webhook_base", None) or "").strip()
    if not wh:
        wh = (getattr(settings, "BITRIX24_WEBHOOK_BASE", "") or "").strip()

    pid = product_iblock_cli
    if pid is None:
        raw_p = getattr(s, "bitrix24_catalog_product_iblock_id", None)
        pid = int(raw_p) if raw_p is not None else None
    if pid is None:
        pid = getattr(settings, "BITRIX24_CATALOG_PRODUCT_IBLOCK_ID", None)

    oid = offer_iblock_cli
    if oid is None:
        raw_o = getattr(s, "bitrix24_catalog_offer_iblock_id", None)
        oid = int(raw_o) if raw_o is not None else None
    if oid is None:
        oid = getattr(settings, "BITRIX24_CATALOG_OFFER_IBLOCK_ID", None)

    return Bitrix24CatalogConfig(
        webhook_base=wh.rstrip("/"),
        product_iblock_id=pid,
        offer_iblock_id=oid,
    )


def rows_from_bitrix_list_response(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Достаёт список элементов из ответа ``catalog.product.list`` / ``catalog.product.offer.list``."""
    r = data.get("result")
    if isinstance(r, list):
        return [x for x in r if isinstance(x, dict)]
    if isinstance(r, dict):
        for key in ("products", "productOffers", "offers", "items"):
            v = r.get(key)
            if isinstance(v, list):
                return [x for x in v if isinstance(x, dict)]
    return []


def _row_id(row: dict[str, Any]) -> int | None:
    raw = row.get("id")
    if raw is None:
        return None
    try:
        return int(raw)
    except (TypeError, ValueError):
        return None


def _row_xml_id(row: dict[str, Any]) -> str:
    for key in ("xmlId", "XML_ID", "xml_id"):
        v = row.get(key)
        if v is not None:
            s = str(v).strip()
            if s:
                return s
    return ""


def merge_xml_id_index(
    index: dict[str, int],
    rows: list[dict[str, Any]],
    *,
    source_label: str,
    duplicate_warnings: list[str],
) -> None:
    """Заполняет ``index``: нормализованный XML_ID → id каталога Б24."""
    for row in rows:
        bid = _row_id(row)
        xid = _row_xml_id(row)
        if bid is None or not xid:
            continue
        prev = index.get(xid)
        if prev is not None and prev != bid:
            duplicate_warnings.append(
                f"XML_ID «{xid}»: было id={prev}, в {source_label} id={bid} — оставлен последний"
            )
        index[xid] = bid


def fetch_all_catalog_rows(
    webhook_base: str,
    method: str,
    iblock_id: int,
    *,
    timeout: int = 120,
    call_fn: Callable[..., dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """Постраничная выгрузка (по 50 записей, параметр ``start``)."""
    caller = call_fn or call_bitrix_webhook
    out: list[dict[str, Any]] = []
    start = 0
    while True:
        params: dict[str, Any] = {
            "select": SELECT_MIN,
            "filter": {"iblockId": int(iblock_id)},
            "start": start,
        }
        data = caller(webhook_base, method, params, timeout=timeout)
        rows = rows_from_bitrix_list_response(data)
        out.extend(rows)
        if len(rows) < LIST_PAGE_SIZE:
            break
        nxt = data.get("next")
        if nxt is not None:
            try:
                start = int(nxt)
            except (TypeError, ValueError):
                start += LIST_PAGE_SIZE
        else:
            start += LIST_PAGE_SIZE
    return out


def build_xml_id_map_from_bitrix(
    webhook_base: str,
    *,
    product_iblock_id: int | None,
    offer_iblock_id: int | None,
    timeout: int = 120,
    call_fn: Callable[..., dict[str, Any]] | None = None,
) -> tuple[dict[str, int], list[str]]:
    """
    Собирает словарь XML_ID → id.

    Сначала товары (``catalog.product.list``), затем торговые предложения
    (``catalog.product.offer.list``) — при совпадении XML_ID побеждает предложение.
    """
    index: dict[str, int] = {}
    warnings: list[str] = []
    caller = call_fn or call_bitrix_webhook

    if product_iblock_id is not None:
        rows = fetch_all_catalog_rows(
            webhook_base,
            "catalog.product.list",
            product_iblock_id,
            timeout=timeout,
            call_fn=caller,
        )
        merge_xml_id_index(index, rows, source_label="товары", duplicate_warnings=warnings)

    if offer_iblock_id is not None:
        rows = fetch_all_catalog_rows(
            webhook_base,
            "catalog.product.offer.list",
            offer_iblock_id,
            timeout=timeout,
            call_fn=caller,
        )
        merge_xml_id_index(
            index, rows, source_label="торговые предложения", duplicate_warnings=warnings
        )

    return index, warnings


@dataclass
class SyncApplyResult:
    variants_updated: int
    products_updated: int
    variants_skipped_no_key: int
    products_skipped_no_key: int
    variants_no_match: int
    products_no_match: int


def variant_match_key(variant: ProductVariant) -> str:
    """Ключ для поиска в индексе Б24: явный XML_ID на варианте или артикул WB."""
    x = (variant.bitrix_xml_id or "").strip()
    if x:
        return x
    if variant.wb_nm_id is not None:
        return str(int(variant.wb_nm_id))
    return ""


def product_match_key(product: Product) -> str:
    """Ключ: XML_ID на товаре или слаг (если в Б24 внешний код = слаг сайта)."""
    x = (product.bitrix_xml_id or "").strip()
    if x:
        return x
    return (product.slug or "").strip()


def apply_bitrix_catalog_ids(
    xml_id_to_bitrix_id: dict[str, int],
    *,
    dry_run: bool,
    force: bool,
    skip_variants: bool = False,
    skip_products: bool = False,
) -> SyncApplyResult:
    """Проставляет ``bitrix_catalog_id`` у вариантов и товаров."""
    res = SyncApplyResult(
        variants_updated=0,
        products_updated=0,
        variants_skipped_no_key=0,
        products_skipped_no_key=0,
        variants_no_match=0,
        products_no_match=0,
    )

    variant_qs = ProductVariant.objects.select_related("product").order_by("id")
    if not skip_variants:
        to_update: list[ProductVariant] = []
        for v in variant_qs.iterator(chunk_size=500):
            key = variant_match_key(v)
            if not key:
                res.variants_skipped_no_key += 1
                continue
            bid = xml_id_to_bitrix_id.get(key)
            if bid is None:
                res.variants_no_match += 1
                continue
            if not force and v.bitrix_catalog_id is not None:
                continue
            if v.bitrix_catalog_id == bid:
                continue
            v.bitrix_catalog_id = bid
            to_update.append(v)
            res.variants_updated += 1
            if len(to_update) >= 200:
                if not dry_run:
                    ProductVariant.objects.bulk_update(to_update, ["bitrix_catalog_id"])
                to_update.clear()
        if to_update and not dry_run:
            ProductVariant.objects.bulk_update(to_update, ["bitrix_catalog_id"])

    if not skip_products:
        to_update_p: list[Product] = []
        for p in Product.objects.order_by("id").iterator(chunk_size=500):
            key = product_match_key(p)
            if not key:
                res.products_skipped_no_key += 1
                continue
            bid = xml_id_to_bitrix_id.get(key)
            if bid is None:
                res.products_no_match += 1
                continue
            if not force and p.bitrix_catalog_id is not None:
                continue
            if p.bitrix_catalog_id == bid:
                continue
            p.bitrix_catalog_id = bid
            to_update_p.append(p)
            res.products_updated += 1
            if len(to_update_p) >= 200:
                if not dry_run:
                    Product.objects.bulk_update(to_update_p, ["bitrix_catalog_id"])
                to_update_p.clear()
        if to_update_p and not dry_run:
            Product.objects.bulk_update(to_update_p, ["bitrix_catalog_id"])

    return res


@dataclass
class Bitrix24CatalogSyncRunResult:
    """Итог запуска синхронизации (админка или команда)."""

    ok: bool
    error: str | None
    index_size: int
    duplicate_warnings: list[str]
    applied: SyncApplyResult | None
    dry_run: bool


def _sync_run_fail(dry_run: bool, err: str) -> Bitrix24CatalogSyncRunResult:
    return Bitrix24CatalogSyncRunResult(
        ok=False,
        error=err,
        index_size=0,
        duplicate_warnings=[],
        applied=None,
        dry_run=dry_run,
    )


def run_bitrix24_catalog_sync_job(
    *,
    dry_run: bool,
    force: bool,
    no_products: bool = False,
    no_offers: bool = False,
    skip_model_products: bool = False,
    skip_model_variants: bool = False,
    timeout: int = 120,
    webhook_cli: str = "",
    product_iblock_cli: int | None = None,
    offer_iblock_cli: int | None = None,
) -> Bitrix24CatalogSyncRunResult:
    """
    Выгрузка каталога Б24 и обновление ``bitrix_catalog_id`` на сайте.
    Настройки — как у команды ``sync_bitrix_catalog_ids``.
    """
    cfg = resolve_bitrix24_catalog_config(
        webhook_cli=(webhook_cli or "").strip(),
        product_iblock_cli=product_iblock_cli,
        offer_iblock_cli=offer_iblock_cli,
    )
    webhook = cfg.webhook_base
    if not webhook:
        return _sync_run_fail(
            dry_run,
            "Не задан вебхук: раздел «Битрикс24: REST каталог» в настройках сайта или BITRIX24_WEBHOOK_BASE в .env.",
        )

    pid = cfg.product_iblock_id
    oid = cfg.offer_iblock_id
    use_products = not no_products and pid is not None
    use_offers = not no_offers and oid is not None
    if not use_products and not use_offers:
        return _sync_run_fail(
            dry_run,
            "Нужен хотя бы один инфоблок (товары и/или торговые предложения) в настройках или в .env.",
        )

    to = max(10, int(timeout or 120))
    try:
        xml_map, dup_warn = build_xml_id_map_from_bitrix(
            webhook,
            product_iblock_id=pid if use_products else None,
            offer_iblock_id=oid if use_offers else None,
            timeout=to,
        )
    except BitrixRestError as e:
        return _sync_run_fail(dry_run, str(e))

    applied = apply_bitrix_catalog_ids(
        xml_map,
        dry_run=dry_run,
        force=force,
        skip_variants=skip_model_variants,
        skip_products=skip_model_products,
    )
    return Bitrix24CatalogSyncRunResult(
        ok=True,
        error=None,
        index_size=len(xml_map),
        duplicate_warnings=list(dup_warn),
        applied=applied,
        dry_run=dry_run,
    )


__all__ = [
    "Bitrix24CatalogConfig",
    "Bitrix24CatalogSyncRunResult",
    "SyncApplyResult",
    "apply_bitrix_catalog_ids",
    "build_xml_id_map_from_bitrix",
    "fetch_all_catalog_rows",
    "merge_xml_id_index",
    "product_match_key",
    "resolve_bitrix24_catalog_config",
    "rows_from_bitrix_list_response",
    "run_bitrix24_catalog_sync_job",
    "variant_match_key",
]
