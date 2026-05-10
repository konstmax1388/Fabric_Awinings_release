"""Генерация sitemap.xml и robots.txt для frontend/dist, корня выкладки на хостинге и HTTP-views."""

from __future__ import annotations

from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

from django.conf import settings
from django.utils import timezone

from django.db.models import Max

from .models import BlogPost, Product, ProductCategory, StaticPage
from .views_promotions import _public_promotions_catalog_queryset

SITEMAP_EXCLUDE_STATIC_SLUGS = frozenset(
    {
        "politika-konfidentsialnosti-i-soglasie-na-obrabotku-personalnykh-dannykh",
        "polzovatelskoe-soglashenie",
        "publichnaia-oferta",
        "soglasie-na-obrabotku-personalnykh-dannykh",
    }
)


def default_frontend_dist_dir() -> Path:
    """Каталог сборки витрины: <repo>/frontend/dist (BASE_DIR = backend/)."""
    return Path(settings.BASE_DIR).parent / "frontend" / "dist"


def default_site_docroot_dir() -> Path:
    """Корень выкладки на хостинге (рядом с backend/, frontend/) — для панели и SFTP как «корень сайта»."""
    return Path(settings.BASE_DIR).parent


def _xml_url(loc: str, lastmod: date | None) -> str:
    parts = [f"  <url>\n    <loc>{escape(loc)}</loc>\n"]
    if lastmod:
        parts.append(f"    <lastmod>{lastmod.isoformat()}</lastmod>\n")
    parts.append("  </url>\n")
    return "".join(parts)


def build_sitemap_xml(site_base: str, *, allow_indexing: bool) -> str:
    """Полный документ sitemap (URL с префиксом site_base без завершающего /)."""
    base = site_base.rstrip("/")
    if not allow_indexing:
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            "</urlset>\n"
        )

    urls_xml: list[str] = []
    today = timezone.now().date()

    static_pages_list: list[tuple[str, date | None]] = [
        (f"{base}/", today),
        (f"{base}/catalog", today),
        (f"{base}/portfolio", today),
        (f"{base}/contacts", today),
        (f"{base}/blog", today),
        (f"{base}/sales", today),
        (f"{base}/reviews", today),
    ]
    for loc, lm in static_pages_list:
        urls_xml.append(_xml_url(loc, lm))

    for cat in ProductCategory.objects.filter(is_published=True).order_by("slug"):
        latest = (
            Product.objects.filter(category=cat, is_published=True, category__is_published=True).aggregate(
                m=Max("updated_at")
            )["m"]
        )
        lm = latest.date() if latest else today
        urls_xml.append(_xml_url(f"{base}/catalog/category/{cat.slug}", lm))

    products = (
        Product.objects.filter(is_published=True, category__is_published=True)
        .select_related("category")
        .order_by("slug")
    )
    for p in products:
        lm = p.updated_at.date() if getattr(p, "updated_at", None) else today
        urls_xml.append(_xml_url(f"{base}/catalog/{p.slug}", lm))

    for post in BlogPost.objects.filter(is_published=True).order_by("slug"):
        d = post.published_at or post.updated_at.date()
        urls_xml.append(_xml_url(f"{base}/blog/{post.slug}", d))

    for promo in _public_promotions_catalog_queryset().order_by("slug"):
        lm = promo.updated_at.date() if getattr(promo, "updated_at", None) else today
        urls_xml.append(_xml_url(f"{base}/sales/{promo.slug}", lm))

    for page in StaticPage.objects.filter(is_published=True).order_by("slug"):
        if page.slug in SITEMAP_EXCLUDE_STATIC_SLUGS:
            continue
        lm = page.updated_at.date() if getattr(page, "updated_at", None) else today
        urls_xml.append(_xml_url(f"{base}/{page.slug}", lm))

    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(urls_xml)
        + "</urlset>\n"
    )


def build_robots_txt(site_base: str, *, allow_indexing: bool) -> str:
    """
    robots.txt: общие правила для поисковых роботов (UTF-8).
    Crawl-delay учитывается Яндексом; Google игнорирует.
    """
    base = site_base.rstrip("/")
    if not allow_indexing:
        return "User-agent: *\nDisallow: /\n"

    lines: list[str] = [
        "# Правила для поисковых роботов (UTF-8).",
        "# Канонический сайт: PUBLIC_SITE_URL (DJANGO_PUBLIC_SITE_URL) в .env на сервере.",
        "",
        "User-agent: *",
        "Allow: /",
        "Crawl-delay: 1.5",
        "",
        "# Служебное и личный кабинет — не индексировать.",
        "Disallow: /api/",
        "Disallow: /admin",
        "Disallow: /captcha/",
        "Disallow: /staff",
        "Disallow: /cart",
        "Disallow: /checkout",
        "Disallow: /account",
        "",
        "# Дубли листингов с фильтрами и пагинацией (основные URL без query — в sitemap).",
        "Disallow: /*?*page=",
        "Disallow: /*?*sort=",
        "Disallow: /*?*search=",
        "",
        "# Яндекс: главное зеркало (HTTPS).",
        "User-agent: Yandex",
        f"Host: {base}",
        "",
        "# Яндекс: не учитывать метки в URL как отдельные страницы (дубли).",
        "Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&utm_id"
        "&fbclid&gclid&yclid&_openstat&from&etext&openstat&spm&si /",
        "",
        "Sitemap: " + base + "/sitemap.xml",
        "",
    ]
    return "\n".join(lines)
