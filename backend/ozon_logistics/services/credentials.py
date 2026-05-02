"""Учётные данные Seller API только для приложения Ozon Доставка (отдельно от `api`)."""

from __future__ import annotations

import os
from typing import Any

from .exceptions import OzonLogisticsConfigError


def seller_api_base_url() -> str:
    env = (os.environ.get("OZON_LOGISTICS_SELLER_API_URL") or "").strip().rstrip("/")
    if env:
        return env
    try:
        from ozon_logistics.models import OzonLogisticsSettings

        u = (OzonLogisticsSettings.get_solo().seller_api_base_url or "").strip().rstrip("/")
        if u:
            return u
    except Exception:
        pass
    return "https://api-seller.ozon.ru"


def logistics_seller_credentials() -> tuple[str, str]:
    """
    Client-Id и Api-Key для Ozon Доставка.
    Приоритет: env OZON_LOGISTICS_SELLER_CLIENT_ID / OZON_LOGISTICS_SELLER_API_KEY,
    иначе поля в `OzonLogisticsSettings` (singleton).
    """
    cid = (os.environ.get("OZON_LOGISTICS_SELLER_CLIENT_ID") or "").strip()
    key = (os.environ.get("OZON_LOGISTICS_SELLER_API_KEY") or "").strip()
    if cid and key:
        return cid, key
    try:
        from ozon_logistics.models import OzonLogisticsSettings

        s = OzonLogisticsSettings.get_solo()
        cid = (s.client_id or "").strip()
        key = (s.api_key or "").strip()
    except Exception:
        cid, key = "", ""
    if not cid or not key:
        raise OzonLogisticsConfigError(
            "Задайте OZON_LOGISTICS_SELLER_CLIENT_ID и OZON_LOGISTICS_SELLER_API_KEY "
            "или заполните Client-Id и Api-Key в «Настройки Ozon Доставка» (админка приложения ozon_logistics)."
        )
    return cid, key


def auth_headers() -> dict[str, str]:
    c = logistics_seller_credentials()
    return {"Client-Id": c[0], "Api-Key": c[1]}


def post_seller_json(path: str, body: dict[str, Any], *, timeout: float = 60.0) -> Any:
    """POST JSON на Seller API; path вида ``/v1/delivery/check``."""
    from api.services.http_util import post_json

    base = seller_api_base_url()
    if not path.startswith("/"):
        path = "/" + path
    url = f"{base}{path}"
    return post_json(url, body, headers=auth_headers(), timeout=timeout)
