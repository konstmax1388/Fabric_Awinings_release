"""Записать sitemap.xml и robots.txt в frontend/dist и в корень выкладки на хостинге."""

from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from api.models import SiteSettings
from api.seo_public_files import (
    build_robots_txt,
    build_sitemap_xml,
    default_frontend_dist_dir,
    default_site_docroot_dir,
)


class Command(BaseCommand):
    help = (
        "Записать sitemap.xml и robots.txt в frontend/dist (для nginx) и в корень репозитория "
        "(рядом с backend/, для панели хостинга). Деплой вызывает команду дважды: до и после prune, "
        "чтобы файлы не пропадали после очистки дерева."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            type=str,
            default="",
            help="Только один каталог (тесты): иначе пишем и в frontend/dist, и в корень сайта.",
        )

    def handle(self, *args, **options):
        raw_out = (options.get("output") or "").strip()

        base = (getattr(settings, "PUBLIC_SITE_URL", "") or "").strip().rstrip("/")
        if not base:
            self.stderr.write(
                self.style.WARNING(
                    "PUBLIC_SITE_URL пуст — проверьте DJANGO_PUBLIC_SITE_URL в .env; для sitemap/robots нужен канонический URL."
                )
            )

        allow = SiteSettings.get_solo().seo_allow_indexing
        if not base:
            base = "http://127.0.0.1:17300"

        sitemap_body = build_sitemap_xml(base, allow_indexing=allow)
        robots_body = build_robots_txt(base, allow_indexing=allow)

        if raw_out:
            dest = Path(raw_out).resolve()
            if not dest.is_dir():
                self.stderr.write(
                    self.style.ERROR(f"Каталог не найден: {dest} (сначала npm run build во frontend/)")
                )
                raise SystemExit(1)
            (dest / "sitemap.xml").write_text(sitemap_body, encoding="utf-8")
            (dest / "robots.txt").write_text(robots_body, encoding="utf-8")
            self.stdout.write(
                self.style.SUCCESS(
                    f"Записано только в {dest}: sitemap.xml, robots.txt (индексация={'да' if allow else 'нет'})"
                )
            )
            return

        dist = default_frontend_dist_dir()
        site_root = default_site_docroot_dir()
        if not dist.is_dir():
            self.stderr.write(
                self.style.ERROR(f"Каталог не найден: {dist} (сначала npm run build во frontend/)")
            )
            raise SystemExit(1)

        targets = [
            dist / "sitemap.xml",
            dist / "robots.txt",
            site_root / "sitemap.xml",
            site_root / "robots.txt",
        ]
        for p in targets:
            body = sitemap_body if p.name == "sitemap.xml" else robots_body
            p.write_text(body, encoding="utf-8")

        self.stdout.write(
            self.style.SUCCESS(
                f"Записано: {dist / 'sitemap.xml'}, {dist / 'robots.txt'}, "
                f"{site_root / 'sitemap.xml'}, {site_root / 'robots.txt'} (индексация={'да' if allow else 'нет'})"
            )
        )
