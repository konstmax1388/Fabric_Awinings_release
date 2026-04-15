"""Тесты Staff API: контент и загрузки."""

import io

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework_simplejwt.tokens import RefreshToken


def _staff_token(client):
    User = get_user_model()
    u = User.objects.create_user(
        username="staff_content",
        email="staff_content@example.com",
        password="staffpass12",
        is_staff=True,
    )
    return str(RefreshToken.for_user(u).access_token)


def _tiny_png():
    buf = io.BytesIO()
    Image.new("RGB", (4, 4), color=(200, 100, 50)).save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


@pytest.mark.django_db
def test_staff_upload_and_portfolio_create(client):
    auth = f"Bearer {_staff_token(client)}"
    png = _tiny_png()
    up = client.post(
        "/api/staff/v1/uploads/",
        data={"file": SimpleUploadedFile("x.png", png, content_type="image/png")},
        HTTP_AUTHORIZATION=auth,
    )
    assert up.status_code == 200, up.content
    rel = up.json()["relativePath"]
    assert rel

    r = client.post(
        "/api/staff/v1/portfolio-projects/",
        data={
            "title": "Проект А",
            "category": "Тенты",
            "slug": "",
            "beforeImageRelativePath": rel,
            "completedOn": "2025-06-01",
            "isPublished": True,
            "sortOrder": 1,
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=auth,
    )
    assert r.status_code == 201, r.content
    body = r.json()
    assert body["title"] == "Проект А"
    assert body["beforeImageUrl"]
    pid = body["id"]

    r2 = client.get(f"/api/staff/v1/portfolio-projects/{pid}/", HTTP_AUTHORIZATION=auth)
    assert r2.status_code == 200
    assert r2.json()["beforeImageUrl"]


@pytest.mark.django_db
def test_staff_review_blog_email(client):
    from api.models import SiteEmailTemplate

    auth = f"Bearer {_staff_token(client)}"

    r = client.post(
        "/api/staff/v1/reviews/",
        data={
            "name": "Иван",
            "text": "Отлично",
            "rating": 5,
            "videoUrl": "",
            "isPublished": True,
            "sortOrder": 0,
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=auth,
    )
    assert r.status_code == 201, r.content
    rid = r.json()["id"]

    b = client.post(
        "/api/staff/v1/blog-posts/",
        data={
            "title": "Статья 1",
            "slug": "",
            "excerpt": "Анонс",
            "body": "Текст",
            "isPublished": True,
        },
        content_type="application/json",
        HTTP_AUTHORIZATION=auth,
    )
    assert b.status_code == 201, b.content
    bid = b.json()["id"]

    tpl = SiteEmailTemplate.objects.first()
    assert tpl is not None
    eid = str(tpl.pk)
    patch = client.patch(
        f"/api/staff/v1/email-templates/{eid}/",
        data={"subject": "Тема тест", "body": "Текст тест"},
        content_type="application/json",
        HTTP_AUTHORIZATION=auth,
    )
    assert patch.status_code == 200, patch.content
    assert patch.json()["subject"] == "Тема тест"

    d = client.delete(f"/api/staff/v1/reviews/{rid}/", HTTP_AUTHORIZATION=auth)
    assert d.status_code == 204
    d2 = client.delete(f"/api/staff/v1/blog-posts/{bid}/", HTTP_AUTHORIZATION=auth)
    assert d2.status_code == 204


@pytest.mark.django_db
def test_staff_email_template_no_create(client):
    auth = f"Bearer {_staff_token(client)}"
    r = client.post(
        "/api/staff/v1/email-templates/",
        data={"key": "x", "subject": "s", "body": "b"},
        content_type="application/json",
        HTTP_AUTHORIZATION=auth,
    )
    assert r.status_code == 405
