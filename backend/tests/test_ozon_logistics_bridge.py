"""Мост ozon_logistics после оплаты."""

from __future__ import annotations

import pytest

from api.models import CartOrder
from api.services.ozon_logistics_bridge import try_seller_logistics_after_ozon_payment


@pytest.mark.django_db
def test_bridge_skips_when_seller_api_disabled(monkeypatch):
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_DELIVERY_API_ENABLED", raising=False)
    from ozon_logistics.models import OzonLogisticsSettings

    OzonLogisticsSettings.objects.filter(pk=1).update(seller_delivery_api_enabled=False)
    co = CartOrder.objects.create(
        order_ref="BR-SKIP-1",
        customer_name="Т",
        customer_phone="+79001112233",
        customer_email="a@b.c",
        customer_comment="",
        delivery_method=CartOrder.DeliveryMethod.OZON_LOGISTICS,
        payment_method=CartOrder.PaymentMethod.CARD_ONLINE,
        payment_status=CartOrder.PaymentStatus.CAPTURED,
        fulfillment_status=CartOrder.FulfillmentStatus.PAID,
        lines=[],
        total_approx=100,
        delivery_snapshot={"ozonLogistics": {"hint": "x"}},
        acquiring_payload={},
    )
    try_seller_logistics_after_ozon_payment(co)
    co.refresh_from_db()
    assert "ozonLogisticsSellerApi" not in (co.acquiring_payload or {})


@pytest.mark.django_db
def test_bridge_delivery_check_when_enabled(monkeypatch):
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_DELIVERY_API_ENABLED", raising=False)
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_CLIENT_ID", raising=False)
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_API_KEY", raising=False)
    from ozon_logistics.models import OzonLogisticsSettings

    OzonLogisticsSettings.objects.filter(pk=1).update(
        seller_delivery_api_enabled=True,
        client_id="cid",
        api_key="key",
        order_create_only_internal_phones=False,
    )

    def fake_delivery_check(body):
        return {"mock": True, "body": body}

    monkeypatch.setattr("ozon_logistics.services.delivery_check", fake_delivery_check)

    co = CartOrder.objects.create(
        order_ref="BR-CHK-1",
        customer_name="Т",
        customer_phone="+7 900 111-22-33",
        customer_email="a@b.c",
        customer_comment="",
        delivery_method=CartOrder.DeliveryMethod.OZON_LOGISTICS,
        payment_method=CartOrder.PaymentMethod.CARD_ONLINE,
        payment_status=CartOrder.PaymentStatus.CAPTURED,
        fulfillment_status=CartOrder.FulfillmentStatus.PAID,
        lines=[],
        total_approx=100,
        delivery_snapshot={},
        acquiring_payload={},
    )
    try_seller_logistics_after_ozon_payment(co)
    co.refresh_from_db()
    ap = co.acquiring_payload or {}
    chk = (ap.get("ozonLogisticsSellerApi") or {}).get("deliveryCheck") or {}
    assert chk.get("result", {}).get("mock") is True
    assert chk.get("request", {}).get("client_phone") == "79001112233"


@pytest.mark.django_db
def test_bridge_order_create_uses_resolved_body_from_checkout_pair(monkeypatch):
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_DELIVERY_API_ENABLED", raising=False)
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_CLIENT_ID", raising=False)
    monkeypatch.delenv("OZON_LOGISTICS_SELLER_API_KEY", raising=False)
    from ozon_logistics.models import OzonLogisticsSettings

    OzonLogisticsSettings.objects.filter(pk=1).update(
        seller_delivery_api_enabled=True,
        client_id="cid",
        api_key="key",
        order_create_only_internal_phones=False,
    )

    def fake_delivery_check(body):
        return {"ok": True}

    monkeypatch.setattr("ozon_logistics.services.delivery_check", fake_delivery_check)

    captured: dict = {}

    def fake_order_create_with_phone_guard(body, *, customer_phone=None):
        captured["body"] = body
        return {"created": True}

    monkeypatch.setattr(
        "ozon_logistics.services.delivery_api.order_create_with_phone_guard",
        fake_order_create_with_phone_guard,
    )

    co = CartOrder.objects.create(
        order_ref="BR-OC-1",
        customer_name="Т",
        customer_phone="+7 900 111-22-33",
        customer_email="a@b.c",
        customer_comment="",
        delivery_method=CartOrder.DeliveryMethod.OZON_LOGISTICS,
        payment_method=CartOrder.PaymentMethod.CARD_ONLINE,
        payment_status=CartOrder.PaymentStatus.CAPTURED,
        fulfillment_status=CartOrder.FulfillmentStatus.PAID,
        lines=[],
        total_approx=100,
        delivery_snapshot={
            "ozonLogistics": {
                "sellerCheckout": {
                    "checkoutRequest": {
                        "client_phone": "70000000000",
                        "products": [{"sku": 1, "quantity": 2}],
                    },
                    "checkoutResult": {"result": {"tariff_code": 99}},
                }
            }
        },
        acquiring_payload={},
    )
    try_seller_logistics_after_ozon_payment(co)
    co.refresh_from_db()
    b = captured.get("body") or {}
    assert b.get("client_phone") == "79001112233"
    assert b.get("tariff_code") == 99
    assert b.get("products") == [{"sku": 1, "quantity": 2}]
    oc = (co.acquiring_payload or {}).get("ozonLogisticsSellerApi", {}).get("orderCreate") or {}
    assert oc.get("ok") is True
