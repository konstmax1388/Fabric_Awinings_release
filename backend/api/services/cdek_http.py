"""
CDEK API v2: OAuth и кэш токена (реальные HTTP-вызовы).

Спецификация: https://apidoc.cdek.ru/ — POST {base}/v2/oauth/token
"""

from __future__ import annotations

import hashlib
import logging
from typing import Any

from django.core.cache import cache

from api.models import SiteSettings
from api.services.cdek_runtime import cdek_api_base_url, effective_cdek_credentials
from api.services.http_util import HttpJsonError, post_form

logger = logging.getLogger(__name__)

CACHE_KEY_PREFIX = "cdek:v2:oauth"


class CdekAuthError(Exception):
    pass


def _token_cache_key(base: str, account: str) -> str:
    h = hashlib.sha256(f"{base}|{account}".encode("utf-8")).hexdigest()[:40]
    return f"{CACHE_KEY_PREFIX}:{h}"


def fetch_cdek_access_token(settings: SiteSettings, *, force_refresh: bool = False) -> str:
    """
    Client credentials → access_token. Кэш до истечения срока (expires_in − запас).
    """
    base = cdek_api_base_url(settings)
    account, secure = effective_cdek_credentials(settings)
    if not account or not secure:
        raise CdekAuthError("Не заданы CDEK Account / Secure (админка или CDEK_ACCOUNT / CDEK_SECURE).")

    ck = _token_cache_key(base, account)
    if not force_refresh:
        cached = cache.get(ck)
        if isinstance(cached, str) and cached.strip():
            return cached.strip()

    token_url = f"{base.rstrip('/')}/v2/oauth/token"
    try:
        data: Any = post_form(
            token_url,
            {
                "grant_type": "client_credentials",
                "client_id": account,
                "client_secret": secure,
            },
        )
    except HttpJsonError as e:
        logger.warning("CDEK OAuth HTTP error: %s", e)
        raise CdekAuthError(str(e)) from e

    if not isinstance(data, dict):
        raise CdekAuthError("CDEK OAuth: неожиданный ответ (не объект JSON).")

    token = data.get("access_token")
    if not isinstance(token, str) or not token.strip():
        raise CdekAuthError("CDEK OAuth: в ответе нет access_token.")

    expires_in = data.get("expires_in")
    ttl = 600
    if isinstance(expires_in, (int, float)) and expires_in > 120:
        ttl = int(expires_in) - 90
    elif isinstance(expires_in, (int, float)) and expires_in > 30:
        ttl = int(expires_in) - 15
    cache.set(ck, token.strip(), timeout=max(60, min(ttl, 3600)))
    return token.strip()


def cdek_credentials_ok(settings: SiteSettings) -> bool:
    a, s = effective_cdek_credentials(settings)
    return bool(a and s)
