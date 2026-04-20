"""
Список тарифов СДЭК для админки: POST /v2/calculator/tarifflist (как у виджета v3).

Группировка по полям виджета (office / door / pickup) по коду delivery_mode и названию.
"""

from __future__ import annotations

import logging
from typing import Any, Literal

from api.models import SiteSettings
from api.services.cdek_dimensions import cdek_default_package
from api.services.cdek_http import CdekAuthError, fetch_cdek_access_token
from api.services.cdek_locations import search_cdek_cities
from api.services.cdek_runtime import cdek_api_base_url
from api.services.cdek_widget_service import WIDGET_APP_HEADERS
from api.services.http_util import HttpJsonError, post_json

logger = logging.getLogger(__name__)

WidgetBucket = Literal["office", "door", "pickup"]


def _widget_bucket(delivery_mode: int | None, tariff_name: str) -> WidgetBucket:
    """Сопоставление строки ответа API с ключами конфига виджета cdek-it."""
    n = (tariff_name or "").lower()
    if "постамат" in n:
        return "pickup"
    if delivery_mode == 1:
        return "door"
    if delivery_mode == 3:
        return "door"
    if delivery_mode in (2, 4):
        return "office"
    return "office"


def _default_to_city_code() -> int:
    try:
        return int(os.environ.get("CDEK_TARIFF_CATALOG_TO_CITY", "44"))
    except (TypeError, ValueError):
        return 44


def resolve_sender_city_code(settings: SiteSettings) -> int | None:
    """Код города отправления по полю «город отправления» или подсказке «Москва»."""
    hint = (settings.cdek_widget_sender_city or "").strip().split(",")[0].strip()
    if len(hint) < 2:
        hint = "Москва"
    try:
        rows = search_cdek_cities(settings, hint, limit=8)
    except (CdekAuthError, HttpJsonError, OSError) as e:
        logger.warning("CDEK tariff catalog: city search failed: %s", e)
        return None
    if rows and rows[0].get("code"):
        return int(rows[0]["code"])
    try:
        rows = search_cdek_cities(settings, "Москва", limit=1)
    except (CdekAuthError, HttpJsonError, OSError):
        return None
    if rows and rows[0].get("code"):
        return int(rows[0]["code"])
    return None


def fetch_cdek_tariff_catalog(
    settings: SiteSettings,
    *,
    from_city_code: int | None = None,
    to_city_code: int | None = None,
) -> tuple[list[dict[str, Any]] | None, str | None]:
    """
    Возвращает (items, error). items — плоский список тарифов с полем widget_bucket.
    """
    if not settings.cdek_enabled:
        return None, "СДЭК отключён в настройках."

    fc = from_city_code if from_city_code is not None else resolve_sender_city_code(settings)
    if fc is None:
        return None, "Не удалось определить код города отправления (проверьте «СДЭК: город отправления» и учётные данные API)."

    tc = to_city_code if to_city_code is not None else _default_to_city_code()
    if fc == tc:
        return None, "Код города «куда» совпадает с «откуда». Укажите другой код города назначения (поле выше) для примера расчёта."

    default_pack = cdek_default_package(settings)
    # Поле date не передаём: API v2 для tarifflist возвращает v2_invalid_value_type для строки ISO (проверено на api.edu.cdek.ru).
    body: dict[str, Any] = {
        "type": 1,
        "currency": 1,
        "lang": "rus",
        "from_location": {"code": int(fc)},
        "to_location": {"code": int(tc)},
        "packages": [default_pack],
    }

    try:
        token = fetch_cdek_access_token(settings)
    except CdekAuthError as e:
        return None, str(e)

    base = cdek_api_base_url(settings).rstrip("/")
    headers = {"Authorization": f"Bearer {token}", **WIDGET_APP_HEADERS}
    url = f"{base}/v2/calculator/tarifflist"
    try:
        data = post_json(url, body, headers=headers, timeout=45.0)
    except HttpJsonError as e:
        logger.warning("CDEK tariff catalog: %s", e)
        return None, str(e)

    if not isinstance(data, dict):
        return None, "Неожиданный ответ API СДЭК (не объект)."

    rows = data.get("tariff_codes")
    if not isinstance(rows, list):
        return None, "В ответе нет списка tariff_codes."

    out: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        try:
            code = int(row.get("tariff_code"))
        except (TypeError, ValueError):
            continue
        name = str(row.get("tariff_name") or "").strip()
        desc = str(row.get("tariff_description") or "").strip()
        try:
            dm = int(row["delivery_mode"]) if row.get("delivery_mode") is not None else None
        except (TypeError, ValueError):
            dm = None
        bucket = _widget_bucket(dm, name)
        out.append(
            {
                "tariff_code": code,
                "tariff_name": name,
                "tariff_description": desc,
                "delivery_mode": dm,
                "delivery_sum": row.get("delivery_sum"),
                "widget_bucket": bucket,
            }
        )

    out.sort(key=lambda x: (x["widget_bucket"], x["tariff_code"]))
    return out, None
