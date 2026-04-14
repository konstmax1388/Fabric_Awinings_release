"""Минимальные HTTP POST/GET JSON без внешних зависимостей (urllib)."""

from __future__ import annotations

import json
import ssl
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


class HttpJsonError(Exception):
    def __init__(self, message: str, *, status: int | None = None, body: str = ""):
        super().__init__(message)
        self.status = status
        self.body = body


def post_json(
    url: str,
    body: dict[str, Any],
    *,
    headers: dict[str, str] | None = None,
    timeout: float = 45.0,
) -> Any:
    data = json.dumps(body).encode("utf-8")
    h = {"Content-Type": "application/json", "Accept": "application/json", **(headers or {})}
    req = urllib.request.Request(url, data=data, method="POST", headers=h)
    return _read_json_response(req, timeout=timeout)


def post_form(
    url: str,
    fields: dict[str, str],
    *,
    timeout: float = 45.0,
) -> Any:
    data = urllib.parse.urlencode(fields).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
    )
    return _read_json_response(req, timeout=timeout)


def get_json(url: str, *, headers: dict[str, str] | None = None, timeout: float = 45.0) -> Any:
    req = urllib.request.Request(url, method="GET", headers={"Accept": "application/json", **(headers or {})})
    return _read_json_response(req, timeout=timeout)


def _read_json_response(req: urllib.request.Request, *, timeout: float) -> Any:
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            status = getattr(resp, "status", 200) or 200
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace") if e.fp else ""
        raise HttpJsonError(f"HTTP {e.code}: {raw[:500]}", status=e.code, body=raw) from e
    except urllib.error.URLError as e:
        raise HttpJsonError(f"Сеть: {e.reason!s}") from e

    if not raw.strip():
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise HttpJsonError(f"Ответ не JSON (HTTP {status}): {raw[:300]}", status=status, body=raw) from e
