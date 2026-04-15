"""Уникальные слаги из заголовка (кириллица через slugify allow_unicode)."""

from django.db import models
from django.utils.text import slugify


def unique_slug_for_instance(
    instance: models.Model,
    title: str,
    *,
    field_name: str = "slug",
) -> str:
    max_length = instance._meta.get_field(field_name).max_length
    base = slugify(title.strip(), allow_unicode=True)[:max_length].strip("-") or "item"
    qs = instance.__class__.objects.all()
    if instance.pk:
        qs = qs.exclude(pk=instance.pk)
    slug = base[:max_length]
    n = 2
    while qs.filter(**{field_name: slug}).exists():
        suffix = f"-{n}"
        slug = (base[: max_length - len(suffix)] + suffix).strip("-") or f"item-{n}"
        slug = slug[:max_length]
        n += 1
    return slug


def ensure_slug_from_title(
    instance: models.Model,
    *,
    title_attr: str = "title",
    slug_attr: str = "slug",
) -> None:
    """Если слаг пустой — заполняет из заголовка (с уникальностью)."""
    current = (getattr(instance, slug_attr, "") or "").strip()
    if current:
        return
    title = (getattr(instance, title_attr, "") or "").strip() or "item"
    setattr(
        instance,
        slug_attr,
        unique_slug_for_instance(instance, title, field_name=slug_attr),
    )
