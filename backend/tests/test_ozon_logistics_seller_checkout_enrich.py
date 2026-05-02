"""Серверный вызов delivery/checkout при оформлении заказа Ozon."""

from __future__ import annotations

import pytest

from api.services.ozon_logistics_seller_checkout_enrich import enrich_ozon_logistics_delivery_snapshot


@pytest.mark.django_db
def test_enrich_calls_delivery_checkout_when_flag_on(monkeypatch):
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_DELIVERY_API_ENABLED", raising=False)
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_CLIENT_ID", raising=False)
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_API_KEY", raising=False)
    from api.models import Product, ProductCategory
    from ozon_logistics.models import OzonLogisticsSettings

    OzonLogisticsSettings.objects.filter(pk=1).update(seller_delivery_api_enabled=True)
    cat = ProductCategory.objects.create(title="C", slug="c-oz-enrich", sort_order=0)
    p = Product.objects.create(
        title="P",
        slug="p-oz-enrich",
        category=cat,
        price_from=100,
        ozon_sku=555444333,
    )

    calls: list = []

    def fake_delivery_checkout(body):
        calls.append(body)
        return {"result": {"ok": True}}

    monkeypatch.setattr("ozon_logistics.services.delivery_checkout", fake_delivery_checkout)

    lines = [{"productId": str(p.id), "variantId": "", "qty": 1, "priceFrom": 100}]
    snap = {"city": "Москва", "address": "ул. Тест 1", "ozonLogistics": {"hint": "h"}}
    out = enrich_ozon_logistics_delivery_snapshot(
        snap,
        lines_plain=lines,
        customer_phone="+7 900 111-22-33",
    )
    assert calls
    assert calls[0]["client_phone"] == "79001112233"
    assert calls[0]["address"] == "Москва, ул. Тест 1"
    ol = out.get("ozonLogistics") or {}
    sc = ol.get("sellerCheckout") or {}
    assert sc.get("checkoutResult") == {"result": {"ok": True}}


@pytest.mark.django_db
def test_enrich_noop_when_seller_api_disabled(monkeypatch):
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_DELIVERY_API_ENABLED", raising=False)
    from ozon_logistics.models import OzonLogisticsSettings

    OzonLogisticsSettings.objects.filter(pk=1).update(seller_delivery_api_enabled=False)

    def boom(_body):
        raise AssertionError("should not call")

    monkeypatch.setattr("ozon_logistics.services.delivery_checkout", boom)
    out = enrich_ozon_logistics_delivery_snapshot(
        {"ozonLogistics": {}},
        lines_plain=[{"productId": "1", "qty": 1}],
        customer_phone="+79001112233",
    )
    assert "sellerCheckout" not in (out.get("ozonLogistics") or {})
