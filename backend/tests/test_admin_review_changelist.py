import pytest
from django.contrib.auth import get_user_model
from django.test import Client

from api.models import Review


@pytest.mark.django_db
def test_admin_review_changelist_renders_with_legacy_inconsistent_row():
    """Регрессия: список отзывов в Django admin не должен падать 500 из-за «старых» данных."""
    User = get_user_model()
    User.objects.filter(username="adm_review_list").delete()
    User.objects.create_superuser(
        username="adm_review_list",
        email="adm_review_list@example.com",
        password="passpass12",
    )
    Review.objects.filter(name="legacy-inconsistent").delete()
    Review.objects.create(
        name="legacy-inconsistent",
        city="Москва",
        text="Текст отзыва достаточной длины для валидации.",
        rating=5,
        is_published=True,
        publication_consent=False,
        is_moderated=False,
    )

    c = Client()
    assert c.login(username="adm_review_list", password="passpass12")
    r = c.get("/admin/api/review/")
    assert r.status_code == 200, r.content[:500]
