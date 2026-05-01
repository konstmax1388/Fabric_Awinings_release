"""Пункт «Акции» в шапке — сразу после «Каталог» (поле order в header_navigation)."""

from __future__ import annotations

from django.db import migrations


def _int_order(raw, default: int = 0) -> int:
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default


def reorder_promotions_after_catalog(apps, schema_editor):
    from config.header_nav import normalize_header_navigation

    SiteSettings = apps.get_model("api", "SiteSettings")
    for ss in SiteSettings.objects.all():
        norm = normalize_header_navigation(ss.header_navigation)
        if not norm:
            continue
        by_key: dict[str, dict] = {}
        for row in norm:
            if not isinstance(row, dict):
                continue
            key = str(row.get("key", "")).strip()
            if not key:
                continue
            by_key[key] = dict(row)
        if "catalog" not in by_key or "promotions" not in by_key:
            continue
        cat_order = _int_order(by_key["catalog"].get("order"), 1)
        promo_new = cat_order + 1
        for k, r in by_key.items():
            if k == "promotions":
                continue
            o = _int_order(r.get("order"), 0)
            if o > cat_order:
                r["order"] = o + 1
        by_key["promotions"]["order"] = promo_new
        out = list(by_key.values())
        out.sort(key=lambda x: (_int_order(x.get("order"), 0), str(x.get("key", ""))))
        ss.header_navigation = out
        ss.save(update_fields=["header_navigation"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0074_promotion"),
    ]

    operations = [
        migrations.RunPython(reorder_promotions_after_catalog, noop_reverse),
    ]
