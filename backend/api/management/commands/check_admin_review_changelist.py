"""Диагностика: GET /admin/api/review/ как суперпользователь (для отладки 500 в админке)."""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.test import Client


class Command(BaseCommand):
    help = "Проверяет ответ Django admin для списка отзывов (api.Review)."

    def handle(self, *args, **options):
        User = get_user_model()
        u = User.objects.filter(is_superuser=True).order_by("id").first()
        if u is None:
            self.stderr.write("Нет суперпользователя в БД.")
            return
        host = "localhost"
        for h in getattr(settings, "ALLOWED_HOSTS", ()):
            if h and h != "*" and h != ".localhost":
                host = h.lstrip(".")
                break
        c = Client()
        c.force_login(u)
        r = c.get("/admin/api/review/", HTTP_HOST=host)
        self.stdout.write(f"status={r.status_code}")
        if r.status_code != 200:
            self.stderr.write(r.content.decode("utf-8", errors="replace")[:8000])
