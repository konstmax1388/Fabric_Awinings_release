"""Прокси для виджета СДЭК v3 (аналог dist/service.php из cdek-it/widget)."""

from __future__ import annotations

import json
import logging
import urllib.parse
from typing import Any

from django.http import HttpRequest

from api.models import SiteSettings
from api.services.cdek_http import CdekAuthError, fetch_cdek_access_token
from api.services.cdek_locations import search_cdek_cities
from api.services.cdek_runtime import cdek_api_base_url
from api.services.http_util import HttpJsonError, get_json, post_json

logger = logging.getLogger(__name__)

WIDGET_APP_HEADERS = {
    "X-App-Name": "widget_pvz",
    "X-App-Version": "3.11.1",
    "User-Agent": "widget/3.11.1",
}


def merge_cdek_widget_payload(request: HttpRequest) -> dict[str, Any]:
    merged: dict[str, Any] = {}
    for key in request.GET.keys():
        vals = request.GET.getlist(key)
        merged[key] = vals[0] if len(vals) == 1 else vals
    if request.body:
        try:
            body = json.loads(request.body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            body = None
        if isinstance(body, dict):
            merged.update(body)
    return merged


def _scalar_query_value(v: Any) -> str:
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, str):
        return v
    return json.dumps(v, ensure_ascii=False)


def _encode_deliverypoints_query(params: dict[str, Any]) -> str:
    pairs: list[tuple[str, str]] = []
    for key, raw in params.items():
        if raw is None:
            continue
        if isinstance(raw, (list, tuple)):
            for item in raw:
                if item is None:
                    continue
                pairs.append((key, _scalar_query_value(item)))
        else:
            pairs.append((key, _scalar_query_value(raw)))
    return urllib.parse.urlencode(pairs)


def _sender_city_name(settings: SiteSettings) -> str:
    sender = (settings.cdek_widget_sender_city or "").strip()
    if sender:
        return sender.split(",")[0].strip() or "Москва"
    pickup_addr = (settings.pickup_point_address or "").strip()
    if pickup_addr:
        return pickup_addr.split(",")[0].strip() or "Москва"
    return "Москва"


def _city_code_by_name(settings: SiteSettings, city_name: str) -> int | None:
    query = (city_name or "").strip()
    if len(query) < 2:
        return None
    rows = search_cdek_cities(settings, query, limit=1)
    if not rows:
        return None
    code = rows[0].get("code")
    return int(code) if isinstance(code, int) else None


def run_cdek_widget_proxy(settings: SiteSettings, merged: dict[str, Any]) -> tuple[int, Any]:
    if not settings.cdek_enabled:
        return 403, {"message": "СДЭК отключён в настройках сайта."}

    action = merged.get("action")
    if action is None:
        return 400, {"message": "Action is required"}
    if action not in ("offices", "calculate"):
        return 400, {"message": "Unknown action"}

    forward = {k: v for k, v in merged.items() if k != "action"}

    try:
        token = fetch_cdek_access_token(settings)
    except CdekAuthError as e:
        logger.warning("CDEK widget proxy: OAuth failed: %s", e)
        return 502, {"message": str(e)}

    base = cdek_api_base_url(settings).rstrip("/")
    headers = {"Authorization": f"Bearer {token}", **WIDGET_APP_HEADERS}

    if action == "offices":
        qs = _encode_deliverypoints_query(forward)
        url = f"{base}/v2/deliverypoints?{qs}"
        try:
            data = get_json(url, headers=headers, timeout=45.0)
        except HttpJsonError as e:
            logger.warning("CDEK widget proxy deliverypoints: %s", e)
            return (e.status or 502), {"message": str(e)}
        return 200, data

    # Виджет периодически присылает from_location.code = null.
    # Для расчёта тарифов СДЭК code обязателен, поэтому нормализуем отправителя сервером.
    from_location = forward.get("from_location")
    if not isinstance(from_location, dict):
        from_location = {}
    sender_city = _sender_city_name(settings)
    sender_code = _city_code_by_name(settings, sender_city)
    if sender_code is None:
        fallback_city = str(from_location.get("city") or "").strip()
        sender_code = _city_code_by_name(settings, fallback_city) if fallback_city else None
    if sender_code is None:
        return 400, {
            "message": (
                "Не удалось определить код города отправления для СДЭК. "
                "Проверьте поле «СДЭК: город отправления (виджет)» в настройках сайта."
            )
        }
    from_location["code"] = int(sender_code)
    if not (isinstance(from_location.get("city"), str) and from_location.get("city", "").strip()):
        from_location["city"] = sender_city
    forward["from_location"] = from_location

    try:
        data = post_json(f"{base}/v2/calculator/tarifflist", forward, headers=headers, timeout=45.0)
    except HttpJsonError as e:
        logger.warning("CDEK widget proxy tarifflist: %s", e)
        return (e.status or 502), {"message": str(e)}
    return 200, data
