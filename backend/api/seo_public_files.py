"""Генерация sitemap.xml и robots.txt для frontend/dist, корня выкладки на хостинге и HTTP-views."""

from __future__ import annotations

from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

from django.conf import settings
from django.utils import timezone

from .models import BlogPost, Product, StaticPage
from .views_promotions import _public_promotions_catalog_queryset


def default_frontend_dist_dir() -> Path:
    """Каталог сборки витрины: <repo>/frontend/dist (BASE_DIR = backend/)."""
    return Path(settings.BASE_DIR).parent / "frontend" / "dist"


def default_site_docroot_dir() -> Path:
    """Корень выкладки на хостинге (рядом с backend/, frontend/) — для панели и SFTP как «корень сайта»."""
    return Path(settings.BASE_DIR).parent


def _xml_url(loc: str, lastmod: date | None, changefreq: str, priority: str) -> str:
    parts = [f"  <url>\n    <loc>{escape(loc)}</loc>\n"]
    if lastmod:
        parts.append(f"    <lastmod>{lastmod.isoformat()}</lastmod>\n")
    parts.append(f"    <changefreq>{changefreq}</changefreq>\n")
    parts.append(f"    <priority>{priority}</priority>\n")
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

    static_pages: list[tuple[str, str, str, date | None]] = [
        (f"{base}/", "weekly", "1.0", today),
        (f"{base}/catalog", "daily", "0.9", today),
        (f"{base}/portfolio", "weekly", "0.7", today),
        (f"{base}/contacts", "monthly", "0.8", today),
        (f"{base}/blog", "weekly", "0.8", today),
        (f"{base}/sales", "weekly", "0.82", today),
        (f"{base}/reviews", "monthly", "0.75", today),
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

    for promo in _public_promotions_catalog_queryset().order_by("slug"):
        lm = promo.updated_at.date() if getattr(promo, "updated_at", None) else today
        urls_xml.append(_xml_url(f"{base}/sales/{promo.slug}", lm, "weekly", "0.78"))

    for page in StaticPage.objects.filter(is_published=True).order_by("slug"):
        lm = page.updated_at.date() if getattr(page, "updated_at", None) else today
        urls_xml.append(_xml_url(f"{base}/{page.slug}", lm, "monthly", "0.7"))

    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(urls_xml)
        + "</urlset>\n"
    )


def build_robots_txt(site_base: str, *, allow_indexing: bool) -> str:
    """
    robots.txt: общие правила для Google и Яндекса; Host и Clean-param — только для Яндекса.
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
