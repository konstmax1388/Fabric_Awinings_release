"""Сопоставление строк корзины с позициями каталога Битрикс24 (поля bitrix_catalog_id)."""

from __future__ import annotations

from typing import Any

from api.models import Product


def resolve_bitrix_catalog_id_for_cart_line(line: dict[str, Any]) -> int | None:
    """
    Возвращает ID товара в каталоге CRM Битрикс24 для строки заказа (как ожидает Astrum в product_id).

    Приоритет: bitrix_catalog_id у варианта (если выбран) → у товара.
    Вариант: variantId в строке; иначе единственный вариант, иначе is_default, иначе первый по порядку.
    """
    slug = (line.get("slug") or "").strip()
    pid_raw = (line.get("productId") or "").strip()
    vid_raw = (line.get("variantId") or "").strip()

    product = None
    if pid_raw.isdigit():
        product = (
            Product.objects.filter(pk=int(pid_raw))
            .prefetch_related("variants")
            .first()
        )
    if product is None and slug:
        product = (
            Product.objects.filter(slug=slug)
            .prefetch_related("variants")
            .first()
        )
    if product is None:
        return None

    variants = list(product.variants.order_by("sort_order", "id"))
    chosen = None
    if vid_raw.isdigit():
        vid_int = int(vid_raw)
        for v in variants:
            if v.pk == vid_int:
                chosen = v
                break
    if chosen is None and len(variants) == 1:
        chosen = variants[0]
    if chosen is None:
        for v in variants:
            if v.is_default:
                chosen = v
                break
    if chosen is None and variants:
        chosen = variants[0]

    if chosen and chosen.bitrix_catalog_id:
        return int(chosen.bitrix_catalog_id)
    if product.bitrix_catalog_id:
        return int(product.bitrix_catalog_id)
    return None
