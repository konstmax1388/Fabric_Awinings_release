"""Суперпользователь для локальной разработки. Не вызывать при DEBUG=False в проде."""

import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Создать/обновить суперпользователя для разработки (только при DEBUG=True)."

    def handle(self, *args, **options):
        if not settings.DEBUG:
            self.stdout.write(self.style.WARNING("ensure_dev_admin: пропуск (DEBUG=False)."))
            return

        username = (os.environ.get("DJANGO_DEV_ADMIN_USERNAME") or "dev").strip()
        password = os.environ.get("DJANGO_DEV_ADMIN_PASSWORD") or "devdev"
        email = (os.environ.get("DJANGO_DEV_ADMIN_EMAIL") or f"{username}@dev.local").strip()

        if not username:
            self.stdout.write(self.style.ERROR("ensure_dev_admin: пустой username."))
            return

        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )
        if not created:
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            if email:
                user.email = email
            user.save()

        user.set_password(password)
        user.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"ensure_dev_admin: готов вход в /admin/ — логин «{username}», пароль задан (см. DJANGO_DEV_ADMIN_PASSWORD или devdev)."
            )
        )
