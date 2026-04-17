"""Перевод слагов с кириллицы на латиницу (каталог, товары, блог, портфолио)."""

from __future__ import annotations

import re

from django.db import migrations

_ASCII_SLUG_RE = re.compile(r"^[A-Za-z0-9_-]{1,200}$")


def _is_ascii_slug(value: str) -> bool:
    return bool(value and _ASCII_SLUG_RE.fullmatch(value))


def forwards(apps, schema_editor):
    from slugify import slugify

    def latin_base(title: str, max_len: int) -> str:
        s = slugify(
            (title or "").strip() or "item",
            max_length=max_len,
            word_boundary=True,
            lowercase=True,
        )
        return ((s or "item").strip("-")[:max_len] or "item")[:max_len]

    def alloc_unique(Model, field: str, max_len: int, base: str, exclude_pk) -> str:
        slug = base[:max_len]
        n = 2
        qs = Model.objects.all()
        if exclude_pk is not None:
            qs = qs.exclude(pk=exclude_pk)
        while qs.filter(**{field: slug}).exists():
            suffix = f"-{n}"
            slug = (base[: max_len - len(suffix)] + suffix).strip("-") or f"item-{n}"
            slug = slug[:max_len]
            n += 1
        return slug

    for model_name, title_field, slug_field, max_len in (
        ("ProductCategory", "title", "slug", 64),
        ("Product", "title", "slug", 120),
        ("PortfolioProject", "title", "slug", 120),
        ("BlogPost", "title", "slug", 160),
    ):
        Model = apps.get_model("api", model_name)
        for obj in Model.objects.all().iterator():
            cur = getattr(obj, slug_field) or ""
            if _is_ascii_slug(cur):
                continue
            title = getattr(obj, title_field, "") or ""
            base = latin_base(title, max_len)
            new_slug = alloc_unique(Model, slug_field, max_len, base, obj.pk)
            Model.objects.filter(pk=obj.pk).update(**{slug_field: new_slug})


def backwards(apps, schema_editor):
    """Обратный перенос слагов не выполняется."""
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0039_review_backfill_moderation_legacy_published"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
