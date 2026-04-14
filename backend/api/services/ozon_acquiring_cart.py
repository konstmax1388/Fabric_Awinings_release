"""
Сбор тел createOrder для Ozon Pay: позиции корзины и сумма (MODE_FULL + Ozon Логистика).

https://docs.ozon.ru/api/acquiring/ — deliverySettings.isEnabled, items (extId / sku).
"""

from __future__ import annotations

import logging
import os
from typing import Any

from api.models import Product, ProductVariant

logger = logging.getLogger(__name__)


def _env(name: str, default: str = "") -> str:
    return (os.environ.get(name) or default).strip()


def total_kopecks_from_cart_lines(lines: list[dict[str, Any]]) -> int:
    total = 0
    for line in lines:
        price_rub = max(0, int(line.get("priceFrom") or 0))
        qty = max(1, int(line.get("qty") or 1))
        total += price_rub * 100 * qty
    return total


def _resolve_sku_for_line(line: dict[str, Any]) -> int | None:
    raw = line.get("ozonSku")
    if raw is not None and raw != "":
        try:
            return int(raw)
        except (TypeError, ValueError):
            pass

    pid = line.get("productId") or ""
    vid = (line.get("variantId") or "").strip()
    try:
        pk = int(str(pid))
    except (TypeError, ValueError):
        return None

    try:
        prod = Product.objects.only("ozon_sku").get(pk=pk)
    except Product.DoesNotExist:
        return None

    if vid:
        try:
            vpk = int(str(vid))
            var = ProductVariant.objects.only("ozon_sku", "product_id").get(pk=vpk, product_id=pk)
            if var.ozon_sku is not None:
                return int(var.ozon_sku)
        except (ValueError, TypeError, ProductVariant.DoesNotExist):
            pass

    if prod.ozon_sku is not None:
        return int(prod.ozon_sku)
    return None


def build_create_order_items(
    *,
    order_ref: str,
    lines: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Позиции для MODE_FULL (цена строки — priceFrom за единицу, в value копейки)."""
    currency = _env("OZON_PAY_CURRENCY_CODE", "643")
    vat = _env("OZON_PAY_ITEM_VAT", "VAT_20")
    item_type = _env("OZON_PAY_ITEM_TYPE", "TYPE_PRODUCT")

    items: list[dict[str, Any]] = []
    for i, line in enumerate(lines):
        title = str(line.get("title") or "Товар").strip()[:500] or "Товар"
        qty = max(1, min(99, int(line.get("qty") or 1)))
        price_rub = max(0, int(line.get("priceFrom") or 0))
        value_kop = str(price_rub * 100)
        ext_id = f"{order_ref}-L{i + 1}"

        item: dict[str, Any] = {
            "extId": ext_id,
            "name": title,
            "price": {"currencyCode": currency, "value": value_kop},
            "quantity": qty,
            "type": item_type,
            "vat": vat,
        }
        sku = _resolve_sku_for_line(line)
        if sku is not None:
            item["sku"] = sku
        else:
            logger.debug("Ozon createOrder line %s: SKU не найден (extId=%s)", i, ext_id)

        items.append(item)
    return items


def synthetic_single_item_order(
    *,
    order_ref: str,
    amount_kopecks: int,
    title: str = "Заказ с сайта",
) -> list[dict[str, Any]]:
    """Одна строка на всю сумму, если корзина пуста (крайний случай)."""
    currency = _env("OZON_PAY_CURRENCY_CODE", "643")
    vat = _env("OZON_PAY_ITEM_VAT", "VAT_20")
    item_type = _env("OZON_PAY_ITEM_TYPE", "TYPE_PRODUCT")
    return [
        {
            "extId": f"{order_ref}-ORDER",
            "name": title[:500],
            "price": {"currencyCode": currency, "value": str(max(0, amount_kopecks))},
            "quantity": 1,
            "type": item_type,
            "vat": vat,
        }
    ]
