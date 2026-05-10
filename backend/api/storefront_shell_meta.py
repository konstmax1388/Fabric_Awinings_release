"""
Серверная вставка <title>, meta description и Open Graph в HTML витрины (shell / prerender).

Нужна для краулеров и превью ссылок: в «голом» frontend/dist/index.html от Vite нет <title>.
Если в HTML уже есть непустой <title> (например после Playwright prerender), вставка пропускается.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from django.utils.html import escape

from api.models import (
    BlogPost,
    HomePageContent,
    Product,
    ProductCategory,
    SiteSettings,
    StaticPage,
)
from api.seo_public import (
    apply_title_template_key,
    blog_post_public_seo_dict,
    build_home_document_title,
    product_public_seo_dict,
    resolve_meta_description_server,
    static_page_document_title,
    static_page_meta_description,
    static_page_robots_value,
    truncate_meta_description,
)
from api.views_promotions import _public_promotions_catalog_queryset


@dataclass(frozen=True)
class ShellHeadMeta:
    title: str
    description: str
    canonical_url: str
    og_type: str
    og_title: str
    og_image: str
    og_site_name: str
    og_locale: str
    twitter_card: str
    robots: str | None


_HEAD_TITLE_RE = re.compile(r"<title>\s*([^<]*?)\s*</title>", re.IGNORECASE | re.DOTALL)


def html_needs_shell_meta_inject(html: str) -> bool:
    m = _HEAD_TITLE_RE.search(html)
    if not m:
        return True
    return not (m.group(1) or "").strip()


def _inject_after_head_open(html: str, fragment: str) -> str:
    m = re.search(r"<head([^>]*)>", html, re.IGNORECASE)
    if not m:
        return html
    pos = m.end()
    return html[:pos] + "\n" + fragment + html[pos:]


def _locale_og(locale: str) -> str:
    loc = (locale or "ru_RU").strip() or "ru_RU"
    return loc.replace("_", "-")


def render_shell_head_fragment(meta: ShellHeadMeta) -> str:
    lines = [
        f"<title>{escape(meta.title)}</title>",
        f'<link rel="canonical" href="{escape(meta.canonical_url)}" />',
        f'<meta name="description" content="{escape(meta.description)}" />',
    ]
    if meta.robots:
        lines.append(f'<meta name="robots" content="{escape(meta.robots)}" />')
    tw = (meta.twitter_card or "summary_large_image").strip() or "summary_large_image"
    lines.append(f'<meta name="twitter:card" content="{escape(tw)}" />')
    if meta.og_image:
        lines.append(f'<meta name="twitter:image" content="{escape(meta.og_image)}" />')
    lines.append(f'<meta property="og:type" content="{escape(meta.og_type)}" />')
    lines.append(f'<meta property="og:url" content="{escape(meta.canonical_url)}" />')
    lines.append(f'<meta property="og:site_name" content="{escape(meta.og_site_name)}" />')
    lines.append(f'<meta property="og:title" content="{escape(meta.og_title)}" />')
    lines.append(f'<meta property="og:description" content="{escape(meta.description)}" />')
    lines.append(f'<meta property="og:locale" content="{escape(_locale_og(meta.og_locale))}" />')
    if meta.og_image:
        lines.append(f'<meta property="og:image" content="{escape(meta.og_image)}" />')
    return "\n    ".join(["    <!-- storefront_shell_meta (Django) -->"] + lines)


def _site_name(ss: SiteSettings) -> str:
    return (ss.site_name or "").strip() or "Сайт"


def _default_og(request, ss: SiteSettings) -> str:
    from api.seo_public import _media_abs

    return _media_abs(request, ss.seo_og_image) if getattr(ss, "seo_og_image", None) else ""


def _shell_meta_from_seo_dict(
    *,
    seo: dict[str, str],
    og_type: str,
    og_title_override: str | None,
    ss: SiteSettings,
    robots: str | None,
) -> ShellHeadMeta:
    og_title = (og_title_override or seo.get("pageTitle") or "").strip() or seo.get("pageTitle", "")
    return ShellHeadMeta(
        title=seo.get("pageTitle") or og_title,
        description=seo.get("metaDescription") or "",
        canonical_url=seo.get("canonicalUrl") or "",
        og_type=og_type,
        og_title=og_title or (seo.get("pageTitle") or ""),
        og_image=(seo.get("ogImage") or "").strip(),
        og_site_name=_site_name(ss),
        og_locale=(ss.seo_locale or "ru_RU").strip() or "ru_RU",
        twitter_card=(ss.seo_twitter_card or "summary_large_image").strip() or "summary_large_image",
        robots=robots or (None if ss.seo_allow_indexing else "noindex, nofollow"),
    )


def build_shell_head_meta_for_request(request) -> ShellHeadMeta | None:
    raw = (request.path or "/").split("?")[0]
    path = raw.rstrip("/") or "/"
    segments = [s for s in path.split("/") if s]

    ss = SiteSettings.get_solo()
    site_name = _site_name(ss)
    home = HomePageContent.get_solo()
    payload = home.payload if isinstance(home.payload, dict) else {}
    default_og = _default_og(request, ss)
    tw = (ss.seo_twitter_card or "summary_large_image").strip() or "summary_large_image"
    locale = (ss.seo_locale or "ru_RU").strip() or "ru_RU"

    def _glob_robots(route_robots: str | None) -> str | None:
        if not ss.seo_allow_indexing:
            return "noindex, nofollow"
        return route_robots

    if not segments:
        meta_block = payload.get("meta") if isinstance(payload.get("meta"), dict) else {}
        base_title = (meta_block.get("title") or "").strip() or "Фабрика Тентов — тенты, навесы, шатры"
        title = build_home_document_title(base_title, site_name, ss)
        desc = resolve_meta_description_server(
            (meta_block.get("description") or "").strip() or None,
            ss,
            (meta_block.get("orgDescription") or "").strip() or None,
        )
        canonical = request.build_absolute_uri("/")
        robots = _glob_robots(None)
        return ShellHeadMeta(
            title=title,
            description=desc,
            canonical_url=canonical,
            og_type="website",
            og_title=title,
            og_image=default_og,
            og_site_name=site_name,
            og_locale=locale,
            twitter_card=tw,
            robots=robots,
        )

    if segments == ["catalog"]:
        base_listing = (ss.seo_catalog_listing_meta_description or "").strip() or (
            ss.seo_default_meta_description or ""
        ).strip() or (
            "Каталог тентов, навесов и шатров: фильтр по категории, сортировка, цены «от»."
        )
        max_m = max(int(getattr(ss, "seo_meta_description_max", None) or 160), 40)
        desc = truncate_meta_description(base_listing, max_m)
        title = apply_title_template_key("listing", "Каталог", site_name, ss)
        return ShellHeadMeta(
            title=title,
            description=desc,
            canonical_url=request.build_absolute_uri("/catalog"),
            og_type="website",
            og_title=title,
            og_image=default_og,
            og_site_name=site_name,
            og_locale=locale,
            twitter_card=tw,
            robots=_glob_robots(None),
        )

    if len(segments) == 3 and segments[0] == "catalog" and segments[1] == "category":
        cat = ProductCategory.objects.filter(slug=segments[2], is_published=True).first()
        if not cat:
            return None
        list_base = f"{cat.title} — каталог"
        title = apply_title_template_key("listing", list_base, site_name, ss)
        base_listing = (ss.seo_catalog_listing_meta_description or "").strip() or (
            ss.seo_default_meta_description or ""
        ).strip() or (
            "Каталог тентов, навесов и шатров: фильтр по категории, сортировка, цены «от»."
        )
        max_m = max(int(getattr(ss, "seo_meta_description_max", None) or 160), 40)
        desc = truncate_meta_description(f"{cat.title}. {base_listing}", max_m)
        canonical = request.build_absolute_uri(f"/catalog/category/{cat.slug}")
        return ShellHeadMeta(
            title=title,
            description=desc,
            canonical_url=canonical,
            og_type="website",
            og_title=title,
            og_image=default_og,
            og_site_name=site_name,
            og_locale=locale,
            twitter_card=tw,
            robots=_glob_robots(None),
        )

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
        return _shell_meta_from_seo_dict(
            seo=seo,
            og_type="product",
            og_title_override=(product.title or "").strip() or None,
            ss=ss,
            robots=_glob_robots(seo.get("robots")),
        )

    if segments == ["portfolio"]:
        port = payload.get("portfolio") if isinstance(payload.get("portfolio"), dict) else {}
        heading = (port.get("pageHeading") or "Портфолио").strip() or "Портфолио"
        title = apply_title_template_key("listing", heading, site_name, ss)
        fallback_desc = (ss.seo_default_meta_description or "").strip() or (
            "Реализованные проекты: тенты, навесы, террасы."
        )
        max_m = max(int(getattr(ss, "seo_meta_description_max", None) or 160), 40)
        desc = truncate_meta_description(fallback_desc, max_m)
        canonical = request.build_absolute_uri("/portfolio")
        return ShellHeadMeta(
            title=title,
            description=desc,
            canonical_url=canonical,
            og_type="website",
            og_title=title,
            og_image=default_og,
            og_site_name=site_name,
            og_locale=locale,
            twitter_card=tw,
            robots=_glob_robots(None),
        )

    if segments == ["contacts"]:
        ctitle = (ss.contacts_page_title or "Контакты").strip() or "Контакты"
        title = apply_title_template_key("emdash", ctitle, site_name, ss)
        addr = (ss.address or "").strip()
        desc_raw = (ss.contacts_meta_description or "").strip() or (f"Телефон, email и адрес: {addr}" if addr else None)
        desc = resolve_meta_description_server(desc_raw, ss, None)
        canonical = request.build_absolute_uri("/contacts")
        return ShellHeadMeta(
            title=title,
            description=desc,
            canonical_url=canonical,
            og_type="website",
            og_title=title,
            og_image=default_og,
            og_site_name=site_name,
            og_locale=locale,
            twitter_card=tw,
            robots=_glob_robots(None),
        )

    if segments == ["blog"]:
        title = apply_title_template_key("listing", "Блог", site_name, ss)
        base = (ss.seo_default_meta_description or "").strip() or (
            "Статьи о материалах, замере и монтаже тентов и навесов."
        )
        max_m = max(int(getattr(ss, "seo_meta_description_max", None) or 160), 40)
        desc = truncate_meta_description(base, max_m)
        return ShellHeadMeta(
            title=title,
            description=desc,
            canonical_url=request.build_absolute_uri("/blog"),
            og_type="website",
            og_title=title,
            og_image=default_og,
            og_site_name=site_name,
            og_locale=locale,
            twitter_card=tw,
            robots=_glob_robots(None),
        )

    if len(segments) == 2 and segments[0] == "blog":
        post = BlogPost.objects.filter(slug=segments[1], is_published=True).first()
        if not post:
            return None
        seo = blog_post_public_seo_dict(post, request, ss)
        og_title = (post.title or "").strip() or seo.get("pageTitle", "")
        return _shell_meta_from_seo_dict(
            seo=seo,
            og_type="article",
            og_title_override=og_title,
            ss=ss,
            robots=_glob_robots(seo.get("robots")),
        )

    if segments == ["sales"]:
        title = apply_title_template_key("listing", "Акции", site_name, ss)
        base = (ss.seo_default_meta_description or "").strip() or (
            "Специальные предложения и скидки при заказе на сайте."
        )
        max_m = max(int(getattr(ss, "seo_meta_description_max", None) or 160), 40)
        desc = truncate_meta_description(base, max_m)
        return ShellHeadMeta(
            title=title,
            description=desc,
            canonical_url=request.build_absolute_uri("/sales"),
            og_type="website",
            og_title=title,
            og_image=default_og,
            og_site_name=site_name,
            og_locale=locale,
            twitter_card=tw,
            robots=_glob_robots(None),
        )

    if len(segments) == 2 and segments[0] == "sales":
        promo = _public_promotions_catalog_queryset().filter(slug=segments[1]).first()
        if not promo:
            return None
        title = apply_title_template_key("listing", (promo.title or "").strip() or "Акция", site_name, ss)
        desc = resolve_meta_description_server((promo.excerpt or "").strip() or None, ss, promo.title)
        from api.seo_public import _media_abs

        og = _media_abs(request, promo.image) if promo.image else default_og
        canonical = request.build_absolute_uri(f"/sales/{promo.slug}")
        return ShellHeadMeta(
            title=title,
            description=desc,
            canonical_url=canonical,
            og_type="website",
            og_title=title,
            og_image=og,
            og_site_name=site_name,
            og_locale=locale,
            twitter_card=tw,
            robots=_glob_robots(None),
        )

    if segments == ["reviews"]:
        rv = payload.get("reviews") if isinstance(payload.get("reviews"), dict) else {}
        page_title = (rv.get("pageTitle") or "Отзывы").strip() or "Отзывы"
        title = apply_title_template_key("emdash", page_title, site_name, ss)
        desc = resolve_meta_description_server(
            (rv.get("pageDescription") or "").strip() or None,
            ss,
            f"Отзывы клиентов о продукции и работе {site_name}.",
        )
        canonical = request.build_absolute_uri("/reviews")
        return ShellHeadMeta(
            title=title,
            description=desc,
            canonical_url=canonical,
            og_type="website",
            og_title=title,
            og_image=default_og,
            og_site_name=site_name,
            og_locale=locale,
            twitter_card=tw,
            robots=_glob_robots(None),
        )

    if segments == ["search"]:
        title = apply_title_template_key("listing", "Поиск", site_name, ss)
        desc = truncate_meta_description(
            "Поиск товаров в каталоге.",
            max(int(getattr(ss, "seo_meta_description_max", None) or 160), 40),
        )
        return ShellHeadMeta(
            title=title,
            description=desc,
            canonical_url=request.build_absolute_uri("/search"),
            og_type="website",
            og_title=title,
            og_image=default_og,
            og_site_name=site_name,
            og_locale=locale,
            twitter_card=tw,
            robots=_glob_robots("noindex, follow"),
        )

    if segments == ["cart"]:
        title = apply_title_template_key("listing", "Корзина", site_name, ss)
        desc = truncate_meta_description(
            "Состав заказа и оформление заявки.",
            max(int(getattr(ss, "seo_meta_description_max", None) or 160), 40),
        )
        return ShellHeadMeta(
            title=title,
            description=desc,
            canonical_url=request.build_absolute_uri("/cart"),
            og_type="website",
            og_title=title,
            og_image=default_og,
            og_site_name=site_name,
            og_locale=locale,
            twitter_card=tw,
            robots=_glob_robots("noindex, nofollow"),
        )

    if segments[0] == "checkout":
        title = apply_title_template_key("listing", "Оформление заказа", site_name, ss)
        desc = truncate_meta_description(
            "Оформление заказа на сайте.",
            max(int(getattr(ss, "seo_meta_description_max", None) or 160), 40),
        )
        canonical = request.build_absolute_uri(request.path)
        return ShellHeadMeta(
            title=title,
            description=desc,
            canonical_url=canonical,
            og_type="website",
            og_title=title,
            og_image=default_og,
            og_site_name=site_name,
            og_locale=locale,
            twitter_card=tw,
            robots=_glob_robots("noindex, nofollow"),
        )

    if segments[0] == "account":
        title = apply_title_template_key("emdash", "Личный кабинет", site_name, ss)
        desc = truncate_meta_description(
            "Личный кабинет покупателя.",
            max(int(getattr(ss, "seo_meta_description_max", None) or 160), 40),
        )
        canonical = request.build_absolute_uri(request.path)
        return ShellHeadMeta(
            title=title,
            description=desc,
            canonical_url=canonical,
            og_type="website",
            og_title=title,
            og_image=default_og,
            og_site_name=site_name,
            og_locale=locale,
            twitter_card=tw,
            robots=_glob_robots("noindex, nofollow"),
        )

    if segments and segments[0] == "akcii":
        title = apply_title_template_key("listing", "Акции", site_name, ss)
        max_m = max(int(getattr(ss, "seo_meta_description_max", None) or 160), 40)
        if len(segments) == 1:
            return ShellHeadMeta(
                title=title,
                description=truncate_meta_description(
                    (ss.seo_default_meta_description or "").strip() or "Акции и скидки.",
                    max_m,
                ),
                canonical_url=request.build_absolute_uri("/akcii"),
                og_type="website",
                og_title=title,
                og_image=default_og,
                og_site_name=site_name,
                og_locale=locale,
                twitter_card=tw,
                robots=_glob_robots(None),
            )
        if len(segments) == 2:
            canonical = request.build_absolute_uri(f"/akcii/{segments[1]}")
            base = (ss.seo_default_meta_description or "").strip() or "Специальные предложения."
            return ShellHeadMeta(
                title=title,
                description=truncate_meta_description(base, max_m),
                canonical_url=canonical,
                og_type="website",
                og_title=title,
                og_image=default_og,
                og_site_name=site_name,
                og_locale=locale,
                twitter_card=tw,
                robots=_glob_robots(None),
            )
        return None

    if len(segments) == 1:
        slug = segments[0]
        static = StaticPage.objects.filter(slug=slug, is_published=True).first()
        if static:
            doc_title = static_page_document_title(static, site_name, ss)
            desc = static_page_meta_description(static, ss)
            canonical = request.build_absolute_uri(f"/{static.slug}")
            robots_val = static_page_robots_value(static, ss)
            return ShellHeadMeta(
                title=doc_title,
                description=desc,
                canonical_url=canonical,
                og_type="website",
                og_title=doc_title,
                og_image=default_og,
                og_site_name=site_name,
                og_locale=locale,
                twitter_card=tw,
                robots=_glob_robots(robots_val),
            )

    return None


def maybe_inject_shell_head_meta(html: str, request) -> str:
    if not html_needs_shell_meta_inject(html):
        return html
    meta = build_shell_head_meta_for_request(request)
    if not meta:
        return html
    frag = render_shell_head_fragment(meta)
    return _inject_after_head_open(html, frag)
