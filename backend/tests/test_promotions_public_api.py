"""Публичный API акций: список и деталь должны отдавать одни и те же «активные» записи."""

from __future__ import annotations

import pytest
from django.utils import timezone
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_promotions_list_and_detail_same_active_window():
    from datetime import timedelta

    from api.models import Promotion

    now = timezone.now()
    p = Promotion.objects.create(
        slug="test-promo-api",
        title="Тестовая акция API",
        excerpt="Кратко",
        body="Текст",
        starts_at=now - timedelta(days=1),
        ends_at=now + timedelta(days=7),
        is_published=True,
        sort_order=0,
        applies_to_all_products=True,
        discount_percent=10,
    )

    client = APIClient(HTTP_HOST="localhost")
    r_list = client.get("/api/promotions/")
    assert r_list.status_code == 200, r_list.content
    data = r_list.json()
    assert isinstance(data, list), data
    slugs = [row.get("slug") for row in data if isinstance(row, dict)]
    assert "test-promo-api" in slugs

    r_detail = client.get("/api/promotions/test-promo-api/")
    assert r_detail.status_code == 200, r_detail.content
    body = r_detail.json()
    assert body.get("slug") == p.slug
    assert body.get("title") == p.title


@pytest.mark.django_db
def test_upcoming_promotion_in_list_and_detail_not_ended():
    """До наступления starts_at акция видна на /sales и открывается по слагу; скидка в корзине — отдельная логика."""
    from datetime import timedelta

    from api.models import Promotion

    now = timezone.now()
    Promotion.objects.create(
        slug="soon-promo",
        title="Скоро старт",
        excerpt="",
        body="Текст заранее",
        starts_at=now + timedelta(days=2),
        ends_at=now + timedelta(days=30),
        is_published=True,
        sort_order=1,
        applies_to_all_products=False,
        discount_percent=15,
    )

    client = APIClient(HTTP_HOST="localhost")
    r_list = client.get("/api/promotions/")
    assert r_list.status_code == 200
    slugs = [row.get("slug") for row in r_list.json() if isinstance(row, dict)]
    assert "soon-promo" in slugs

    r_detail = client.get("/api/promotions/soon-promo/")
    assert r_detail.status_code == 200
    assert r_detail.json().get("slug") == "soon-promo"
