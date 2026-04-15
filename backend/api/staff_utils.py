"""Общие утилиты Staff API (camelCase, маскирование)."""

from __future__ import annotations

import re
from typing import Any

_CAMEL_RE = re.compile(r"([A-Z])")


def snake_to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(p[:1].upper() + p[1:] for p in parts[1:] if p)


def camel_to_snake(name: str) -> str:
    s1 = _CAMEL_RE.sub(r"_\1", name)
    return s1.lower().lstrip("_")


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
        if not hasattr(instance, fname):
            continue
        val = getattr(instance, fname)
        if mask_secrets and _is_secret_field(fname):
            if val is None or val == "":
                out[snake_to_camel(fname)] = ""
            else:
                out[snake_to_camel(fname)] = "***"
            continue
        f = instance._meta.get_field(fname)
        if getattr(f, "remote_field", None) and val is not None:
            out[snake_to_camel(fname)] = val.pk
            continue
        if hasattr(val, "url"):
            u = val.url
            if request and u.startswith("/"):
                out[snake_to_camel(fname)] = request.build_absolute_uri(u)
            else:
                out[snake_to_camel(fname)] = u or ""
            continue
        if hasattr(val, "isoformat"):
            out[snake_to_camel(fname)] = val.isoformat() if val else None
            continue
        out[snake_to_camel(fname)] = val
    return out


def _is_secret_field(fname: str) -> bool:
    fl = fname.lower()
    return "password" in fl or "secret" in fl or fl.endswith("_key") or fl == "bitrix24_webhook_base"


def apply_snake_updates(instance, updates: dict[str, Any], allowed: tuple[str, ...]) -> None:
    """Применяет только разрешённые ключи (snake_case) к экземпляру модели."""
    for k, v in updates.items():
        if k in allowed and hasattr(instance, k):
            setattr(instance, k, v)
