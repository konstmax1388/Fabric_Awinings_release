"""Тесты приложения ozon_logistics (без реальных вызовов Ozon)."""

from __future__ import annotations

import pytest

from ozon_logistics.models import OzonLogisticsSettings
from ozon_logistics.services.exceptions import OzonLogisticsConfigError


@pytest.mark.django_db
def test_ozon_logistics_settings_singleton():
    a = OzonLogisticsSettings.get_solo()
    b = OzonLogisticsSettings.get_solo()
    assert a.pk == 1
    assert a.pk == b.pk


@pytest.mark.django_db
def test_logistics_credentials_raises_without_keys(monkeypatch):
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_CLIENT_ID", raising=False)
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_API_KEY", raising=False)
    OzonLogisticsSettings.objects.filter(pk=1).update(client_id="", api_key="")
    from ozon_logistics.services.credentials import logistics_seller_credentials

    with pytest.raises(OzonLogisticsConfigError):
        logistics_seller_credentials()


@pytest.mark.django_db
def test_logistics_credentials_from_db(monkeypatch):
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_CLIENT_ID", raising=False)
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_API_KEY", raising=False)
    OzonLogisticsSettings.objects.filter(pk=1).update(client_id="cid-test", api_key="key-test")
    from ozon_logistics.services.credentials import logistics_seller_credentials

    assert logistics_seller_credentials() == ("cid-test", "key-test")


@pytest.mark.django_db
def test_logistics_credentials_env_overrides_db(monkeypatch):
    OzonLogisticsSettings.objects.filter(pk=1).update(client_id="from-db", api_key="from-db")
    monkeypatch.setenv("OZON_LOGISTICS_SELLER_CLIENT_ID", "from-env")
    monkeypatch.setenv("OZON_LOGISTICS_SELLER_API_KEY", "secret-env")
    from ozon_logistics.services.credentials import logistics_seller_credentials

    assert logistics_seller_credentials() == ("from-env", "secret-env")


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("+7 (900) 123-45-67", "79001234567"),
        ("89001234567", "79001234567"),
        ("9001234567", "79001234567"),
        (None, None),
        ("", None),
    ],
)
@pytest.mark.django_db
def test_normalize_phone_digits(raw, expected):
    from ozon_logistics.services.order_guard import normalize_phone_digits

    assert normalize_phone_digits(raw) == expected


@pytest.mark.django_db
def test_assert_phone_allowed_when_restriction_off(monkeypatch):
    monkeypatch.delenv("OZON_LOGISTICS_ORDER_INTERNAL_PHONES_ONLY", raising=False)
    OzonLogisticsSettings.objects.filter(pk=1).update(
        order_create_only_internal_phones=False,
        internal_phones_allowlist="",
    )
    from ozon_logistics.services.order_guard import assert_order_create_phone_allowed

    assert_order_create_phone_allowed("+79999999999")


@pytest.mark.django_db
def test_assert_phone_rejects_empty_allowlist_when_restricted(monkeypatch):
    monkeypatch.delenv("OZON_LOGISTICS_ORDER_INTERNAL_PHONES_ONLY", raising=False)
    OzonLogisticsSettings.objects.filter(pk=1).update(
        order_create_only_internal_phones=True,
        internal_phones_allowlist="",
    )
    from ozon_logistics.services.exceptions import OzonLogisticsPhoneNotAllowedError
    from ozon_logistics.services.order_guard import assert_order_create_phone_allowed

    with pytest.raises(OzonLogisticsPhoneNotAllowedError):
        assert_order_create_phone_allowed("+79000000000")


@pytest.mark.django_db
def test_assert_phone_allowlist_match(monkeypatch):
    monkeypatch.delenv("OZON_LOGISTICS_ORDER_INTERNAL_PHONES_ONLY", raising=False)
    OzonLogisticsSettings.objects.filter(pk=1).update(
        order_create_only_internal_phones=True,
        internal_phones_allowlist="9001112233\n+7 900 111-22-44",
    )
    from ozon_logistics.services.order_guard import assert_order_create_phone_allowed

    assert_order_create_phone_allowed("9001112233")
    assert_order_create_phone_allowed("+79001112244")


@pytest.mark.django_db
def test_restrict_phones_env_overrides_db_off(monkeypatch):
    OzonLogisticsSettings.objects.filter(pk=1).update(
        order_create_only_internal_phones=False,
        internal_phones_allowlist="9001112233",
    )
    monkeypatch.setenv("OZON_LOGISTICS_ORDER_INTERNAL_PHONES_ONLY", "true")
    from ozon_logistics.services.exceptions import OzonLogisticsPhoneNotAllowedError
    from ozon_logistics.services.order_guard import assert_order_create_phone_allowed

    with pytest.raises(OzonLogisticsPhoneNotAllowedError):
        assert_order_create_phone_allowed("+79001234567")


@pytest.mark.django_db
def test_seller_delivery_api_enabled_env(monkeypatch):
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_DELIVERY_API_ENABLED", raising=False)
    OzonLogisticsSettings.objects.filter(pk=1).update(seller_delivery_api_enabled=False)
    from ozon_logistics.services.order_guard import seller_delivery_api_enabled

    assert seller_delivery_api_enabled() is False
    monkeypatch.setenv("OZON_LOGISTICS_SELLER_DELIVERY_API_ENABLED", "1")
    assert seller_delivery_api_enabled() is True


@pytest.mark.django_db
def test_order_create_with_phone_guard_mocks_http(monkeypatch):
    monkeypatch.delenv("OZON_LOGISTICS_ORDER_INTERNAL_PHONES_ONLY", raising=False)
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_CLIENT_ID", raising=False)
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_API_KEY", raising=False)
    OzonLogisticsSettings.objects.filter(pk=1).update(
        order_create_only_internal_phones=False,
        client_id="cid",
        api_key="key",
    )
    called: list[tuple] = []

    def fake_post(path, body, **kwargs):
        called.append((path, body))
        return {"sent": True}

    monkeypatch.setattr("ozon_logistics.services.delivery_api.post_seller_json", fake_post)
    from ozon_logistics.services.delivery_api import order_create_with_phone_guard

    r = order_create_with_phone_guard({"x": 1}, customer_phone="+79001112233")
    assert r == {"sent": True}
    assert called == [("/v2/order/create", {"x": 1})]
