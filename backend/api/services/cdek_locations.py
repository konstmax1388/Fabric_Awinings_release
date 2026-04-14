"""Поиск населённых пунктов СДЭК API v2 (GET /v2/location/cities)."""

from __future__ import annotations

import logging
import urllib.parse
from typing import Any

from api.models import SiteSettings
from api.services.cdek_http import CdekAuthError, fetch_cdek_access_token
from api.services.cdek_runtime import cdek_api_base_url
from api.services.http_util import HttpJsonError, get_json

logger = logging.getLogger(__name__)


def _normalize_city_rows(data: Any) -> list[dict[str, Any]]:
    if isinstance(data, list):
        return [x for x in data if isinstance(x, dict)]
    if isinstance(data, dict):
        for key in ("items", "cities", "data"):
            raw = data.get(key)
            if isinstance(raw, list):
                return [x for x in raw if isinstance(x, dict)]
    return []


def _city_label(row: dict[str, Any]) -> str:
    city = (row.get("city") or row.get("name") or "").strip()
    region = (row.get("region") or "").strip()
    if not city:
        return region or ""
    if region and region.lower() not in city.lower():
        return f"{city}, {region}"
    return city


def search_cdek_cities(settings: SiteSettings, query: str, *, limit: int = 20) -> list[dict[str, Any]]:
    """
    Возвращает список { code, city, region, label } для подсказок в оформлении заказа.
    """
    q = (query or "").strip()
    if len(q) < 2:
        return []

    token = fetch_cdek_access_token(settings)
    base = cdek_api_base_url(settings).rstrip("/")
    params = urllib.parse.urlencode(
        {
            "city": q,
            "country_codes": "RU",
            "size": str(max(1, min(limit, 30))),
            "lang": "rus",
        }
    )
    url = f"{base}/v2/location/cities?{params}"
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    try:
        data = get_json(url, headers=headers, timeout=20.0)
    except HttpJsonError as e:
        logger.warning("CDEK cities search HTTP error: %s", e)
        raise

    out: list[dict[str, Any]] = []
    for row in _normalize_city_rows(data):
        code = row.get("code")
        city = (row.get("city") or row.get("name") or "").strip()
        region = (row.get("region") or "").strip()
        label = _city_label(row)
        if not label:
            continue
        try:
            code_int = int(code) if code is not None else None
        except (TypeError, ValueError):
            code_int = None
        out.append(
            {
                "code": code_int,
                "city": city,
                "region": region,
                "label": label,
            }
        )
    return out
