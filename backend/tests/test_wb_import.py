import pytest

from api import wb_import
from api.wb_import import WbImportError, min_price_rub_from_card, parse_nm_from_url


@pytest.mark.parametrize(
    "url,expected",
    [
        (
            "https://www.wildberries.ru/catalog/376368075/detail.aspx?targetUrl=GP",
            376368075,
        ),
        ("https://wildberries.ru/catalog/310046861/detail.aspx", 310046861),
        ("  https://www.wildberries.ru/catalog/310046860/detail.aspx  ", 310046860),
    ],
)
def test_parse_nm_from_url_ok(url, expected):
    assert parse_nm_from_url(url) == expected


def test_parse_nm_from_url_empty():
    with pytest.raises(WbImportError):
        parse_nm_from_url("")


def test_parse_nm_from_url_bad():
    with pytest.raises(WbImportError):
        parse_nm_from_url("https://ozon.ru/product/123")


def test_min_price_prefers_sale_price_u_in_sizes():
    card = {
        "sizes": [
            {"price": {"product": 199900, "salePriceU": 149900}},
            {"price": {"product": 189900, "salePriceU": 159900}},
        ]
    }
    assert min_price_rub_from_card(card)[0] == 1499


def test_min_price_fallback_to_top_level_when_sizes_empty():
    card = {"salePriceU": 259900, "priceU": 309900}
    assert min_price_rub_from_card(card)[0] == 2599


def test_fetch_cards_v4_batch_skips_malformed_products(monkeypatch):
    """WB иногда отдаёт мусор в products[] — не падаем с KeyError."""

    def fake_json(url, **kwargs):
        return {
            "products": [
                None,
                {},
                {"foo": 1},
                {"id": "not-int"},
                {"id": 999001},
            ]
        }

    monkeypatch.setattr(wb_import, "_http_json", fake_json)
    out = wb_import.fetch_cards_v4_batch([999001], require_all=True)
    assert 999001 in out
    assert out[999001]["id"] == 999001
