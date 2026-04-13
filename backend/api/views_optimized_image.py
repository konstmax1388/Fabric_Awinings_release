"""GET /api/image-variant/ — WebP/JPEG превью файлов из /media/ (кэш на диске)."""

from __future__ import annotations

from django.http import FileResponse, HttpResponseBadRequest, HttpResponseNotFound
from django.views import View

from .services.optimized_media import (
    ALLOWED_FORMATS,
    ALLOWED_WIDTHS,
    get_or_create_variant_file,
    safe_media_relative_path,
    source_file_for_relative,
)


class ImageVariantView(View):
    """?path=относительно_MEDIA&w=640&f=webp|jpeg — тот же пайплайн, что может использовать витрина и админка."""

    def get(self, request):
        rel = safe_media_relative_path(request.GET.get("path", ""))
        if not rel:
            return HttpResponseBadRequest("bad path")
        try:
            w = int(request.GET.get("w", "0"))
        except ValueError:
            return HttpResponseBadRequest("bad w")
        fmt = (request.GET.get("f") or "webp").strip().lower()
        if w not in ALLOWED_WIDTHS or fmt not in ALLOWED_FORMATS:
            return HttpResponseBadRequest("bad w or f")
        source = source_file_for_relative(rel)
        if source is None:
            return HttpResponseNotFound("not found")
        if source.suffix.lower() == ".svg":
            return HttpResponseBadRequest("format not supported")
        try:
            out = get_or_create_variant_file(source, w, fmt)
        except ValueError:
            return HttpResponseBadRequest("could not process")
        except Exception:
            return HttpResponseNotFound("error")
        ctype = "image/webp" if fmt == "webp" else "image/jpeg"
        resp = FileResponse(out.open("rb"), content_type=ctype)
        resp["Cache-Control"] = "public, max-age=31536000, immutable"
        return resp
