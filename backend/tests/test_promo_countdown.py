"""Конец акции для таймера на витрине (promo_countdown_end_for_product)."""

from __future__ import annotations

import datetime as dt
from datetime import datetime

import pytest
from django.utils import timezone

from api.models import Product, ProductCategory, Promotion


@pytest.mark.django_db
def test_promo_countdown_min_ends_at_among_max_percent_promos():
    now = timezone.now()
    cat = ProductCategory.objects.create(title="C", slug="c-promo-timer")
    p = Product.objects.create(
        title="P",
        slug="p-promo-timer",
        category=cat,
        excerpt="",
        description="",
        price_from=10000,
        is_published=True,
    )
    later = now + dt.timedelta(days=10)
    sooner = now + dt.timedelta(days=2)
    Promotion.objects.create(
        title="Big",
        slug="big-promo-timer",
        excerpt="",
        body="",
        starts_at=now - dt.timedelta(hours=1),
        ends_at=later,
        is_published=True,
        sort_order=0,
        applies_to_all_products=True,
        discount_percent=15,
    )
    Promotion.objects.create(
        title="Sooner end same pct",
        slug="soon-promo-timer",
        excerpt="",
        body="",
        starts_at=now - dt.timedelta(hours=1),
        ends_at=sooner,
        is_published=True,
        sort_order=1,
        applies_to_all_products=True,
        discount_percent=15,
    )

    from api.services.promotions import promo_countdown_end_for_product

    end = promo_countdown_end_for_product(p)
    assert end is not None
    assert abs((end - sooner).total_seconds()) < 2


@pytest.mark.django_db
def test_promo_countdown_none_when_only_open_ended_promo():
    now = timezone.now()
    cat = ProductCategory.objects.create(title="C2", slug="c2-promo-timer")
    p = Product.objects.create(
        title="P2",
        slug="p2-promo-timer",
        category=cat,
        excerpt="",
        description="",
        price_from=5000,
        is_published=True,
    )
    pr = Promotion.objects.create(
        title="Open",
        slug="open-promo-timer",
        excerpt="",
        body="",
        starts_at=now - dt.timedelta(hours=1),
        ends_at=None,
        is_published=True,
        sort_order=0,
        applies_to_all_products=True,
        discount_percent=10,
    )
    pr.products.add(p)

    from api.services.promotions import promo_countdown_end_for_product

    assert promo_countdown_end_for_product(p) is None


@pytest.mark.django_db
def test_product_list_serializer_includes_promo_ends_at(rf):
    now = timezone.now()
    cat = ProductCategory.objects.create(title="C3", slug="c3-promo-timer")
    p = Product.objects.create(
        title="P3",
        slug="p3-promo-timer",
        category=cat,
        excerpt="",
        description="",
        price_from=8000,
        is_published=True,
    )
    end = now + dt.timedelta(days=3)
    Promotion.objects.create(
        title="E",
        slug="e-promo-timer",
        excerpt="",
        body="",
        starts_at=now - dt.timedelta(hours=1),
        ends_at=end,
        is_published=True,
        sort_order=0,
        applies_to_all_products=True,
        discount_percent=5,
    )

    from api.serializers import ProductListSerializer

    data = ProductListSerializer(p, context={"request": rf.get("/")}).data
    assert data.get("promoEndsAt")
    raw = data["promoEndsAt"]
    parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    assert abs((parsed - end).total_seconds()) < 2
    assert data.get("bestPromotionDiscountPercent") == 5


@pytest.mark.django_db
def test_product_list_serializer_best_discount_with_stacked_promos(rf):
    """Итоговый % для клиента — по правилу суммирования; список акций отсортирован по убыванию %."""
    now = timezone.now()
    cat = ProductCategory.objects.create(title="C4", slug="c4-promo-stack-ser")
    p = Product.objects.create(
        title="P4",
        slug="p4-promo-stack-ser",
        category=cat,
        excerpt="",
        description="",
        price_from=10000,
        is_published=True,
    )
    Promotion.objects.create(
        title="A10",
        slug="a10-stack-ser",
        excerpt="",
        body="",
        starts_at=now - dt.timedelta(hours=1),
        ends_at=None,
        is_published=True,
        sort_order=0,
        applies_to_all_products=True,
        discount_percent=10,
        stack_with_others=True,
    )
    Promotion.objects.create(
        title="B5",
        slug="b5-stack-ser",
        excerpt="",
        body="",
        starts_at=now - dt.timedelta(hours=1),
        ends_at=None,
        is_published=True,
        sort_order=1,
        applies_to_all_products=True,
        discount_percent=5,
        stack_with_others=True,
    )

    from api.serializers import ProductListSerializer

    data = ProductListSerializer(p, context={"request": rf.get("/")}).data
    assert data.get("bestPromotionDiscountPercent") == 15
    promos = data.get("promotions") or []
    assert [x["discountPercent"] for x in promos] == [10, 5]
