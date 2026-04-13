"""
Импорт черновика карточки по ссылке Wildberries.

Используются публичные JSON (card.wb.ru) и CDN basket-*.wbbasket.ru, без парсинга HTML
(страница WB часто отдаёт антибот без JS).

Право на тексты и изображения принадлежит правообладателям WB/продавца; импорт —
черновик для последующего редактирования на своём сайте.
"""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Any

from django.utils.html import escape

WB_CATALOG_NM_RE = re.compile(
    r"(?:wildberries|wbbasket)\.ru/catalog/(\d+)", re.IGNORECASE
)

DEFAULT_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# Склад/регион WB: влияет на цену в ответе API (как у витрины).
DEFAULT_WB_DEST = "-1257786"

# Максимум артикулов в одном запросе v4/detail (ограничение длины URL).
WB_V4_BATCH = 8

# Ограничение размера скачиваемого фото, байт.
MAX_IMAGE_BYTES = 12 * 1024 * 1024

# Кэш (корзина CDN, расширение первого кадра) по nm.
_basket_media_by_nm: dict[int, tuple[int, str]] = {}


class WbImportError(Exception):
    """Ошибка разбора ссылки или ответа WB."""


def parse_nm_from_url(url: str) -> int:
    """Извлекает nm (артикул) из URL карточки WB."""
    text = (url or "").strip()
    if not text:
        raise WbImportError("Пустая ссылка")
    m = WB_CATALOG_NM_RE.search(text)
    if not m:
        raise WbImportError(
            "Не найден артикул в ссылке. Ожидается вид …/catalog/ЧИСЛО/…"
        )
    return int(m.group(1))


def canonical_wb_product_url(nm: int) -> str:
    return f"https://www.wildberries.ru/catalog/{nm}/detail.aspx"


def _http_json(url: str, *, timeout: float = 20.0) -> Any:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": DEFAULT_UA, "Accept": "application/json"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8")
    return json.loads(raw)


def _http_head_ok(url: str, *, timeout: float = 12.0) -> bool:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": DEFAULT_UA},
        method="HEAD",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except urllib.error.HTTPError:
        return False
    except urllib.error.URLError:
        return False


def _http_get_first_bytes_ok(url: str, *, timeout: float = 12.0, max_read: int = 512) -> bool:
    """Некоторые CDN не отвечают на HEAD — проверяем GET и первые байты."""
    req = urllib.request.Request(url, headers={"User-Agent": DEFAULT_UA}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status != 200:
                return False
            chunk = resp.read(max_read)
            return len(chunk) > 10
    except urllib.error.HTTPError:
        return False
    except urllib.error.URLError:
        return False


def _probe_product_image_url(url: str, *, timeout: float = 12.0) -> bool:
    return _http_head_ok(url, timeout=timeout) or _http_get_first_bytes_ok(
        url, timeout=timeout
    )


# WB периодически добавляет шарды; 1..35 покрывает актуальные basket-XX.
_MAX_BASKET = 35


def resolve_basket_media(nm: int, *, timeout: float = 12.0) -> tuple[int, str]:
    """Номер CDN-корзины и расширение изображений (webp/jpg) для nm."""
    if nm in _basket_media_by_nm:
        return _basket_media_by_nm[nm]
    vol = nm // 100_000
    part = nm // 1000
    for ext in ("webp", "jpg"):
        for b in range(1, _MAX_BASKET + 1):
            u = f"https://basket-{b:02d}.wbbasket.ru/vol{vol}/part{part}/{nm}/images/big/1.{ext}"
            if _probe_product_image_url(u, timeout=timeout):
                _basket_media_by_nm[nm] = (b, ext)
                return b, ext
    raise WbImportError(f"Не удалось найти CDN для артикула {nm}")


def fetch_card_v4(nm: int, *, dest: str = DEFAULT_WB_DEST, timeout: float = 20.0) -> dict[str, Any]:
    return fetch_cards_v4_batch([nm], dest=dest, timeout=timeout, require_all=True)[nm]


def fetch_cards_v4_batch(
    nm_list: list[int],
    *,
    dest: str = DEFAULT_WB_DEST,
    timeout: float = 25.0,
    require_all: bool = True,
) -> dict[int, dict[str, Any]]:
    """Пакетная загрузка карточек v4; ключ — id (nm).

    При require_all=False часть nm (устаревшие артикулы в full_colors) может отсутствовать — без ошибки.
    """
    out: dict[int, dict[str, Any]] = {}
    unique = []
    seen: set[int] = set()
    for nm in nm_list:
        if nm not in seen:
            seen.add(nm)
            unique.append(nm)
    for i in range(0, len(unique), WB_V4_BATCH):
        chunk = unique[i : i + WB_V4_BATCH]
        qs = "&".join(f"nm={n}" for n in chunk)
        q = (
            f"https://card.wb.ru/cards/v4/detail?"
            f"appType=1&curr=rub&dest={dest}&spp=0&{qs}"
        )
        data = _http_json(q, timeout=timeout)
        for p in data.get("products") or []:
            pid = int(p["id"])
            out[pid] = p
    if require_all:
        missing = [n for n in unique if n not in out]
        if missing:
            raise WbImportError(f"WB не вернул карточки для nm: {missing[:5]}…")
    return out


def fetch_card_json(nm: int, basket: int, *, timeout: float = 20.0) -> dict[str, Any]:
    vol = nm // 100_000
    part = nm // 1000
    u = f"https://basket-{basket:02d}.wbbasket.ru/vol{vol}/part{part}/{nm}/info/ru/card.json"
    req = urllib.request.Request(
        u,
        headers={"User-Agent": DEFAULT_UA, "Accept": "application/json"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8")
    return json.loads(raw)


def variant_nm_ids_from_card_json(cj: dict[str, Any]) -> list[int]:
    """Список nm торговых предложений (слайдер на WB) из full_colors / colors."""
    out: list[int] = []
    seen: set[int] = set()
    for key in ("full_colors", "colors"):
        block = cj.get(key)
        if not isinstance(block, list):
            continue
        for item in block:
            if isinstance(item, dict) and item.get("nm_id") is not None:
                n = int(item["nm_id"])
            elif isinstance(item, int):
                n = item
            else:
                continue
            if n not in seen:
                seen.add(n)
                out.append(n)
    return out


def _wb_price_to_rub(value: int | None) -> int | None:
    if value is None:
        return None
    try:
        return max(0, int(value) // 100)
    except (TypeError, ValueError):
        return None


def min_price_rub_from_card(product: dict[str, Any]) -> int:
    best: int | None = None
    for size in product.get("sizes") or []:
        price = (size.get("price") or {}) if isinstance(size, dict) else {}
        rub = _wb_price_to_rub(price.get("product"))
        if rub is not None and (best is None or rub < best):
            best = rub
    return best if best is not None else 0


def image_urls(nm: int, basket: int, pics: int, *, ext: str = "webp") -> list[str]:
    vol = nm // 100_000
    part = nm // 1000
    n = max(0, min(int(pics or 0), 30))
    return [
        f"https://basket-{basket:02d}.wbbasket.ru/vol{vol}/part{part}/{nm}/images/big/{i}.{ext}"
        for i in range(1, n + 1)
    ]


def download_url_bytes(url: str, *, timeout: float = 30.0) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": DEFAULT_UA}, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = resp.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise WbImportError("Файл изображения слишком большой")
    return data


def plain_description_to_html(text: str) -> str:
    """Текст описания WB → безопасный HTML (абзацы и переносы строк)."""
    t = (text or "").replace("\r\n", "\n").strip()
    if not t:
        return ""
    parts = [p.strip() for p in t.split("\n\n") if p.strip()]
    chunks: list[str] = []
    for p in parts:
        inner = escape(p).replace("\n", "<br>\n")
        chunks.append(f"<p>{inner}</p>")
    return "\n".join(chunks)


def specifications_from_card_json(cj: dict[str, Any]) -> list[tuple[str, str, str, int]]:
    """
    Характеристики: (group_name, param_name, value, sort_order).
    Берём grouped_options; затем плоские options, если пары ещё не было.
    """
    rows: list[tuple[str, str, str, int]] = []
    order = 0
    seen: set[tuple[str, str]] = set()

    for group in cj.get("grouped_options") or []:
        if not isinstance(group, dict):
            continue
        gname = (group.get("group_name") or "").strip()
        for opt in group.get("options") or []:
            if not isinstance(opt, dict):
                continue
            name = (opt.get("name") or "").strip()
            value = (opt.get("value") or "").strip()
            if not name or not value:
                continue
            key = (gname, name)
            if key in seen:
                continue
            seen.add(key)
            rows.append((gname, name, value, order))
            order += 1

    for opt in cj.get("options") or []:
        if not isinstance(opt, dict):
            continue
        name = (opt.get("name") or "").strip()
        value = (opt.get("value") or "").strip()
        if not name or not value:
            continue
        key = ("", name)
        if key in seen:
            continue
        seen.add(key)
        rows.append(("", name, value, order))
        order += 1

    return rows


def variant_label(imt_name: str, variant_card_name: str) -> str:
    """Короткая подпись варианта: отличие от общего названия или полное имя с карточки."""
    imt = (imt_name or "").strip()
    vn = (variant_card_name or "").strip()
    if not vn:
        return imt or "Вариант"
    if imt and vn.startswith(imt):
        rest = vn[len(imt) :].strip(" -–—")
        return rest or vn
    return vn


@dataclass
class WbVariantDraft:
    nm: int
    label: str
    price_from: int
    image_urls: list[str]
    marketplace_wb_url: str


@dataclass
class WbImportBundle:
    """Полный набор данных для создания одного Product с вариантами."""

    root_id: int | None
    seed_nm: int
    title: str
    description_plain: str
    description_html: str
    excerpt: str
    variants: list[WbVariantDraft] = field(default_factory=list)
    specifications: list[tuple[str, str, str, int]] = field(default_factory=list)
    price_from_min: int = 0
    warnings: list[str] = field(default_factory=list)


def fetch_wb_import_bundle(seed_nm: int, *, dest: str = DEFAULT_WB_DEST) -> WbImportBundle:
    warnings: list[str] = []
    try:
        basket_seed, _ext_seed = resolve_basket_media(seed_nm)
    except WbImportError as e:
        raise WbImportError(
            f"Не удалось получить медиа по ссылке (артикул {seed_nm}): {e}"
        ) from e
    try:
        seed_cj = fetch_card_json(seed_nm, basket_seed)
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as e:
        raise WbImportError(f"Не удалось загрузить card.json: {e}") from e

    nm_ids = variant_nm_ids_from_card_json(seed_cj)
    if not nm_ids:
        nm_ids = [seed_nm]
    if seed_nm not in nm_ids:
        nm_ids = [seed_nm] + nm_ids

    cards = fetch_cards_v4_batch(nm_ids, dest=dest, require_all=False)
    if seed_nm not in cards:
        raise WbImportError(
            "Wildberries не вернул карточку для указанной ссылки. "
            "Проверьте, что артикул есть на сайте WB."
        )

    for n in nm_ids:
        if n not in cards:
            warnings.append(
                f"Артикул {n} пропущен: WB не вернул данные карточки "
                f"(устаревший nm в группе вариантов на WB)."
            )

    ordered = [n for n in nm_ids if n in cards]
    if not ordered:
        raise WbImportError("Нет ни одной доступной карточки для импорта.")
    if ordered[0] != seed_nm:
        ordered = [seed_nm] + [n for n in ordered if n != seed_nm]

    imt_name = (seed_cj.get("imt_name") or "").strip()
    if not imt_name:
        imt_name = (cards.get(seed_nm) or {}).get("name") or ""

    title = imt_name or (cards.get(seed_nm) or {}).get("name") or ""
    if not title:
        raise WbImportError("Пустое название товара")

    desc_plain = (seed_cj.get("description") or "").strip()
    description_html = plain_description_to_html(desc_plain)
    excerpt_src = desc_plain or title
    excerpt = excerpt_src.replace("\n", " ").strip()
    if len(excerpt) > 280:
        excerpt = excerpt[:279].rstrip() + "…"

    specs = specifications_from_card_json(seed_cj)

    root_id = None
    first = cards.get(seed_nm) or next(iter(cards.values()))
    if isinstance(first, dict) and first.get("root") is not None:
        root_id = int(first["root"])

    variants: list[WbVariantDraft] = []
    for nm in ordered:
        card = cards[nm]
        try:
            b, ext = resolve_basket_media(nm)
        except WbImportError:
            if nm == seed_nm:
                raise WbImportError(
                    f"Не удалось найти фото на CDN для карточки из вашей ссылки (nm={nm}). "
                    f"Попробуйте открыть на WB другой вариант того же товара и скопировать ссылку снова."
                ) from None
            warnings.append(
                f"Вариант nm={nm} пропущен: нет доступа к фото на CDN WB "
                f"(часто устаревшая или слитая позиция в группе)."
            )
            continue
        pics = int(card.get("pics") or 0)
        imgs = image_urls(nm, b, pics, ext=ext)
        name = (card.get("name") or "").strip()
        label = variant_label(imt_name, name)
        variants.append(
            WbVariantDraft(
                nm=nm,
                label=label,
                price_from=min_price_rub_from_card(card),
                image_urls=imgs,
                marketplace_wb_url=canonical_wb_product_url(nm),
            )
        )

    if not variants:
        raise WbImportError(
            "Не удалось импортировать ни одного варианта с фотографиями. "
            "Проверьте ссылку или попробуйте позже."
        )

    prices = [v.price_from for v in variants if v.price_from is not None]
    price_min = min(prices) if prices else 0

    return WbImportBundle(
        root_id=root_id,
        seed_nm=seed_nm,
        title=title,
        description_plain=desc_plain,
        description_html=description_html,
        excerpt=excerpt,
        variants=variants,
        specifications=specs,
        price_from_min=price_min,
        warnings=warnings,
    )


# Обратная совместимость для тестов / старых вызовов
@dataclass
class WbDraft:
    nm: int
    title: str
    excerpt: str
    description: str
    price_from: int
    image_urls: list[str]
    marketplace_wb_url: str


def fetch_wb_draft(nm: int, *, dest: str = DEFAULT_WB_DEST) -> WbDraft:
    b = fetch_wb_import_bundle(nm, dest=dest)
    seed_v = next((v for v in b.variants if v.nm == nm), b.variants[0])
    return WbDraft(
        nm=nm,
        title=b.title,
        excerpt=b.excerpt,
        description=b.description_plain,
        price_from=b.price_from_min,
        image_urls=seed_v.image_urls,
        marketplace_wb_url=seed_v.marketplace_wb_url,
    )
