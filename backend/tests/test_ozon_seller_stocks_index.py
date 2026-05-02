"""Индекс остатков Ozon: v4 stocks[] с sku на строке."""

from __future__ import annotations

from api.services.ozon_seller_stocks import _index_availability


def test_index_maps_v4_stocks_row_sku_to_present():
    """В админке — marketplace SKU из stocks[].sku, не product_id карточки."""
    items = [
        {
            "product_id": 111,
            "offer_id": "OFF-1",
            "stocks": [
                {"sku": 3870288495, "present": 7, "type": "fbs"},
            ],
        }
    ]
    best = _index_availability(items)
    assert best.get(3870288495) == 7
    assert best.get(111) == 7


def test_coerce_present_string():
    from api.services.ozon_seller_stocks import _extract_present

    item = {"stocks": [{"sku": 1, "present": "12"}]}
    assert _extract_present(item) == 12
