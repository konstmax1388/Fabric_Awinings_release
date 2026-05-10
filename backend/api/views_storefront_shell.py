"""Отдача SPA (index.html) с корректным HTTP-статусом для SEO.

Nginx раньше делал ``try_files … /index.html`` для любого пути → всегда 200.
Здесь путь сверяется с маршрутами витрины (как в ``frontend/src/App.tsx``); при
несоответствии — ответ 404 и HTML с ссылкой на главную (краулеры и аудиты).
"""

from __future__ import annotations

import re
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.clickjacking import xframe_options_sameorigin
from django.views.decorators.http import require_http_methods

from .models import BlogPost, Product, ProductCategory, StaticPage
from .views_promotions import _public_promotions_catalog_queryset

# Совпадает с зарезервированными сегментами в React Router до ``/:slug``.
_FIXED_TOP_SEGMENTS = frozenset(
    {
        "cart",
        "checkout",
        "catalog",
        "search",
        "portfolio",
        "contacts",
        "reviews",
        "blog",
        "sales",
        "akcii",
        "privacy",
        "offer",
        "account",
        "politika-konfidentsialnosti-i-soglasie-na-obrabotku-personalnykh-dannykh",
        "publichnaia-oferta",
    }
)

_ACCOUNT_SECOND = frozenset(
    {
        "login",
        "register",
        "change-password",
        "orders",
        "profile",
        "addresses",
    }
)

_SLUG_RE = re.compile(r"^[-a-zA-Z0-9_]+\Z")


def _dist_index_path() -> Path:
    base = getattr(settings, "STOREFRONT_DIST_DIR", None)
    if base:
        return Path(base) / "index.html"
    return Path(settings.BASE_DIR).parent / "frontend" / "dist" / "index.html"


def _storefront_path_is_valid(request_path: str) -> bool:
    raw = (request_path or "/").split("?")[0]
    path = raw.rstrip("/") or "/"
    segments = [s for s in path.split("/") if s]

    if not segments:
        return True

    if len(segments) == 1:
        seg = segments[0]
        if seg in _FIXED_TOP_SEGMENTS:
            return True
        return StaticPage.objects.filter(slug=seg, is_published=True).exists()

    if len(segments) == 2:
        a, b = segments[0], segments[1]
        if a == "catalog":
            if not _SLUG_RE.match(b):
                return False
            if b == "category":
                return False
            return Product.objects.filter(
                slug=b,
                is_published=True,
                category__is_published=True,
            ).exists()
        if a == "blog":
            if not _SLUG_RE.match(b):
                return False
            return BlogPost.objects.filter(slug=b, is_published=True).exists()
        if a == "sales":
            if not _SLUG_RE.match(b):
                return False
            return _public_promotions_catalog_queryset().filter(slug=b).exists()
        if a == "akcii":
            return bool(_SLUG_RE.match(b))
        if a == "account":
            return b in _ACCOUNT_SECOND
        return False

    if len(segments) == 3:
        a, b, c = segments[0], segments[1], segments[2]
        if a == "catalog" and b == "category":
            if not _SLUG_RE.match(c):
                return False
            return ProductCategory.objects.filter(slug=c, is_published=True).exists()
        if segments == ["checkout", "payment", "success"]:
            return True
        if segments == ["checkout", "payment", "failed"]:
            return True
        if segments[0] == "account" and segments[1] == "orders" and segments[2]:
            return bool(segments[2])
        return False

    return False


def _html_404(request) -> str:
    home = request.build_absolute_uri("/")
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Страница не найдена</title>
</head>
<body>
  <p>Страница не найдена.</p>
  <p><a href="{home}">Перейти на главную</a></p>
</body>
</html>
"""


@never_cache
@xframe_options_sameorigin
@require_http_methods(["GET", "HEAD"])
def storefront_shell_view(request, _path: str = "") -> FileResponse | HttpResponse:
    valid = _storefront_path_is_valid(request.path)
    if not valid:
        if request.method == "HEAD":
            return HttpResponse(status=404)
        return HttpResponse(_html_404(request), status=404, content_type="text/html; charset=utf-8")

    index_path = _dist_index_path()
    if not index_path.is_file():
        if settings.DEBUG:
            return HttpResponse(
                "Соберите витрину: npm run build в frontend/",
                status=503,
                content_type="text/plain; charset=utf-8",
            )
        if request.method == "HEAD":
            return HttpResponse(status=503)
        return HttpResponse("Service Unavailable", status=503, content_type="text/plain; charset=utf-8")

    if request.method == "HEAD":
        return HttpResponse(status=200, content_type="text/html; charset=utf-8")

    return FileResponse(open(index_path, "rb"), content_type="text/html; charset=utf-8")
