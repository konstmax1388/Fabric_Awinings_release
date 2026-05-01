"""Суммирование и комбинации скидок по акциям."""

from __future__ import annotations

import datetime as dt

import pytest
from django.utils import timezone

from api.models import Product, ProductCategory, Promotion


@pytest.mark.django_db
def test_stackable_discounts_sum_capped():
    now = timezone.now()
    cat = ProductCategory.objects.create(title="C", slug="c-stack")
    p = Product.objects.create(
        title="P",
        slug="p-stack",
        category=cat,
        excerpt="",
        description="",
        price_from=10000,
        is_published=True,
    )
    a = Promotion.objects.create(
        title="A",
        slug="a-stack",
        excerpt="",
        body="",
        starts_at=now - dt.timedelta(hours=1),
        ends_at=now + dt.timedelta(days=1),
        is_published=True,
        applies_to_all_products=True,
        discount_percent=10,
        stack_with_others=True,
    )
    b = Promotion.objects.create(
        title="B",
        slug="b-stack",
        excerpt="",
        body="",
        starts_at=now - dt.timedelta(hours=1),
        ends_at=now + dt.timedelta(days=2),
        is_published=True,
        applies_to_all_products=True,
        discount_percent=5,
        stack_with_others=True,
    )
    a.products.add(p)
    b.products.add(p)

    from api.services.promotions import best_discount_percent_for_product

    assert best_discount_percent_for_product(p) == 15


@pytest.mark.django_db
def test_exclusive_max_plus_stackable():
    now = timezone.now()
    cat = ProductCategory.objects.create(title="C2", slug="c2-stack")
    p = Product.objects.create(
        title="P2",
        slug="p2-stack",
        category=cat,
        excerpt="",
        description="",
        price_from=10000,
        is_published=True,
    )
    ex = Promotion.objects.create(
        title="Ex20",
        slug="ex20-stack",
        excerpt="",
        body="",
        starts_at=now - dt.timedelta(hours=1),
        is_published=True,
        applies_to_all_products=True,
        discount_percent=20,
        stack_with_others=False,
    )
    st = Promotion.objects.create(
        title="St5",
        slug="st5-stack",
        excerpt="",
        body="",
        starts_at=now - dt.timedelta(hours=1),
        is_published=True,
        applies_to_all_products=True,
        discount_percent=5,
        stack_with_others=True,
    )
    ex.products.add(p)
    st.products.add(p)

    from api.services.promotions import best_discount_percent_for_product

    assert best_discount_percent_for_product(p) == 25


@pytest.mark.django_db
def test_two_exclusive_only_max():
    now = timezone.now()
    cat = ProductCategory.objects.create(title="C3", slug="c3-stack")
    p = Product.objects.create(
        title="P3",
        slug="p3-stack",
        category=cat,
        excerpt="",
        description="",
        price_from=10000,
        is_published=True,
    )
    for slug, pct in (("e15", 15), ("e25", 25)):
        pr = Promotion.objects.create(
            title=slug,
            slug=slug + "-x",
            excerpt="",
            body="",
            starts_at=now - dt.timedelta(hours=1),
            is_published=True,
            applies_to_all_products=True,
            discount_percent=pct,
            stack_with_others=False,
        )
        pr.products.add(p)

    from api.services.promotions import best_discount_percent_for_product

    assert best_discount_percent_for_product(p) == 25
