import pytest

from api.product_excel_import import (
    build_header_map,
    build_excel_template_bytes,
    normalize_header_cell,
    parse_price_int,
    parse_product_rows_from_workbook,
)


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("Название", "название"),
        ("  SKU   Ozon  ", "sku ozon"),
        ("«Цена»", "цена"),
    ],
)
def test_normalize_header_cell(raw, expected):
    assert normalize_header_cell(raw) == expected


def test_build_header_map_typical_headers():
    header = ("Название", "Цена на сайте", "Ссылка WB", "Ссылка Ozon", "SKU Ozon")
    m = build_header_map(header)
    assert m["title"] == 0
    assert m["price"] == 1
    assert m["wb_url"] == 2
    assert m["ozon_url"] == 3
    assert m["ozon_sku"] == 4


def test_build_header_map_product_price_ozon_wb_skuozon():
    header = ("product", "price", "ozon", "wb", "skuozon")
    m = build_header_map(header)
    assert m["title"] == 0
    assert m["price"] == 1
    assert m["ozon_url"] == 2
    assert m["wb_url"] == 3
    assert m["ozon_sku"] == 4


@pytest.mark.parametrize(
    "val,expected",
    [
        (125000, 125000),
        (125000.7, 125001),
        ("1 234", 1234),
        ("12,5", 12),
        ("", None),
        (None, None),
    ],
)
def test_parse_price_int(val, expected):
    assert parse_price_int(val) == expected


def test_parse_workbook_minimal_xlsx():
    from openpyxl import Workbook
    from io import BytesIO

    wb = Workbook()
    ws = wb.active
    ws.append(["Название", "Цена на сайте", "Ссылка WB"])
    ws.append(["Тестовый товар", 100, ""])
    bio = BytesIO()
    wb.save(bio)
    rows, warns = parse_product_rows_from_workbook(bio.getvalue())
    assert not warns or isinstance(warns, list)
    assert len(rows) == 1
    assert rows[0].title == "Тестовый товар"
    assert rows[0].price_from == 100
    assert rows[0].wb_url == ""


def test_build_excel_template_bytes_is_valid_xlsx():
    data = build_excel_template_bytes()
    assert len(data) > 100
    assert data[:4] == b"PK\x03\x04"
