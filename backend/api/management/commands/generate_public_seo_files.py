"""Записать sitemap.xml и robots.txt в корень сборки витрины (frontend/dist)."""

from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from api.models import SiteSettings
from api.seo_public_files import build_robots_txt, build_sitemap_xml, default_frontend_dist_dir


class Command(BaseCommand):
    help = "Записать sitemap.xml и robots.txt в frontend/dist (после npm run build, на сервере — из .env)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            type=str,
            default="",
            help="Каталог назначения (по умолчанию: <репозиторий>/frontend/dist)",
        )

    def handle(self, *args, **options):
        raw_out = (options.get("output") or "").strip()
        dest: Path = Path(raw_out).resolve() if raw_out else default_frontend_dist_dir()
        if not dest.is_dir():
            self.stderr.write(self.style.ERROR(f"Каталог не найден: {dest} (сначала npm run build во frontend/)"))
            raise SystemExit(1)

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

        sitemap_path = dest / "sitemap.xml"
        robots_path = dest / "robots.txt"
        sitemap_path.write_text(build_sitemap_xml(base, allow_indexing=allow), encoding="utf-8")
        robots_path.write_text(build_robots_txt(base, allow_indexing=allow), encoding="utf-8")

        self.stdout.write(self.style.SUCCESS(f"Записано: {sitemap_path} и {robots_path} (индексация={'да' if allow else 'нет'})"))
