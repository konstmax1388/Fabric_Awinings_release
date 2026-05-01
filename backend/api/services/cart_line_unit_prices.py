"""Цена строки корзины: база из каталога и итог за единицу (с учётом акций на сайте)."""

from __future__ import annotations

from api.models import Product, ProductVariant
from api.services.promotions import apply_percent_discount, best_discount_percent_for_product


def list_unit_price_rub(*, product: Product, variant: ProductVariant | None) -> int:
    """Цена из каталога (до скидки), ₽ за единицу."""
    if variant is not None:
        return max(0, int(variant.price_from))
    variants = list(product.variants.order_by("sort_order", "id"))
    if variants:
        return min(max(0, int(v.price_from)) for v in variants)
    return max(0, int(product.price_from))


def effective_unit_price_rub(*, product: Product, variant: ProductVariant | None) -> int:
    """Итоговая цена за единицу для прямого заказа с сайта (после акций)."""
    base = list_unit_price_rub(product=product, variant=variant)
    pct = best_discount_percent_for_product(product)
    if variant is not None:
        return apply_percent_discount(base, pct)
    variants = list(product.variants.order_by("sort_order", "id"))
    if not variants:
        return apply_percent_discount(base, pct)
    return min(apply_percent_discount(max(0, int(v.price_from)), pct) for v in variants)
