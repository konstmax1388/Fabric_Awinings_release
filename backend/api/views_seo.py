"""Sitemap и robots.txt (HTTP): те же тела, что пишет generate_public_seo_files в frontend/dist."""

from __future__ import annotations

from django.conf import settings
from django.http import HttpResponse

from .models import SiteSettings
from .seo_public_files import build_robots_txt, build_sitemap_xml


def _site_base(request) -> str:
    base = getattr(settings, "PUBLIC_SITE_URL", "") or ""
    base = base.rstrip("/")
    if not base:
        base = request.build_absolute_uri("/").rstrip("/")
    return base


def sitemap_xml_view(request):
    allow = SiteSettings.get_solo().seo_allow_indexing
    body = build_sitemap_xml(_site_base(request), allow_indexing=allow)
    return HttpResponse(body, content_type="application/xml; charset=utf-8")


def robots_txt_view(request):
    allow = SiteSettings.get_solo().seo_allow_indexing
    body = build_robots_txt(_site_base(request), allow_indexing=allow)
    return HttpResponse(body, content_type="text/plain; charset=utf-8")
