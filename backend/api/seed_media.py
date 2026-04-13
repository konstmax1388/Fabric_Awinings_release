"""Скачивание изображения по URL в ImageField — только для `seed_demo`."""

from __future__ import annotations

import urllib.error

from django.core.files.base import ContentFile

from .wb_import import WbImportError, download_url_bytes


def copy_url_to_image_field(
    instance,
    attr_name: str,
    url: str,
    *,
    basename: str = "seed",
) -> bool:
    """Заполняет FileField/ImageField на уже созданном объекте. Возвращает True при успехе."""
    if not (url or "").strip():
        return False
    try:
        data = download_url_bytes(url.strip())
    except (WbImportError, urllib.error.URLError, OSError, ValueError):
        return False
    low = url.lower()
    ext = "jpg"
    if ".webp" in low:
        ext = "webp"
    elif ".png" in low:
        ext = "png"
    field = getattr(instance, attr_name)
    field.save(f"{basename}.{ext}", ContentFile(data), save=True)
    return True
