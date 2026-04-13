"""Sitemap для публичного сайта (канонический URL из DJANGO_PUBLIC_SITE_URL / VITE_SITE_URL на фронте)."""

from __future__ import annotations

from datetime import date
from xml.sax.saxutils import escape

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone

from .models import BlogPost, Product


def _site_base() -> str:
    base = getattr(settings, "PUBLIC_SITE_URL", "") or ""
    return base.rstrip("/")


def _xml_url(loc: str, lastmod: date | None, changefreq: str, priority: str) -> str:
    parts = [f"  <url>\n    <loc>{escape(loc)}</loc>\n"]
    if lastmod:
        parts.append(f"    <lastmod>{lastmod.isoformat()}</lastmod>\n")
    parts.append(f"    <changefreq>{changefreq}</changefreq>\n")
    parts.append(f"    <priority>{priority}</priority>\n")
    parts.append("  </url>\n")
    return "".join(parts)


def sitemap_xml_view(request):
    base = _site_base()
    if not base:
        base = request.build_absolute_uri("/").rstrip("/")

    urls_xml: list[str] = []
    today = timezone.now().date()

    static_pages: list[tuple[str, str, str, date | None]] = [
        (f"{base}/", "weekly", "1.0", today),
        (f"{base}/catalog", "daily", "0.9", today),
        (f"{base}/portfolio", "weekly", "0.7", today),
        (f"{base}/contacts", "monthly", "0.8", today),
        (f"{base}/blog", "weekly", "0.8", today),
    ]
    for loc, cf, pr, lm in static_pages:
        urls_xml.append(_xml_url(loc, lm, cf, pr))

    products = (
        Product.objects.filter(is_published=True, category__is_published=True)
        .select_related("category")
        .order_by("slug")
    )
    for p in products:
        lm = p.updated_at.date() if getattr(p, "updated_at", None) else today
        urls_xml.append(_xml_url(f"{base}/catalog/{p.slug}", lm, "weekly", "0.85"))

    for post in BlogPost.objects.filter(is_published=True).order_by("slug"):
        d = post.published_at or post.updated_at.date()
        urls_xml.append(_xml_url(f"{base}/blog/{post.slug}", d, "monthly", "0.75"))

    body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(urls_xml)
        + "</urlset>\n"
    )
    return HttpResponse(body, content_type="application/xml; charset=utf-8")
