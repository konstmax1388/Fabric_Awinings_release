"""Прокси для виджета СДЭК v3 (аналог dist/service.php из cdek-it/widget)."""

from __future__ import annotations

import json
import logging
import urllib.parse
from typing import Any

from django.http import HttpRequest

from api.models import SiteSettings
from api.services.cdek_http import CdekAuthError, fetch_cdek_access_token
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

    try:
        data = post_json(f"{base}/v2/calculator/tarifflist", forward, headers=headers, timeout=45.0)
    except HttpJsonError as e:
        logger.warning("CDEK widget proxy tarifflist: %s", e)
        return (e.status or 502), {"message": str(e)}
    return 200, data
