"""SEO для публичного API: заголовки, описания, canonical (пути), robots — ориентир РФ / Яндекс."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any

from django.conf import settings

if TYPE_CHECKING:
    from api.models import BlogPost, Product, SiteSettings


def trim_meta_description(text: str, limit: int = 160) -> str:
    t = " ".join((text or "").split())
    if len(t) <= limit:
        return t
    cut = t[: limit - 1]
    if " " in cut:
        cut = cut.rsplit(" ", 1)[0]
    return cut + "…"


def title_suffix(site: SiteSettings) -> str:
    s = (site.seo_title_suffix or "").strip() or (site.site_name or "").strip()
    return s


def page_title_product(obj: Product, site: SiteSettings) -> str:
    suf = title_suffix(site)
    if suf:
        return f"{obj.title} | {suf}"
    return obj.title


def meta_description_product(obj: Product, site: SiteSettings) -> str:
    ex = (obj.excerpt or "").strip()
    if ex:
        return trim_meta_description(ex)
    desc = (obj.description or "").strip()
    if desc:
        return trim_meta_description(desc)
    fb = (site.seo_default_meta_description or "").strip()
    if fb:
        return trim_meta_description(fb)
    suf = title_suffix(site)
    tail = f" — {suf}" if suf else ""
    return trim_meta_description(f"{obj.title}{tail}")


def canonical_path_product(slug: str) -> str:
    return f"/catalog/{slug}"


def absolute_url(request, path: str) -> str:
    p = path if path.startswith("/") else f"/{path}"
    base = (getattr(settings, "PUBLIC_SITE_URL", None) or "").rstrip("/")
    if base:
        return f"{base}{p}"
    if request:
        return request.build_absolute_uri(p)
    return p


def meta_description_blog(obj: BlogPost, site: SiteSettings) -> str:
    ex = (obj.excerpt or "").strip()
    if ex:
        return trim_meta_description(ex)
    body = (obj.body or "").strip()
    if body:
        plain = re.sub(r"<[^>]+>", " ", body)
        plain = " ".join(plain.split())
        if plain:
            return trim_meta_description(plain)
    fb = (site.seo_default_meta_description or "").strip()
    if fb:
        return trim_meta_description(fb)
    suf = title_suffix(site)
    tail = f" — {suf}" if suf else ""
    return trim_meta_description(f"{obj.title}{tail}")


def page_title_blog(obj: BlogPost, site: SiteSettings) -> str:
    suf = title_suffix(site)
    if suf:
        return f"{obj.title} | {suf}"
    return obj.title


def canonical_path_blog(slug: str) -> str:
    return f"/blog/{slug}"


def robots_directive(site: SiteSettings) -> str:
    if site.seo_allow_indexing:
        return "index, follow"
    return "noindex, nofollow"


def product_seo_dict(obj: Product, site: SiteSettings, request) -> dict[str, Any]:
    # Совпадает с логикой превью в ProductListSerializer.
    from api.serializers import ProductListSerializer

    ser = ProductListSerializer(context={"request": request})
    images = ser.get_images(obj)
    og = images[0] if images else None
    path = canonical_path_product(obj.slug)
    return {
        "pageTitle": page_title_product(obj, site),
        "metaDescription": meta_description_product(obj, site),
        "canonicalPath": path,
        "canonicalUrl": absolute_url(request, path),
        "ogImage": og,
        "robots": robots_directive(site),
    }


def blog_seo_dict(obj: BlogPost, site: SiteSettings, request) -> dict[str, Any]:
    from api.serializers import media_file_absolute

    path = canonical_path_blog(obj.slug)
    img = media_file_absolute(request, obj.cover_image) if obj.cover_image else None
    return {
        "pageTitle": page_title_blog(obj, site),
        "metaDescription": meta_description_blog(obj, site),
        "canonicalPath": path,
        "canonicalUrl": absolute_url(request, path),
        "ogImage": img or "",
        "robots": robots_directive(site),
    }
