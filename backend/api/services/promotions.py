"""Активные акции и скидка для товара (заказ с сайта)."""

from __future__ import annotations

from typing import Any

from django.db.models import Q
from django.utils import timezone

from api.models import Product, Promotion

_UNSET = object()


def _active_promotions_qs():
    now = timezone.now()
    return Promotion.objects.filter(is_published=True, starts_at__lte=now).filter(
        Q(ends_at__isnull=True) | Q(ends_at__gte=now)
    )


def _promotions_applying_with_discount(product: Product) -> list[Promotion]:
    return list(
        _active_promotions_qs()
        .filter(discount_percent__gt=0)
        .filter(Q(applies_to_all_products=True) | Q(products=product))
        .distinct()
    )


def promotion_discount_bundle_for_product(product: Product) -> tuple[int, list[Promotion]]:
    """Итоговый % скидки и список акций с ненулевой скидкой на товар (с кэшем на инстансе)."""
    cached = getattr(product, "_fabric_promotion_bundle", _UNSET)
    if cached is not _UNSET:
        return cached  # type: ignore[return-value]

    promos = _promotions_applying_with_discount(product)
    if not promos:
        product._fabric_promotion_bundle = (0, [])  # type: ignore[attr-defined]
        return 0, []

    stack_sum = 0
    exclusives: list[int] = []
    for p in promos:
        try:
            d = int(p.discount_percent)
        except (TypeError, ValueError):
            d = 0
        d = max(0, min(100, d))
        if getattr(p, "stack_with_others", False):
            stack_sum += d
        else:
            exclusives.append(d)

    stack_sum = min(100, stack_sum)
    exclusive_part = max(exclusives) if exclusives else 0
    exclusive_part = max(0, min(100, exclusive_part))
    total = min(100, stack_sum + exclusive_part)

    product._fabric_promotion_bundle = (total, promos)  # type: ignore[attr-defined]
    return total, promos


def best_discount_percent_for_product(product: Product) -> int:
    """Эффективная скидка, %: суммируемые акции + максимум среди несуммируемых (каждая не более 100% суммарно)."""
    return promotion_discount_bundle_for_product(product)[0]


def apply_percent_discount(base_rub: int, percent: int) -> int:
    if percent <= 0 or base_rub <= 0:
        return max(0, int(base_rub))
    return max(0, int(base_rub) * (100 - max(0, min(100, percent))) // 100)


def promo_countdown_end_for_product(product: Product):
    """Ближайшее окончание среди действующих акций со скидкой на товар (если есть даты окончания)."""
    cached = getattr(product, "_fabric_promotion_countdown_end", _UNSET)
    if cached is not _UNSET:
        return cached

    total, promos = promotion_discount_bundle_for_product(product)
    if total <= 0:
        product._fabric_promotion_countdown_end = None  # type: ignore[attr-defined]
        return None

    ends = [p.ends_at for p in promos if p.ends_at is not None]
    if not ends:
        product._fabric_promotion_countdown_end = None  # type: ignore[attr-defined]
        return None
    end = min(ends)
    product._fabric_promotion_countdown_end = end  # type: ignore[attr-defined]
    return end


def active_promotion_summaries_for_product(product: Product) -> list[dict[str, Any]]:
    """Все действующие акции на товар (в т.ч. 0% — информационные), для ссылок на витрине."""
    promos = list(
        _active_promotions_qs()
        .filter(Q(applies_to_all_products=True) | Q(products=product))
        .distinct()
        .order_by("sort_order", "-discount_percent", "id")
    )
    out: list[dict[str, Any]] = []
    for p in promos[:16]:
        try:
            d = int(p.discount_percent)
        except (TypeError, ValueError):
            d = 0
        d = max(0, min(100, d))
        out.append(
            {
                "slug": p.slug,
                "title": p.title,
                "discountPercent": d,
                "stackWithOthers": bool(getattr(p, "stack_with_others", False)),
                "endsAt": p.ends_at.isoformat() if p.ends_at else None,
            }
        )
    # Сначала самые «жирные» по заявленному % (для ссылок/чипов); итог для кошелька — в best_discount_percent_for_product.
    out.sort(key=lambda row: (-int(row["discountPercent"]), str(row["slug"])))
    return out
