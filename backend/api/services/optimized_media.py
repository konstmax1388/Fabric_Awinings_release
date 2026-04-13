"""Ресайз и WebP/JPEG для файлов из MEDIA_ROOT; кэш в media/_variants/."""

from __future__ import annotations

import hashlib
import io
import logging
from pathlib import Path

from django.conf import settings
from PIL import Image, ImageOps

logger = logging.getLogger(__name__)

ALLOWED_WIDTHS: frozenset[int] = frozenset({64, 128, 160, 240, 320, 480, 640, 800, 960, 1200, 1600})
ALLOWED_FORMATS: frozenset[str] = frozenset({"webp", "jpeg"})


def safe_media_relative_path(path: str) -> str | None:
    """Относительный путь под MEDIA_ROOT без выхода вверх."""
    raw = (path or "").strip().replace("\\", "/")
    if not raw or raw.startswith("/"):
        return None
    parts = [p for p in raw.split("/") if p not in ("", ".")]
    if not parts or ".." in parts:
        return None
    return "/".join(parts)


def source_file_for_relative(rel: str) -> Path | None:
    root = Path(settings.MEDIA_ROOT).resolve()
    full = (root / rel).resolve()
    try:
        full.relative_to(root)
    except ValueError:
        return None
    if not full.is_file():
        return None
    return full


def variant_cache_path(source_abs: Path, width: int, fmt: str) -> Path:
    st = source_abs.stat()
    h = hashlib.sha256(
        f"{source_abs.resolve()}|{width}|{fmt}|{st.st_size}|{int(st.st_mtime)}".encode()
    ).hexdigest()
    root = Path(settings.MEDIA_ROOT)
    return root / "_variants" / h[:2] / f"{h}.{fmt}"


def render_variant_bytes(source_abs: Path, width: int, fmt: str) -> bytes:
    with Image.open(source_abs) as im:
        im = ImageOps.exif_transpose(im)
        if getattr(im, "format", None) == "SVG" or source_abs.suffix.lower() == ".svg":
            raise ValueError("svg_unsupported")
        rgba = im.convert("RGBA")
        w0, h0 = rgba.size
        if width < w0:
            ratio = width / w0
            nh = max(1, int(h0 * ratio))
            rgba = rgba.resize((width, nh), Image.Resampling.LANCZOS)
        if fmt == "webp":
            buf = io.BytesIO()
            rgba.save(buf, format="WEBP", quality=82, method=4)
            return buf.getvalue()
        if fmt == "jpeg":
            bg = Image.new("RGB", rgba.size, (255, 255, 255))
            bg.paste(rgba, mask=rgba.split()[3])
            buf = io.BytesIO()
            bg.save(buf, format="JPEG", quality=82, optimize=True)
            return buf.getvalue()
    raise ValueError("bad_format")


def get_or_create_variant_file(source_abs: Path, width: int, fmt: str) -> Path:
    cache = variant_cache_path(source_abs, width, fmt)
    if cache.is_file():
        return cache
    try:
        data = render_variant_bytes(source_abs, width, fmt)
    except ValueError:
        raise
    except Exception:
        logger.exception("optimized_media: не удалось обработать %s", source_abs)
        raise
    cache.parent.mkdir(parents=True, exist_ok=True)
    tmp = cache.with_suffix(cache.suffix + ".tmp")
    tmp.write_bytes(data)
    tmp.replace(cache)
    return cache
