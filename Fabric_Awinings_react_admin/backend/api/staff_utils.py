"""Общие утилиты Staff API (camelCase, маскирование)."""

from __future__ import annotations

import json
import re
from decimal import Decimal
from typing import Any

from django.core.serializers.json import DjangoJSONEncoder
from django.utils.encoding import force_str
from django.utils.functional import Promise
from rest_framework.response import Response

_CAMEL_RE = re.compile(r"([A-Z])")


def snake_to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(p[:1].upper() + p[1:] for p in parts[1:] if p)


def camel_to_snake(name: str) -> str:
    s1 = _CAMEL_RE.sub(r"_\1", name)
    return s1.lower().lstrip("_")


def drf_json_safe_response(data: dict[str, Any]) -> Response:
    """Ответ DRF с гарантированно JSON-совместимым телом (lazy gettext, UUID, Decimal, …)."""
    try:
        payload = json.loads(json.dumps(data, cls=DjangoJSONEncoder))
    except TypeError:
        payload = json.loads(json.dumps(data, cls=DjangoJSONEncoder, default=str))
    return Response(payload)


def model_instance_to_camel_dict(
    instance,
    field_names: tuple[str, ...] | list[str],
    request,
    *,
    mask_secrets: bool = True,
) -> dict[str, Any]:
    """Сериализация полей модели в camelCase; Image/File → абсолютный URL."""
    out: dict[str, Any] = {}
    for fname in field_names:
        camel = snake_to_camel(fname)
        if not hasattr(instance, fname):
            continue
        try:
            val = getattr(instance, fname)
            if mask_secrets and _is_secret_field(fname):
                if val is None or val == "":
                    out[camel] = ""
                else:
                    out[camel] = "***"
                continue
            f = instance._meta.get_field(fname)
            if getattr(f, "remote_field", None) and val is not None:
                out[camel] = val.pk
                continue
            # Пустой FileField/ImageField: .url даёт ValueError/OSError — иначе GET site-settings/current → 500.
            if val is not None and hasattr(val, "url"):
                try:
                    u = val.url
                except (ValueError, OSError):
                    out[camel] = ""
                    continue
                if request and u.startswith("/"):
                    out[camel] = request.build_absolute_uri(u)
                else:
                    out[camel] = u or ""
                continue
            if isinstance(val, Promise):
                out[camel] = force_str(val)
                continue
            if isinstance(val, Decimal):
                out[camel] = format(val, "f")
                continue
            if hasattr(val, "isoformat"):
                out[camel] = val.isoformat() if val else None
                continue
            out[camel] = val
        except Exception:
            # Не роняем весь singleton из‑за одного поля (тип, миграция, битый файл).
            out[camel] = None
    return out


def _is_secret_field(fname: str) -> bool:
    fl = fname.lower()
    return "password" in fl or "secret" in fl or fl.endswith("_key") or fl == "bitrix24_webhook_base"


def apply_snake_updates(instance, updates: dict[str, Any], allowed: tuple[str, ...]) -> None:
    """Применяет только разрешённые ключи (snake_case) к экземпляру модели."""
    for k, v in updates.items():
        if k in allowed and hasattr(instance, k):
            setattr(instance, k, v)
