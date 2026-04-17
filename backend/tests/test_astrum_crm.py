"""Интеграция заказов корзины с Astrum CRM (Битрикс24)."""

from unittest.mock import patch

import pytest
from django.test.utils import override_settings

from api.models import CartOrder, Product, ProductCategory, ProductVariant, SiteSettings
from api.services.astrum_crm import (
    AstrumCrmRuntimeConfig,
    astrum_crm_enabled,
    build_astrum_payload,
    push_cart_order_to_astrum_crm,
    resolve_astrum_crm_config,
)


def _minimal_order() -> CartOrder:
    return CartOrder.objects.create(
        order_ref="FAB-TEST-1",
        customer_name="Тест Тестов",
        customer_phone="+79991234567",
        customer_email="buyer@yandex.ru",
        lines=[
            {
                "productId": "42",
                "slug": "item",
                "title": "Тент тестовый",
                "priceFrom": 15000,
                "qty": 2,
            }
        ],
        total_approx=30000,
        manager_letter="Текст для менеджера",
        client_ack="ok",
    )


def _enable_astrum_in_db():
    s = SiteSettings.get_solo()
    s.astrum_crm_enabled = True
    s.astrum_crm_api_key = "secret"
    s.astrum_crm_assigned_default = 1
    s.save(
        update_fields=[
            "astrum_crm_enabled",
            "astrum_crm_api_key",
            "astrum_crm_assigned_default",
        ]
    )


@pytest.mark.django_db
def test_astrum_disabled_without_key_and_db():
    s = SiteSettings.get_solo()
    s.astrum_crm_enabled = False
    s.astrum_crm_api_key = ""
    s.astrum_crm_assigned_default = None
    s.save()
    with override_settings(ASTRUM_CRM_API_KEY="", ASTRUM_CRM_ASSIGNED_DEFAULT=None):
        assert resolve_astrum_crm_config() is None
        assert astrum_crm_enabled() is False


@pytest.mark.django_db
def test_astrum_from_db_when_enabled():
    _enable_astrum_in_db()
    with override_settings(ASTRUM_CRM_API_KEY="", ASTRUM_CRM_ASSIGNED_DEFAULT=None):
        cfg = resolve_astrum_crm_config()
        assert cfg is not None
        assert cfg.api_key == "secret"
        assert cfg.assigned_default == 1


@pytest.mark.django_db
def test_astrum_admin_enabled_incomplete_does_not_fallback_to_env():
    """Явно включили интеграцию в админке, но не заполнили ключ — env не подмешивается."""
    s = SiteSettings.get_solo()
    s.astrum_crm_enabled = True
    s.astrum_crm_api_key = ""
    s.astrum_crm_assigned_default = None
    s.save()
    with override_settings(ASTRUM_CRM_API_KEY="envonly", ASTRUM_CRM_ASSIGNED_DEFAULT=5):
        assert resolve_astrum_crm_config() is None


@pytest.mark.django_db
def test_astrum_from_env_when_admin_off():
    s = SiteSettings.get_solo()
    s.astrum_crm_enabled = False
    s.save(update_fields=["astrum_crm_enabled"])
    with override_settings(ASTRUM_CRM_API_KEY="envk", ASTRUM_CRM_ASSIGNED_DEFAULT=9):
        cfg = resolve_astrum_crm_config()
        assert cfg is not None
        assert cfg.api_key == "envk"
        assert cfg.assigned_default == 9


@pytest.mark.django_db
def test_build_astrum_payload():
    cat = ProductCategory.objects.create(title="Кат тест", slug="cat-astrum-test", sort_order=0)
    pr = Product.objects.create(
        title="Тент тестовый",
        slug="wb-astrum-test",
        category=cat,
        price_from=15000,
        is_published=True,
    )
    vr = ProductVariant.objects.create(
        product=pr,
        label="Размер M",
        price_from=15000,
        sort_order=0,
        is_default=True,
        bitrix_catalog_id=42,
    )
    order = CartOrder.objects.create(
        order_ref="FAB-TEST-1",
        customer_name="Тест Тестов",
        customer_phone="+79991234567",
        customer_email="buyer@mail.ru",
        lines=[
            {
                "productId": str(pr.pk),
                "variantId": str(vr.pk),
                "slug": pr.slug,
                "title": "Тент тестовый",
                "priceFrom": 15000,
                "qty": 2,
            }
        ],
        total_approx=30000,
        manager_letter="Текст для менеджера",
        client_ack="ok",
    )
    cfg = AstrumCrmRuntimeConfig(
        api_key="k",
        api_url="https://example.com/api/order",
        assigned_default=7,
        contact_behavior="SELECT_EXISTING",
        entity_behavior="ADD_TO_EXISTING",
        deal_title_prefix="Заказ",
        timeout=15,
    )
    p = build_astrum_payload(order, cfg)
    assert p["assigned_default"] == 7
    assert p["contact_behavior"] == "SELECT_EXISTING"
    assert p["contact"]["name"] == "Тест Тестов"
    assert p["contact"]["phone"] == "+79991234567"
    assert p["contact"]["email"] == "buyer@mail.ru"
    assert "FAB-TEST-1" in p["deal"]["title"]
    assert len(p["deal"]["products"]) == 1
    assert p["deal"]["products"][0]["product_name"] == "Тент тестовый"
    assert p["deal"]["products"][0]["price"] == 15000
    assert p["deal"]["products"][0]["quantity"] == 2
    assert p["deal"]["products"][0]["product_id"] == 42


@pytest.mark.django_db
def test_build_astrum_payload_includes_email_from_order():
    """В CRM уходит тот же email, что сохранён в заказе (в т.ч. для старых записей в БД)."""
    order = CartOrder.objects.create(
        order_ref="FAB-TEST-EX",
        customer_name="Тест",
        customer_phone="+79991234567",
        customer_email="user@example.com",
        lines=[{"title": "Товар", "priceFrom": 100, "qty": 1}],
        total_approx=100,
    )
    cfg = AstrumCrmRuntimeConfig(
        api_key="k",
        api_url="https://example.com/api/order",
        assigned_default=1,
        contact_behavior="SELECT_EXISTING",
        entity_behavior="CREATE_ANYWAY",
        deal_title_prefix="Заказ",
        timeout=15,
    )
    p = build_astrum_payload(order, cfg)
    assert p["contact"]["email"] == "user@example.com"
    assert p["contact"]["phone"] == "+79991234567"


@pytest.mark.django_db
@patch("api.services.astrum_crm._post_json")
def test_push_success_updates_order(mock_post):
    mock_post.return_value = (200, '{"id":"crm-99"}', {"id": "crm-99"})
    _enable_astrum_in_db()
    with override_settings(ASTRUM_CRM_API_KEY="", ASTRUM_CRM_ASSIGNED_DEFAULT=None):
        order = _minimal_order()
        assert order.bitrix_sync_status == CartOrder.BitrixSyncStatus.NOT_SENT
        push_cart_order_to_astrum_crm(order)
        order.refresh_from_db()
        assert order.bitrix_sync_status == CartOrder.BitrixSyncStatus.SYNCED
        assert order.bitrix_entity_id == "crm-99"
        assert order.bitrix_sync_attempts == 1
        mock_post.assert_called_once()
        _args, _kwargs = mock_post.call_args
        payload = _args[2]
        assert payload["entity_behavior"] == "CREATE_ANYWAY"


@pytest.mark.django_db
@patch("api.services.astrum_crm._post_json")
def test_push_http_error_sets_error(mock_post):
    mock_post.return_value = (401, '{"detail":"Invalid API key"}', {"detail": "Invalid API key"})
    _enable_astrum_in_db()
    with override_settings(ASTRUM_CRM_API_KEY="", ASTRUM_CRM_ASSIGNED_DEFAULT=None):
        order = _minimal_order()
        push_cart_order_to_astrum_crm(order)
        order.refresh_from_db()
        assert order.bitrix_sync_status == CartOrder.BitrixSyncStatus.ERROR
        assert "Invalid" in order.bitrix_sync_error
