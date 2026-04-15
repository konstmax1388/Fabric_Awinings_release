import pytest
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.test.utils import override_settings

from config.admin_captcha import AdminLoginFormWithCaptcha


@pytest.mark.django_db
def test_admin_login_without_captcha_rejected_when_form_requires_it(client):
    """При форме с CaptchaField вход без полей капчи не должен аутентифицировать."""
    User = get_user_model()
    User.objects.create_superuser("cap_adm", "cap@test.com", "secretpass1")
    old_form = admin.site.login_form
    try:
        admin.site.login_form = AdminLoginFormWithCaptcha
        with override_settings(ADMIN_LOGIN_CAPTCHA=True):
            r = client.post(
                "/admin/login/",
                {"username": "cap_adm", "password": "secretpass1"},
            )
        assert r.status_code == 200
        r2 = client.get("/admin/")
        assert r2.status_code == 302
        assert "login" in (r2.get("Location") or "")
    finally:
        admin.site.login_form = old_form
