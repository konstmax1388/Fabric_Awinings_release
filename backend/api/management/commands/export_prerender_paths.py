"""Записать список путей витрины для статического prerender (frontend/scripts/prerender.mjs)."""

from __future__ import annotations

import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from api.seo_public_files import iter_sitemap_path_lastmod_pairs


class Command(BaseCommand):
    help = (
        "JSON-массив путей (как в sitemap) в frontend/prerender-paths.json для скрипта prerender после vite build."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--out",
            type=str,
            default="",
            help="Путь к JSON (по умолчанию: <repo>/frontend/prerender-paths.json).",
        )

    def handle(self, *args, **options):
        raw_out = (options.get("out") or "").strip()
        out_path = Path(raw_out) if raw_out else Path(settings.BASE_DIR).parent / "frontend" / "prerender-paths.json"
        out_path = out_path.resolve()
        paths = [p for p, _ in iter_sitemap_path_lastmod_pairs()]
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(paths, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        self.stdout.write(self.style.SUCCESS(f"Записано {len(paths)} путей: {out_path}"))
