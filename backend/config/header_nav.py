"""Пункты навигации в шапке: ключи, порядок, включение (см. SiteSettings.header_navigation)."""

from __future__ import annotations

import copy
from typing import Any

from django.utils.translation import gettext_lazy as _

VALID_HEADER_NAV_KEYS: frozenset[str] = frozenset(
    {"home", "catalog", "about", "portfolio", "blog", "reviews", "contacts", "promotions"},
)

# Человекочитаемые подписи по умолчанию (если в JSON пусто label)
HEADER_NAV_KEY_LABELS: dict[str, str] = {
    "home": str(_("Главная")),
    "catalog": str(_("Каталог")),
    "about": str(_("О нас")),
    "portfolio": str(_("Портфолио")),
    "blog": str(_("Блог")),
    "reviews": str(_("Отзывы")),
    "contacts": str(_("Контакты")),
    "promotions": str(_("Акции")),
}


def default_header_navigation() -> list[dict[str, Any]]:
    return [
        {"key": "home", "enabled": True, "order": 0, "label": ""},
        {"key": "catalog", "enabled": True, "order": 1, "label": ""},
        {"key": "promotions", "enabled": True, "order": 2, "label": ""},
        {"key": "about", "enabled": True, "order": 3, "label": ""},
        {"key": "blog", "enabled": True, "order": 4, "label": ""},
        {"key": "contacts", "enabled": True, "order": 5, "label": ""},
        {"key": "reviews", "enabled": True, "order": 6, "label": ""},
        {"key": "portfolio", "enabled": True, "order": 7, "label": ""},
    ]


def normalize_header_navigation(raw: Any) -> list[dict[str, Any]]:
    """Список в порядке `order` с валидными ключами; лишние и дубли отбрасываются, недостающие — из default."""
    default = default_header_navigation()
    if not isinstance(raw, list) or not raw:
        return copy.deepcopy(default)
    by_key: dict[str, dict[str, Any]] = {}
    for row in raw:
        if not isinstance(row, dict):
            continue
        key = str(row.get("key", "")).strip()
        if key not in VALID_HEADER_NAV_KEYS or key in by_key:
            continue
        v = row.get("enabled", True)
        if isinstance(v, str):
            enabled = v not in ("0", "false", "False", "off", "")
        else:
            enabled = v is not False and v != 0
        order_raw = row.get("order", 0)
        try:
            order = int(order_raw)
        except (TypeError, ValueError):
            order = 0
        label = str(row.get("label", "") or "").strip()[:120]
        by_key[key] = {
            "key": key,
            "enabled": bool(enabled),
            "order": order,
            "label": label,
        }
    out: list[dict[str, Any]] = []
    for d in default:
        k = d["key"]
        if k in by_key:
            out.append(by_key[k])
        else:
            out.append(copy.deepcopy(d))
    for k, row in by_key.items():
        if not any(x["key"] == k for x in out):
            out.append(row)
    out.sort(key=lambda x: (x.get("order", 0), str(x.get("key", ""))))
    return out
