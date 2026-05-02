"""Сборка тела /v2/order/create из sellerCheckout (Ozon Доставка)."""

from __future__ import annotations

from ozon_logistics.services.order_create_payload import (
    build_from_checkout_pair,
    resolve_order_create_body,
)


def test_resolve_explicit_order_create_body():
    body = resolve_order_create_body(
        {"orderCreateBody": {"products": [{"sku": 5, "quantity": 1}], "x": 1}},
        customer_phone="+7 900 111-22-33",
    )
    assert body is not None
    assert body["client_phone"] == "79001112233"
    assert body["x"] == 1


def test_resolve_checkout_pair_merges_result_under_request():
    sc = {
        "checkoutRequest": {
            "client_phone": "70000000000",
            "products": [{"sku": 10, "quantity": 2}],
        },
        "checkoutResult": {"result": {"tariff_code": 7, "products": [{"sku": 10, "quantity": 1}]}},
    }
    body = resolve_order_create_body(sc, customer_phone="+79001112233")
    assert body is not None
    assert body["client_phone"] == "79001112233"
    assert body["tariff_code"] == 7
    assert body["products"] == [{"sku": 10, "quantity": 2}]


def test_resolve_skips_when_checkout_error():
    sc = {
        "checkoutRequest": {"client_phone": "79001112233", "products": [{"sku": 1, "quantity": 1}]},
        "checkoutResult": None,
        "checkoutError": "HTTP 400",
    }
    assert resolve_order_create_body(sc, customer_phone="+79001112233") is None


def test_build_from_checkout_pair_rejects_error_shaped_response():
    assert (
        build_from_checkout_pair(
            {"products": [{"sku": 1, "quantity": 1}]},
            {"result": None, "message": "bad"},
            customer_phone="+79001112233",
        )
        is None
    )
