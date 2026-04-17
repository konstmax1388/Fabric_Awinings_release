"""Проверка HTTP GET для всех changelist в Django admin (отладка 500 на списках).

На сервере запускать с подгрузкой прод-окружения, иначе подключится пустой SQLite::

    cd backend && set -a && source ../.env && set +a && source .venv/bin/activate \\
      && python manage.py check_admin_changelists
"""

from __future__ import annotations

from django.conf import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.test import Client
from django.urls import reverse


class Command(BaseCommand):
    help = "GET каждого admin:…_changelist под суперпользователем; печать кодов != 200."

    def add_arguments(self, parser):
        parser.add_argument(
            "--fail-fast",
            action="store_true",
            help="Остановиться на первом ответе не 200.",
        )

    def handle(self, *args, **options):
        fail_fast: bool = options["fail_fast"]
        User = get_user_model()
        u = User.objects.filter(is_superuser=True, is_active=True).order_by("id").first()
        if u is None:
            u = User.objects.filter(is_superuser=True).order_by("id").first()
        if u is None:
            self.stderr.write("Нет суперпользователя в БД (нужен хотя бы один is_superuser=True).")
            return
        if not u.is_active:
            self.stderr.write(
                self.style.WARNING(
                    "Используется неактивный суперпользователь (для регресса через test Client это допустимо)."
                )
            )

        host = "localhost"
        for h in getattr(settings, "ALLOWED_HOSTS", ()):
            if h and h != "*" and h != ".localhost":
                host = h.lstrip(".")
                break

        c = Client(raise_request_exception=False)
        c.force_login(u)
        bad: list[tuple[str, int, str]] = []

        for model, _model_admin in admin.site._registry.items():
            app_label = model._meta.app_label
            model_name = model._meta.model_name
            try:
                url = reverse(f"admin:{app_label}_{model_name}_changelist")
            except Exception as e:
                bad.append((f"{app_label}.{model_name}", 0, f"reverse: {e}"))
                if fail_fast:
                    break
                continue
            r = c.get(url, HTTP_HOST=host)
            # Singleton-админки (SiteSettings, HomePageContent) отдают редирект на первую секцию.
            if r.status_code not in (200, 302):
                snippet = r.content.decode("utf-8", errors="replace")[:2000]
                bad.append((url, r.status_code, snippet))
                self.stderr.write(f"{r.status_code} {url}")
                if fail_fast:
                    break
            else:
                self.stdout.write(f"{r.status_code} {url}")

        if bad and not fail_fast:
            self.stdout.write(self.style.WARNING(f"\nИтого ответов не 200: {len(bad)}"))
        elif not bad:
            self.stdout.write(self.style.SUCCESS("Все changelist ответили 200 (или 302 для singleton)."))
