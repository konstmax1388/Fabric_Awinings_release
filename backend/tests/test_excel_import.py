import pytest

from api.models import Product, ProductCategory, ProductVariant
from api.product_excel_import import (
    ExcelImportDuplicateError,
    ExcelProductRow,
    build_excel_template_bytes,
    build_header_map,
    find_existing_product_for_excel_row,
    import_one_excel_row,
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


@pytest.mark.django_db
def test_excel_import_duplicate_by_product_ozon_sku():
    cat = ProductCategory.objects.create(title="Cat", slug="cat-excel-dup-oz", sort_order=0)
    Product.objects.create(
        slug="existing-oz",
        title="Уже есть",
        category=cat,
        price_from=1,
        ozon_sku=123456789012345,
    )
    row = ExcelProductRow(
        sheet_row=3,
        title="Другой заголовок",
        price_from=5000,
        wb_url="",
        ozon_url="",
        ozon_sku=123456789012345,
    )
    dup, reasons = find_existing_product_for_excel_row(row)
    assert dup is not None
    assert "SKU Ozon" in " ".join(reasons)
    with pytest.raises(ExcelImportDuplicateError):
        import_one_excel_row(row, category=cat, publish=True, dry_run=False)


@pytest.mark.django_db
def test_excel_import_duplicate_by_variant_ozon_sku():
    cat = ProductCategory.objects.create(title="Cat", slug="cat-excel-dup-ozv", sort_order=0)
    p = Product.objects.create(slug="p-voz", title="Товар", category=cat, price_from=1)
    ProductVariant.objects.create(
        product=p,
        label="V",
        price_from=1,
        sort_order=0,
        is_default=True,
        ozon_sku=987654321098765,
    )
    row = ExcelProductRow(
        sheet_row=4,
        title="Новое имя",
        price_from=100,
        wb_url="",
        ozon_url="",
        ozon_sku=987654321098765,
    )
    with pytest.raises(ExcelImportDuplicateError):
        import_one_excel_row(row, category=cat, publish=True, dry_run=False)


@pytest.mark.django_db
def test_excel_import_duplicate_by_ozon_url_in_marketplace_links():
    cat = ProductCategory.objects.create(title="Cat", slug="cat-excel-dup-ozurl", sort_order=0)
    oz = "https://www.ozon.ru/product/foo-123/"
    Product.objects.create(
        slug="p-oz-url",
        title="С Ozon",
        category=cat,
        price_from=1,
        marketplace_links={"ozon": oz},
    )
    row = ExcelProductRow(
        sheet_row=5,
        title="Импорт",
        price_from=200,
        wb_url="",
        ozon_url=oz,
        ozon_sku=None,
    )
    with pytest.raises(ExcelImportDuplicateError):
        import_one_excel_row(row, category=cat, publish=True, dry_run=False)


@pytest.mark.django_db
def test_excel_import_duplicate_by_wb_nm_in_variant():
    cat = ProductCategory.objects.create(title="Cat", slug="cat-excel-dup-nm", sort_order=0)
    nm = 310046860
    p = Product.objects.create(slug="p-wb-nm", title="WB товар", category=cat, price_from=1)
    ProductVariant.objects.create(
        product=p,
        label="W",
        wb_nm_id=nm,
        price_from=1,
        sort_order=0,
        is_default=True,
        marketplace_wb_url="",
    )
    wb_url = f"https://www.wildberries.ru/catalog/{nm}/detail.aspx"
    row = ExcelProductRow(
        sheet_row=6,
        title="Дубль по nm",
        price_from=300,
        wb_url=wb_url,
        ozon_url="",
        ozon_sku=None,
    )
    with pytest.raises(ExcelImportDuplicateError):
        import_one_excel_row(row, category=cat, publish=True, dry_run=False)
