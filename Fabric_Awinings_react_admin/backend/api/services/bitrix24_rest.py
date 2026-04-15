"""Вызов REST Битрикс24 через входящий вебхук (без OAuth).

Документация: https://apidocs.bitrix24.ru/
"""

from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class BitrixRestError(RuntimeError):
    """Ответ Б24 с полем error или сбой HTTP/сети."""


def call_bitrix_webhook(
    webhook_base: str,
    method: str,
    params: dict[str, Any] | None = None,
    *,
    timeout: int = 120,
) -> dict[str, Any]:
    """
    POST JSON на ``{webhook_base}/{method}``.

    ``webhook_base`` — URL без завершающего слэша, например
    ``https://portal.bitrix24.ru/rest/1/secret``.
    ``method`` — имя метода, например ``catalog.product.list`` (суффикс .json добавится).
    """
    base = (webhook_base or "").strip().rstrip("/")
    if not base:
        raise BitrixRestError("BITRIX24_WEBHOOK_BASE пустой")
    m = (method or "").strip().lstrip("/")
    if not m.endswith(".json"):
        m = f"{m}.json"
    url = f"{base}/{m}"
    body = json.dumps(params or {}, ensure_ascii=False).encode("utf-8")
    req = Request(
        url,
        data=body,
        method="POST",
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    try:
        with urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
    except HTTPError as e:
        try:
            raw = e.read().decode("utf-8", errors="replace")
        except Exception:
            raw = ""
        raise BitrixRestError(f"HTTP {e.code}: {raw[:500]}") from e
    except URLError as e:
        raise BitrixRestError(str(e.reason or e)) from e

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise BitrixRestError(f"Некорректный JSON: {raw[:200]}") from e

    err = data.get("error")
    if err is not None and err != "" and err != 0:
        desc = data.get("error_description")
        raise BitrixRestError(f"{err}: {desc or ''}".strip())

    return data
