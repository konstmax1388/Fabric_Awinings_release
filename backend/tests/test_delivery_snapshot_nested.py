import pytest

from api.services.delivery_snapshot import sanitize_checkout_delivery


def test_sanitize_ozon_logistics_preserves_nested_seller_checkout():
    raw = {
        "city": "Москва",
        "ozonLogistics": {
            "hint": "тест",
            "sellerCheckout": {
                "items": [{"sku": 123, "qty": 1}],
                "nested": {"a": 1, "b": [1, 2]},
            },
        },
    }
    out = sanitize_checkout_delivery(raw)
    assert out["city"] == "Москва"
    ol = out.get("ozonLogistics") or {}
    assert ol.get("hint") == "тест"
    sc = ol.get("sellerCheckout")
    assert isinstance(sc, dict)
    assert isinstance(sc.get("items"), list)
    assert sc["nested"]["a"] == 1
