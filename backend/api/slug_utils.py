"""Уникальные слаги: только латиница, цифры, дефис и подчёркивание (URL без кириллицы)."""

from __future__ import annotations

import re

from django.db import models
from slugify import slugify as py_slugify

# Согласовано с фронтом (?category=) и с SlugField без allow_unicode.
_ASCII_SLUG_RE = re.compile(r"^[A-Za-z0-9_-]{1,200}$")


def slug_is_ascii_only(value: str) -> bool:
    return bool(value and _ASCII_SLUG_RE.fullmatch(value))


def latin_slug_from_text(text: str, max_length: int) -> str:
    """Транслитерация (в т.ч. кириллица) → slug нижнего регистра."""
    base = py_slugify(
        (text or "").strip() or "item",
        max_length=max_length,
        word_boundary=True,
        lowercase=True,
    )
    base = (base or "item").strip("-")[:max_length] or "item"
    return base[:max_length]


def unique_slug_for_instance(
    instance: models.Model,
    title: str,
    *,
    field_name: str = "slug",
) -> str:
    max_length = instance._meta.get_field(field_name).max_length
    base = latin_slug_from_text(title, max_length)
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
    """Если слаг пустой или содержит не-ASCII — заполняет из заголовка (латиница, уникальность)."""
    current = (getattr(instance, slug_attr, "") or "").strip()
    if current and slug_is_ascii_only(current):
        return
    title = (getattr(instance, title_attr, "") or "").strip() or "item"
    setattr(
        instance,
        slug_attr,
        unique_slug_for_instance(instance, title, field_name=slug_attr),
    )
