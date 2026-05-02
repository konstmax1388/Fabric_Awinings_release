"""Импорт товаров из Excel (.xlsx): название и цена с файла, опционально WB/Ozon и SKU Ozon."""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import Any

from django.db import transaction
from django.utils.text import slugify

from .models import Product, ProductCategory, ProductVariant
from .product_wb_import import WbImportError, import_one_from_wb_url
from .wb_import import parse_nm_from_url

HEADER_SYNONYMS: dict[str, tuple[str, ...]] = {
    "title": (
        "product",
        "product price",
        "product name",
        "product title",
        "название",
        "наименование",
        "name",
        "title",
        "товар",
        "название для сайта",
        "имя",
    ),
    "price": (
        "цена",
        "price",
        "цена на сайте",
        "цена на сайт",
        "цена_на_сайте",
        "цена_сайта",
        "цена сайта",
        "цена для сайта",
    ),
    "wb_url": (
        "wb",
        "wildberries",
        "ссылка wb",
        "ссылка_wb",
        "url wb",
        "url_wb",
        "ссылка wildberries",
        "ссылка на wb",
        "ссылка на wildberries",
        "wildberries url",
    ),
    "ozon_url": (
        "ozon",
        "ссылка ozon",
        "ссылка_ozon",
        "url ozon",
        "url_ozon",
        "ссылка на ozon",
        "ozon url",
    ),
    "ozon_sku": (
        "skuozon",
        "sku ozon",
        "sku_ozon",
        "ozon sku",
        "ozon_sku",
        "артикул ozon",
        "артикул_ozon",
        "sku товара ozon",
    ),
}


def normalize_header_cell(val: Any) -> str:
    if val is None:
        return ""
    s = str(val).strip().lower()
    for ch in "«»\"'„“”":
        s = s.replace(ch, "")
    s = " ".join(s.split())
    return s


def build_header_map(header_row: tuple[Any, ...] | list[Any]) -> dict[str, int]:
    """Ключ поля -> индекс столбца (0-based)."""
    norm_to_idx: dict[str, int] = {}
    for idx, cell in enumerate(header_row):
        nh = normalize_header_cell(cell)
        if nh:
            norm_to_idx[nh] = idx
    out: dict[str, int] = {}
    for key, synonyms in HEADER_SYNONYMS.items():
        for syn in synonyms:
            if syn in norm_to_idx:
                out[key] = norm_to_idx[syn]
                break
    return out


def parse_price_int(val: Any) -> int | None:
    if val is None or val == "":
        return None
    if isinstance(val, bool):
        return None
    if isinstance(val, (int, float)):
        if isinstance(val, float) and val != val:  # NaN
            return None
        return max(0, int(round(float(val))))
    s = str(val).strip().replace("\u00a0", " ").replace(" ", "")
    s = s.replace(",", ".")
    if not s:
        return None
    try:
        return max(0, int(round(float(s))))
    except ValueError:
        return None


def parse_ozon_sku_int(val: Any) -> int | None:
    if val is None or val == "":
        return None
    if isinstance(val, bool):
        return None
    if isinstance(val, (int, float)):
        if isinstance(val, float) and val != val:
            return None
        n = int(round(float(val)))
        return n if n > 0 else None
    s = str(val).strip().replace("\u00a0", "").replace(" ", "")
    if not s:
        return None
    try:
        n = int(round(float(s)))
        return n if n > 0 else None
    except ValueError:
        return None


def _cell(row: tuple[Any, ...], col: int | None) -> Any:
    if col is None:
        return None
    if col < 0 or col >= len(row):
        return None
    return row[col]


def _row_str(row: tuple[Any, ...], key: str, header_map: dict[str, int]) -> str:
    v = _cell(row, header_map.get(key))
    if v is None:
        return ""
    return str(v).strip()


@dataclass(frozen=True)
class ExcelProductRow:
    """Одна строка листа (после заголовка)."""

    sheet_row: int
    title: str
    price_from: int
    wb_url: str
    ozon_url: str
    ozon_sku: int | None


class ExcelImportParseError(ValueError):
    pass


def parse_product_rows_from_workbook(file_content: bytes) -> tuple[list[ExcelProductRow], list[str]]:
    """
    Читает первый лист .xlsx. Первая строка — заголовки.
    Возвращает (строки данных, предупреждения по структуре файла).
    """
    try:
        from openpyxl import load_workbook
    except ImportError as e:
        raise ExcelImportParseError(
            "Не установлен пакет openpyxl. Установите зависимости: pip install -r requirements.txt"
        ) from e

    warns: list[str] = []
    wb = load_workbook(filename=BytesIO(file_content), read_only=True, data_only=True)
    try:
        ws = wb[wb.sheetnames[0]]
        rows_iter = ws.iter_rows(values_only=True)
        try:
            header = next(rows_iter)
        except StopIteration:
            return [], ["Файл пустой."]
        if not header:
            return [], ["Нет строки заголовков."]
        header_map = build_header_map(header)
        if "title" not in header_map and "wb_url" not in header_map:
            return [], [
                "Не найдены столбцы: нужен «Название» или «Ссылка WB». "
                "Скачайте шаблон и подставьте свои данные в первую строку заголовков."
            ]
        if "price" not in header_map:
            warns.append("Столбец цены не найден — для строк с Wildberries цена обязательна; такие строки будут пропущены.")

        out: list[ExcelProductRow] = []
        for i, row in enumerate(rows_iter, start=2):
            if row is None:
                continue
            row_t = tuple(row) if not isinstance(row, tuple) else row
            title = _row_str(row_t, "title", header_map)
            wb_url = _row_str(row_t, "wb_url", header_map)
            ozon_url = _row_str(row_t, "ozon_url", header_map)
            price = parse_price_int(_cell(row_t, header_map.get("price")))
            ozon_sku = parse_ozon_sku_int(_cell(row_t, header_map.get("ozon_sku")))
            if not title and not wb_url:
                continue
            if price is None:
                if wb_url:
                    warns.append(f"Строка {i}: нет цены — пропуск (WB: …{wb_url[-40:]}).")
                else:
                    warns.append(f"Строка {i}: нет цены — пропуск.")
                continue
            out.append(
                ExcelProductRow(
                    sheet_row=i,
                    title=title,
                    price_from=price,
                    wb_url=wb_url,
                    ozon_url=ozon_url,
                    ozon_sku=ozon_sku,
                )
            )
        return out, warns
    finally:
        wb.close()


def _unique_slug_from_title(title: str) -> str:
    base = (slugify(title) or "product")[:100]
    slug = base
    n = 1
    while Product.objects.filter(slug=slug).exists():
        n += 1
        slug = f"{base}-{n}"
    return slug


def import_product_excel_only_row(
    row: ExcelProductRow,
    *,
    category: ProductCategory,
    publish: bool,
    dry_run: bool,
) -> tuple[dict[str, Any] | None, Product | None, list[str]]:
    """
    Товар только из файла (без WB): одно торговое предложение, без описания и фото.
    """
    title = (row.title or "").strip()
    if not title:
        raise ExcelImportParseError(f"Строка {row.sheet_row}: без названия (нет ссылки WB).")

    warnings: list[str] = []
    mp: dict[str, str] = {}
    if row.wb_url:
        mp["wb"] = row.wb_url
    if row.ozon_url:
        mp["ozon"] = row.ozon_url

    if dry_run:
        slug = _unique_slug_from_title(title)
        return (
            {
                "kind": "excel_only",
                "sheet_row": row.sheet_row,
                "title": title,
                "price_from": row.price_from,
                "slug_preview": slug,
                "marketplace_links": mp,
                "ozon_sku": row.ozon_sku,
            },
            None,
            warnings,
        )

    slug = _unique_slug_from_title(title)
    label = (title[:255] if title else "Вариант") or "Вариант"

    with transaction.atomic():
        create_kwargs: dict = dict(
            slug=slug,
            title=title,
            excerpt="",
            description="",
            description_html="",
            category=category,
            price_from=row.price_from,
            is_published=publish,
            marketplace_links=mp,
        )
        if row.ozon_sku is not None:
            create_kwargs["ozon_sku"] = row.ozon_sku
        p = Product.objects.create(**create_kwargs)
        ProductVariant.objects.create(
            product=p,
            label=label,
            wb_nm_id=None,
            price_from=row.price_from,
            sort_order=0,
            is_default=True,
            marketplace_wb_url=row.wb_url or "",
        )

    return None, p, warnings


def marketplace_extra_from_row(row: ExcelProductRow) -> dict[str, str]:
    extra: dict[str, str] = {}
    if row.wb_url:
        extra["wb"] = row.wb_url
    if row.ozon_url:
        extra["ozon"] = row.ozon_url
    return extra


def import_one_excel_row(
    row: ExcelProductRow,
    *,
    category: ProductCategory,
    publish: bool,
    dry_run: bool,
    create_variants: bool,
    price_source_mode: str = "auto",
) -> tuple[Any, Product | None, list[str]]:
    """
    Одна строка Excel: при наличии ссылки WB — импорт медиа/описания с WB, цена и название с файла;
    иначе — минимальная карточка из файла.
    """
    extra = marketplace_extra_from_row(row)
    if row.wb_url:
        try:
            parse_nm_from_url(row.wb_url)
        except WbImportError as e:
            raise ExcelImportParseError(f"Строка {row.sheet_row}: ссылка WB не распознана: {e}") from e
        return import_one_from_wb_url(
            row.wb_url,
            category=category,
            publish=publish,
            dry_run=dry_run,
            create_variants=create_variants,
            price_source_mode=price_source_mode,
            title_override=row.title or None,
            price_from_override=row.price_from,
            marketplace_links_extra=extra or None,
            product_ozon_sku=row.ozon_sku,
        )
    return import_product_excel_only_row(
        row,
        category=category,
        publish=publish,
        dry_run=dry_run,
    )


def build_excel_template_bytes() -> bytes:
    from openpyxl import Workbook

    wb = Workbook()
    ws = wb.active
    if ws is None:
        ws = wb.create_sheet("Товары", 0)
    ws.title = "Товары"
    ws.append(["product", "price", "ozon", "wb", "skuozon"])
    ws.append(
        [
            "Пример: маркиза 3×2",
            125000,
            "https://www.ozon.ru/product/…",
            "https://www.wildberries.ru/catalog/310046860/detail.aspx",
            "",
        ]
    )
    bio = BytesIO()
    wb.save(bio)
    return bio.getvalue()


__all__ = [
    "ExcelImportParseError",
    "ExcelProductRow",
    "build_excel_template_bytes",
    "import_one_excel_row",
    "parse_product_rows_from_workbook",
    "parse_price_int",
    "build_header_map",
    "normalize_header_cell",
]
