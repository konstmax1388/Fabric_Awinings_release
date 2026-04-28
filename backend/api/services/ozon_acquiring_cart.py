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


def kopecks_from_items_by_unit_price(*, items: list[dict[str, Any]]) -> int:
    """
    Сумма в копейках по позициям createOrder: Σ (int(price.value) × quantity).
    Ожидается, что `price.value` — цена за единицу в копейках (как в чеке).
    """
    s = 0
    for it in items:
        p = it.get("price")
        if not isinstance(p, dict):
            continue
        raw = p.get("value")
        try:
            v = int(str(raw).strip())
        except (TypeError, ValueError):
            continue
        q = it.get("quantity", 1)
        try:
            n = int(q) if not isinstance(q, str) else int(str(q).strip() or "1")
        except (TypeError, ValueError):
            n = 1
        n = max(1, min(99, n))
        s += v * n
    return s


def lines_missing_ozon_sku(lines: list[dict[str, Any]]) -> list[tuple[int, str]]:
    """
    Строки корзины, для которых не удаётся определить Ozon SKU (нужен для MODE_FULL / логистика).
    Возвращает (номер строки 1-based, краткое имя).
    """
    out: list[tuple[int, str]] = []
    for i, line in enumerate(lines):
        if _resolve_sku_for_line(line) is None:
            title = str(line.get("title") or "Товар").strip()[:200] or "Товар"
            out.append((i + 1, title))
    return out


def _resolve_sku_for_line(line: dict[str, Any]) -> int | None:
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


def _split_cart_line_to_unit_items() -> bool:
    """По умолчанию: одна единица — одна запись в items с quantity=1 (некоторые контуры payapi так валидируют)."""
    v = _env("OZON_PAY_CREATE_ORDER_ONE_ITEM_PER_UNIT", "1").lower()
    return v not in ("0", "false", "no", "off")


def build_create_order_items(
    *,
    order_ref: str,
    lines: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Позиции для MODE_SHORTENED / MODE_FULL.

    `price.value` — цена за **одну** единицу в копейках. По умолчанию (см. env) каждая штука
    в корзине — отдельный элемент `items[]` с ``quantity: 1`` и уникальным `extId`, чтобы
    сумма Σ (value×quantity) совпадала с `amount` без споров API про «количество в строке».
    Отключение: ``OZON_PAY_CREATE_ORDER_ONE_ITEM_PER_UNIT=0`` — тогда снова одна строка на
    товар с ``quantity: qty`` (как в корзине).
    """
    currency = _env("OZON_PAY_CURRENCY_CODE", "643")
    vat = _env("OZON_PAY_ITEM_VAT", "VAT_20")
    item_type = _env("OZON_PAY_ITEM_TYPE", "TYPE_PRODUCT")
    one_per_unit = _split_cart_line_to_unit_items()

    items: list[dict[str, Any]] = []
    for i, line in enumerate(lines):
        title = str(line.get("title") or "Товар").strip()[:500] or "Товар"
        qty = max(1, min(99, int(line.get("qty") or 1)))
        price_rub = max(0, int(line.get("priceFrom") or 0))
        value_kop = str(price_rub * 100)
        sku = _resolve_sku_for_line(line)

        if one_per_unit:
            for u in range(1, qty + 1):
                ext_id = f"{order_ref}-L{i + 1}U{u}"
                item: dict[str, Any] = {
                    "extId": ext_id,
                    "name": title,
                    "price": {"currencyCode": currency, "value": value_kop},
                    "quantity": 1,
                    "type": item_type,
                    "vat": vat,
                }
                if sku is not None:
                    item["sku"] = sku
                else:
                    logger.debug("Ozon createOrder line %s: SKU не найден (extId=%s)", i, ext_id)
                items.append(item)
        else:
            ext_id = f"{order_ref}-L{i + 1}"
            item = {
                "extId": ext_id,
                "name": title,
                "price": {"currencyCode": currency, "value": value_kop},
                "quantity": qty,
                "type": item_type,
                "vat": vat,
            }
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
