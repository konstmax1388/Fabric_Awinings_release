"""Параметры контура CDEK API v2 (без HTTP-вызовов в этом модуле)."""

from __future__ import annotations

import os

from api.models import SiteSettings

EDU_BASE = "https://api.edu.cdek.ru"
PROD_BASE = "https://api.cdek.ru"


def cdek_api_base_url(settings: SiteSettings) -> str:
    env = (os.environ.get("CDEK_API_BASE_URL") or "").strip()
    if env:
        return env.rstrip("/")
    return EDU_BASE if settings.cdek_test_mode else PROD_BASE


def effective_cdek_credentials(settings: SiteSettings) -> tuple[str, str]:
    """(account, secure) с приоритетом переменных окружения."""
    acc = (os.environ.get("CDEK_ACCOUNT") or settings.cdek_account or "").strip()
    sec = (os.environ.get("CDEK_SECURE") or settings.cdek_secure_password or "").strip()
    return acc, sec
