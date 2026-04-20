"""Публичные данные СДЭК для витрины (тарифы виджета из настроек)."""

from __future__ import annotations

from api.models import SiteSettings


def _parse_codes(raw: str) -> list[int]:
    out: list[int] = []
    for part in (raw or "").replace(";", ",").split(","):
        p = part.strip()
        if p.isdigit():
            out.append(int(p))
    return out[:80]


def cdek_widget_tariffs_public(settings: SiteSettings) -> dict[str, list[int]]:
    """Ключи office / door / pickup — только непустые списки (для виджета v3)."""
    o = _parse_codes(settings.cdek_tariff_codes_office or "")
    d = _parse_codes(settings.cdek_tariff_codes_door or "")
    p = _parse_codes(settings.cdek_tariff_codes_pickup or "")
    out: dict[str, list[int]] = {}
    if o:
        out["office"] = o
    if d:
        out["door"] = d
    if p:
        out["pickup"] = p
    return out
