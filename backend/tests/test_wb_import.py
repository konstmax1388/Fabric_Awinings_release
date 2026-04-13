import pytest

from api.wb_import import WbImportError, parse_nm_from_url


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
