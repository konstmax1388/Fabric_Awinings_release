"""Публичные SEO-поля для витрины (согласованы с шаблонами SiteSettings и фронтом seoVitrine)."""

from __future__ import annotations

import re

from django.utils.html import strip_tags

from api.models import BlogPost, Product, SiteSettings, default_seo_title_templates


def _merged_title_templates(ss: SiteSettings) -> dict[str, str]:
    out = default_seo_title_templates()
    raw = getattr(ss, "seo_title_templates", None)
    if isinstance(raw, dict):
        for k, v in raw.items():
            ks = str(k)
            if ks in out and isinstance(v, str) and v.strip():
                out[ks] = v.strip()
    return out


def build_blog_post_page_title(post: BlogPost, site_name: str, ss: SiteSettings) -> str:
    """Шаблон `article` из настроек + плейсхолдеры (аналог buildSeoTitle('article', …) на фронте)."""
    suffix = (ss.seo_title_suffix or "").strip()
    suffix_part = f" {suffix}" if suffix else ""
    sep = (getattr(ss, "seo_title_separator", None) or " | ").strip() or " | "
    tpl = (_merged_title_templates(ss).get("article") or "{title}{suffix}").strip()
    title = (post.title or "").strip() or "Блог"
    return (
        tpl.replace("{title}", title)
        .replace("{siteName}", (site_name or "").strip() or "Сайт")
        .replace("{suffix}", suffix_part)
        .replace("{sep}", sep)
    )


def truncate_meta_description(text: str, max_len: int) -> str:
    t = re.sub(r"\s+", " ", (text or "").strip())
    if len(t) <= max_len:
        return t
    return f"{t[: max(0, max_len - 1)].rstrip()}…"


def build_blog_post_meta_description(post: BlogPost, ss: SiteSettings) -> str:
    t = (post.excerpt or "").strip()
    if t:
        t = strip_tags(t)
    if not t:
        t = strip_tags(post.body or "")
    t = re.sub(r"\s+", " ", t).strip()
    if not t:
        t = (ss.seo_default_meta_description or "").strip()
    m = int(getattr(ss, "seo_meta_description_max", None) or 160)
    return truncate_meta_description(t, max(m, 40))


def _media_abs(request, filef) -> str:
    if not filef:
        return ""
    rel = filef.url
    if request:
        return request.build_absolute_uri(rel)
    return rel


def blog_post_public_seo_dict(post: BlogPost, request, ss: SiteSettings) -> dict[str, str]:
    site_name = (ss.site_name or "").strip() or "Сайт"
    slug = (post.slug or "").strip()
    path = f"/blog/{slug}" if slug else "/blog"
    canonical_url = request.build_absolute_uri(path) if request else path

    og = _media_abs(request, post.cover_image) if post.cover_image else ""
    if not og:
        og = _media_abs(request, ss.seo_og_image) if getattr(ss, "seo_og_image", None) else ""
    
    robots = "noindex, nofollow" if not ss.seo_allow_indexing else "index, follow"

    return {
        "pageTitle": build_blog_post_page_title(post, site_name, ss),
        "metaDescription": build_blog_post_meta_description(post, ss),
        "canonicalPath": path,
        "canonicalUrl": canonical_url,
        "ogImage": og,
        "robots": robots,
    }


def build_product_page_title(product: Product, site_name: str, ss: SiteSettings) -> str:
    """Шаблон listing из настроек — для <title> карточки товара (как на фронте buildSeoTitle('listing', …))."""
    suffix = (ss.seo_title_suffix or "").strip()
    suffix_part = f" {suffix}" if suffix else ""
    sep = (getattr(ss, "seo_title_separator", None) or " | ").strip() or " | "
    tpl = (_merged_title_templates(ss).get("listing") or "{title}{suffix}").strip()
    title = (product.title or "").strip() or "Товар"
    return (
        tpl.replace("{title}", title)
        .replace("{siteName}", (site_name or "").strip() or "Сайт")
        .replace("{suffix}", suffix_part)
        .replace("{sep}", sep)
    )


def build_product_meta_description(product: Product, ss: SiteSettings) -> str:
    from api.services.cart_line_unit_prices import effective_unit_price_rub

    title = (product.title or "").strip() or "Товар"
    price = int(effective_unit_price_rub(product=product, variant=None))
    excerpt = strip_tags((product.excerpt or "").strip())
    plain = strip_tags((product.description or "").strip())
    base = excerpt or plain
    phone = (ss.phone_display or "").strip()
    utp = "Индивидуальный пошив, доставка по России, гарантия."
    if base:
        base_short = re.sub(r"\s+", " ", base).strip()
        if len(base_short) > 90:
            base_short = f"{base_short[:89]}…"
        chunk = f"{title}. {base_short} Цена от {price} ₽. {utp}"
    else:
        chunk = f"{title}. Цена от {price} ₽. {utp}"
    if phone:
        chunk = f"{chunk} Тел.: {phone}."
    m = int(getattr(ss, "seo_meta_description_max", None) or 160)
    return truncate_meta_description(chunk, max(m, 40))


def product_public_seo_dict(product: Product, request, ss: SiteSettings) -> dict[str, str]:
    site_name = (ss.site_name or "").strip() or "Сайт"
    slug = (product.slug or "").strip()
    path = f"/catalog/{slug}" if slug else "/catalog"
    canonical_url = request.build_absolute_uri(path) if request else path

    og = ""
    im0 = product.images_rel.order_by("sort_order", "id").first()
    if im0 and im0.image:
        og = _media_abs(request, im0.image)
    if not og:
        og = _media_abs(request, ss.seo_og_image) if getattr(ss, "seo_og_image", None) else ""

    robots = "noindex, nofollow" if not ss.seo_allow_indexing else "index, follow"

    return {
        "pageTitle": build_product_page_title(product, site_name, ss),
        "metaDescription": build_product_meta_description(product, ss),
        "canonicalPath": path,
        "canonicalUrl": canonical_url,
        "ogImage": og,
        "robots": robots,
    }
