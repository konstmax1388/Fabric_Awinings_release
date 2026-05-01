"""Порядок и включение секций тела главной (не meta/ui — только витрина /)."""

from __future__ import annotations

import copy
from typing import Any

from django.utils.translation import gettext_lazy as _

# Ключи согласованы с `HomePayload` (frontend) и JSON `HomePageContent.payload`.
VALID_HOME_SECTION_IDS: tuple[str, ...] = (
    "hero",
    "purchasePaths",
    "problemSolution",
    "processTimeline",
    "tentTypes",
    "featured",
    "promotions",
    "calculator",
    "portfolio",
    "whyUs",
    "reviews",
    "blog",
    "mapForm",
)

HOME_SECTION_LABELS: dict[str, str] = {
    "hero": str(_("Hero: первый экран")),
    "purchasePaths": str(_("Как оформить заказ")),
    "problemSolution": str(_("Проблема — решение")),
    "processTimeline": str(_("От замера до монтажа")),
    "tentTypes": str(_("Виды тентов")),
    "featured": str(_("Подборка на главной")),
    "promotions": str(_("Акции и спецпредложения")),
    "calculator": str(_("Калькулятор / заявка")),
    "portfolio": str(_("Портфолио")),
    "whyUs": str(_("Почему мы")),
    "reviews": str(_("Отзывы")),
    "blog": str(_("Блог (превью)")),
    "mapForm": str(_("Карта и форма")),
}


def default_section_layout() -> list[dict[str, Any]]:
    return [{"id": x, "enabled": True} for x in VALID_HOME_SECTION_IDS]


def normalize_section_layout(raw: Any) -> list[dict[str, Any]]:
    """Валидный список: ровно по разу на каждый id, лишние/дубли убрать, добавить пропущенные."""
    default = default_section_layout()
    if not isinstance(raw, list):
        return copy.deepcopy(default)
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for row in raw:
        if not isinstance(row, dict):
            continue
        rid = str(row.get("id", "")).strip()
        if rid not in set(VALID_HOME_SECTION_IDS) or rid in seen:
            continue
        seen.add(rid)
        v = row.get("enabled", True)
        if isinstance(v, str):
            enabled = v not in ("0", "false", "False", "off", "")
        else:
            enabled = v is not False and v != 0
        out.append({"id": rid, "enabled": bool(enabled)})
    for row in default:
        if row["id"] not in seen:
            out.append({"id": row["id"], "enabled": row["enabled"]})
    return out
