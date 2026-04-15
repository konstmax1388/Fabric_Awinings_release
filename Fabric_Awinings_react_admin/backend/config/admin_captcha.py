"""Капча на странице входа Django Admin (django-simple-captcha)."""

from django.contrib.admin.forms import AdminAuthenticationForm
from django.utils.translation import gettext_lazy as _
from captcha.fields import CaptchaField


class AdminLoginFormWithCaptcha(AdminAuthenticationForm):
    captcha = CaptchaField(
        label=_("Введите текст с картинки"),
    )


def apply_admin_login_form() -> None:
    """Назначить форму входа с капчей, если включено в настройках."""
    from django.conf import settings
    from django.contrib import admin

    if getattr(settings, "ADMIN_LOGIN_CAPTCHA", False):
        admin.site.login_form = AdminLoginFormWithCaptcha
