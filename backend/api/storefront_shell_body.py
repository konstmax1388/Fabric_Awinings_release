"""
Серверный HTML внутри #root для SPA-shell (пустой корень в dist/index.html).

Нужен поисковикам и клиентам без JS: реальные заголовки, абзацы текста и ссылки.
Если для пути есть prerender-файл с непустым #root — валидация в inject не срабатывает.
"""

from __future__ import annotations

import json
import re
from decimal import Decimal
from typing import Any

from django.utils.html import escape, strip_tags

from api.models import (
    BlogPost,
    HomePageContent,
    Product,
    ProductCategory,
    SiteSettings,
    StaticPage,
)
from api.seo_public import (
    _media_abs,
    blog_post_public_seo_dict,
    build_blog_post_meta_description,
    build_product_meta_description,
    product_public_seo_dict,
)
from api.services.cart_line_unit_prices import effective_unit_price_rub
from api.storefront_shell_meta import build_shell_head_meta_for_request
from api.views_promotions import _public_promotions_catalog_queryset

_EMPTY_ROOT_RE = re.compile(
    r'(<div\b[^>]*\bid\s*=\s*["\']root["\'][^>]*>)\s*(</div>)',
    re.IGNORECASE,
)


def shell_root_is_empty_markup(html: str) -> bool:
    return bool(_EMPTY_ROOT_RE.search(html))


def _collapse(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def _preview_plain(text: str | None, max_len: int) -> str:
    if not text or not str(text).strip():
        return ""
    t = _collapse(strip_tags(str(text)))
    if len(t) <= max_len:
        return t
    return f"{t[: max(0, max_len - 1)].rstrip()}…"


def _json_ld_script(obj: dict[str, Any]) -> str:
    """Безопасная вставка JSON-LD в HTML (без закрытия script)."""
    raw = json.dumps(obj, ensure_ascii=False)
    safe = raw.replace("<", "\\u003c")
    return f'<script type="application/ld+json">{safe}</script>'


def _fragment_listing(request, h1: str, lead: str | None = None) -> str | None:
    meta = build_shell_head_meta_for_request(request)
    if not meta:
        return None
    desc = (lead or meta.description or "").strip()
    desc = _collapse(desc)
    if not h1 and not desc:
        return None
    h1_esc = escape((h1 or meta.title or "").strip() or "Страница")
    parts = [
        '<main class="storefront-shell-body" id="storefront-shell-static">',
        f"<h1>{h1_esc}</h1>",
    ]
    if desc:
        parts.append(f"<p>{escape(desc)}</p>")
    parts.append("</main>")
    return "".join(parts)


def _first_enabled_hero_heading(payload: dict[str, Any]) -> tuple[str, str]:
    hero = payload.get("hero")
    if not isinstance(hero, dict):
        return "", ""
    slides = hero.get("slides")
    if not isinstance(slides, list):
        return "", ""
    for s in slides:
        if not isinstance(s, dict):
            continue
        if s.get("enabled") is False:
            continue
        t = (s.get("title") or "").strip()
        sub = (s.get("subtitle") or "").strip()
        if t or sub:
            return t, sub
    return "", ""


def _product_body_preview(product: Product) -> str:
    for raw in (product.excerpt, product.description, product.description_html):
        if not (raw or "").strip():
            continue
        prev = _preview_plain(raw, 6000)
        if prev:
            return prev
    return ""


def _blog_body_preview(post: BlogPost) -> str:
    for raw in (post.excerpt, post.body):
        if not (raw or "").strip():
            continue
        prev = _preview_plain(raw, 6000)
        if prev:
            return prev
    return ""


def build_shell_root_fragment_for_request(request) -> str | None:
    raw = (request.path or "/").split("?")[0]
    path = raw.rstrip("/") or "/"
    segments = [s for s in path.split("/") if s]

    if not segments:
        home = HomePageContent.get_solo()
        payload = home.payload if isinstance(home.payload, dict) else {}
        meta_block = payload.get("meta") if isinstance(payload.get("meta"), dict) else {}
        h1, hero_sub = _first_enabled_hero_heading(payload)
        if not h1:
            h1 = (meta_block.get("title") or "").strip()
        meta = build_shell_head_meta_for_request(request)
        lead_parts: list[str] = []
        if hero_sub:
            lead_parts.append(hero_sub)
        org = (meta_block.get("orgDescription") or "").strip()
        if org:
            lead_parts.append(org)
        if meta and (meta.description or "").strip():
            lead_parts.append(meta.description.strip())
        elif meta_block.get("description"):
            lead_parts.append(str(meta_block.get("description") or "").strip())
        lead = _collapse(". ".join(lead_parts)) if lead_parts else ""
        if not h1 and not lead:
            return None
        parts = ['<main class="storefront-shell-body" id="storefront-shell-static">']
        if h1:
            parts.append(f"<h1>{escape(h1)}</h1>")
        if lead:
            parts.append(f"<p>{escape(lead)}</p>")
        parts.append(
            "<p><a href=\"/catalog\">Каталог</a> · "
            "<a href=\"/contacts\">Контакты</a> · "
            "<a href=\"/blog\">Блог</a></p>"
        )
        parts.append("</main>")
        return "".join(parts)

    first = segments[0]
    if first in {"cart", "checkout", "account", "search", "staff"}:
        return None

    ss = SiteSettings.get_solo()

    if segments == ["catalog"]:
        return _fragment_listing(request, "Каталог")

    if len(segments) == 3 and segments[0] == "catalog" and segments[1] == "category":
        cat = ProductCategory.objects.filter(slug=segments[2], is_published=True).first()
        if not cat:
            return None
        return _fragment_listing(request, cat.title)

    if len(segments) == 2 and segments[0] == "catalog":
        slug = segments[1]
        if slug == "category":
            return None
        product = (
            Product.objects.filter(
                slug=slug,
                is_published=True,
                category__is_published=True,
            )
            .select_related("category")
            .first()
        )
        if not product:
            return None
        seo = product_public_seo_dict(product, request, ss)
        h1 = (product.title or "").strip() or "Товар"
        body_prev = _product_body_preview(product)
        price = int(effective_unit_price_rub(product=product, variant=None))
        cat = product.category
        cat_link = (
            f'<p class="storefront-shell-body__crumb"><a href="/catalog">Каталог</a>'
            f' · <a href="/catalog/category/{escape(cat.slug)}">{escape(cat.title)}</a></p>'
        )
        im0 = product.images_rel.order_by("sort_order", "id").first()
        img_html = ""
        if im0 and im0.image:
            src = escape(_media_abs(request, im0.image))
            img_html = (
                f'<p class="storefront-shell-body__figure"><img src="{src}" '
                f'alt="{escape(h1)}" width="960" height="720" loading="lazy" decoding="async" /></p>'
            )
        plain_meta = build_product_meta_description(product, ss)
        body_esc = escape(body_prev) if body_prev else escape(plain_meta)
        chunks = [
            '<article class="storefront-shell-body" id="storefront-shell-static" itemscope '
            'itemtype="https://schema.org/Product">',
            cat_link,
            f"<h1 itemprop=\"name\">{escape(h1)}</h1>",
            img_html,
            f'<p><strong>Цена от {price} ₽</strong></p>',
            f'<p itemprop="description">{body_esc}</p>',
            f'<p><a href="{escape(seo.get("canonicalUrl") or "")}">Страница товара</a></p>',
            "</article>",
        ]
        image_url = ""
        if im0 and im0.image:
            image_url = _media_abs(request, im0.image)
        canon = (seo.get("canonicalUrl") or request.build_absolute_uri(request.path)).strip()
        ld: dict[str, Any] = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": h1,
            "description": _collapse(body_prev or plain_meta)[:8000],
            "url": canon,
        }
        if image_url:
            ld["image"] = [image_url]
        ld["offers"] = {
            "@type": "Offer",
            "priceCurrency": "RUB",
            "price": str(Decimal(price)),
            "availability": "https://schema.org/InStock",
            "url": canon,
        }
        chunks.append(_json_ld_script(ld))
        return "".join(chunks)

    if segments == ["blog"]:
        return _fragment_listing(request, "Блог")

    if len(segments) == 2 and segments[0] == "blog":
        post = BlogPost.objects.filter(slug=segments[1], is_published=True).first()
        if not post:
            return None
        seo = blog_post_public_seo_dict(post, request, ss)
        h1 = (post.title or "").strip() or "Статья"
        prev = _blog_body_preview(post)
        if not prev:
            prev = build_blog_post_meta_description(post, ss)
        date_s = ""
        if post.published_at:
            date_s = post.published_at.isoformat()
        cover_html = ""
        if post.cover_image:
            src = escape(_media_abs(request, post.cover_image))
            cover_html = (
                f'<p class="storefront-shell-body__figure"><img src="{src}" '
                f'alt="{escape(h1)}" width="1200" height="630" loading="lazy" decoding="async" /></p>'
            )
        date_block = (
            f'<p><time datetime="{escape(date_s)}">{escape(date_s)}</time></p>' if date_s else ""
        )
        chunks = [
            '<article class="storefront-shell-body" id="storefront-shell-static" itemscope '
            'itemtype="https://schema.org/BlogPosting">',
            f"<h1 itemprop=\"headline\">{escape(h1)}</h1>",
            date_block,
            cover_html,
            f'<div itemprop="articleBody"><p>{escape(_collapse(prev))}</p></div>',
            f'<p><a href="{escape(seo.get("canonicalUrl") or "")}">Читать на сайте</a></p>',
            "</article>",
        ]
        canon = (seo.get("canonicalUrl") or request.build_absolute_uri(request.path)).strip()
        img = _media_abs(request, post.cover_image) if post.cover_image else ""
        ld_article: dict[str, Any] = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": h1,
            "url": canon,
            "description": _collapse(prev)[:4000],
        }
        if date_s:
            ld_article["datePublished"] = date_s
        if img:
            ld_article["image"] = [img]
        site_name = (ss.site_name or "").strip() or "Сайт"
        ld_article["publisher"] = {"@type": "Organization", "name": site_name}
        chunks.append(_json_ld_script(ld_article))
        return "".join(chunks)

    if segments == ["sales"]:
        return _fragment_listing(request, "Акции")

    if len(segments) == 2 and segments[0] == "sales":
        promo = _public_promotions_catalog_queryset().filter(slug=segments[1]).first()
        if not promo:
            return None
        h1 = (promo.title or "").strip() or "Акция"
        prev = _preview_plain(
            (promo.excerpt or promo.body or ""),
            6000,
        )
        meta = build_shell_head_meta_for_request(request)
        lead = prev or ((meta.description or "").strip() if meta else "")
        parts = [
            '<article class="storefront-shell-body" id="storefront-shell-static">',
            f"<h1>{escape(h1)}</h1>",
        ]
        if promo.image:
            src = escape(_media_abs(request, promo.image))
            parts.append(
                f'<p class="storefront-shell-body__figure"><img src="{src}" '
                f'alt="{escape(h1)}" width="960" height="540" loading="lazy" decoding="async" /></p>'
            )
        if lead:
            parts.append(f"<p>{escape(_collapse(lead))}</p>")
        parts.append(f'<p><a href="{escape(request.build_absolute_uri(request.path))}">Подробнее</a></p>')
        parts.append("</article>")
        return "".join(parts)

    if len(segments) == 1:
        slug = segments[0]
        static = StaticPage.objects.filter(slug=slug, is_published=True).first()
        if static:
            h1 = (static.title or "").strip() or "Страница"
            body_prev = _preview_plain(static.body, 12000)
            meta = build_shell_head_meta_for_request(request)
            lead = body_prev or ((meta.description or "").strip() if meta else "")
            parts = [
                '<main class="storefront-shell-body" id="storefront-shell-static">',
                f"<h1>{escape(h1)}</h1>",
            ]
            if lead:
                parts.append(f"<p>{escape(_collapse(lead))}</p>")
            parts.append("</main>")
            return "".join(parts)

    meta = build_shell_head_meta_for_request(request)
    if not meta:
        return None
    title_for_h1 = (meta.title or "").strip()
    if " | " in title_for_h1:
        title_for_h1 = title_for_h1.split(" | ")[0].strip()
    if " — " in title_for_h1:
        parts_t = title_for_h1.rsplit(" — ", 1)
        if len(parts_t) == 2 and len(parts_t[0]) < 120:
            title_for_h1 = parts_t[0].strip()
    return _fragment_listing(request, title_for_h1 or "Страница", lead=meta.description)


def maybe_inject_shell_root_content(html: str, request) -> str:
    if not shell_root_is_empty_markup(html):
        return html
    fragment = build_shell_root_fragment_for_request(request)
    if not fragment:
        return html
    return _EMPTY_ROOT_RE.sub(r"\1" + fragment + r"\2", html, count=1)
