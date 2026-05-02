"""Публичный SEO объекта статьи блога (детальный API)."""

from __future__ import annotations

import pytest
from django.test import RequestFactory

from api.models import BlogPost, SiteSettings


@pytest.mark.django_db
def test_blog_post_detail_has_seo_block():
    rf = RequestFactory()
    request = rf.get("/api/blog/test-seo-slug/")
    SiteSettings.objects.update_or_create(
        pk=1,
        defaults={
            "site_name": "Тестовый магазин",
            "seo_title_suffix": "| ТМ",
            "seo_allow_indexing": True,
            "seo_default_meta_description": "Дефолтное описание сайта.",
            "seo_meta_description_max": 160,
        },
    )
    ss = SiteSettings.get_solo()
    BlogPost.objects.create(
        title="Заголовок статьи SEO",
        slug="test-seo-slug",
        excerpt="Краткий анонс для description.",
        body="<p>Текст</p>",
        is_published=True,
    )
    post = BlogPost.objects.get(slug="test-seo-slug")
    from api.serializers import BlogPostDetailSerializer

    data = BlogPostDetailSerializer(post, context={"request": request, "site_settings": ss}).data
    seo = data.get("seo")
    assert isinstance(seo, dict)
    assert "Заголовок статьи SEO" in seo["pageTitle"]
    assert "Краткий анонс" in seo["metaDescription"]
    assert seo["canonicalPath"] == "/blog/test-seo-slug"
    assert seo["canonicalUrl"].endswith("/blog/test-seo-slug")
    assert seo["robots"] == "index, follow"


@pytest.mark.django_db
def test_blog_post_meta_from_body_when_excerpt_empty():
    rf = RequestFactory()
    request = rf.get("/")
    SiteSettings.objects.update_or_create(
        pk=1,
        defaults={
            "site_name": "S",
            "seo_allow_indexing": True,
            "seo_meta_description_max": 80,
            "seo_default_meta_description": "",
        },
    )
    ss = SiteSettings.get_solo()
    BlogPost.objects.create(
        title="T",
        slug="body-meta-slug",
        excerpt="",
        body="<p>Первый абзац для мета-описания достаточно длинный чтобы проверить обрезку.</p>",
        is_published=True,
    )
    post = BlogPost.objects.get(slug="body-meta-slug")
    from api.serializers import BlogPostDetailSerializer

    data = BlogPostDetailSerializer(post, context={"request": request, "site_settings": ss}).data
    desc = data["seo"]["metaDescription"]
    assert "Первый абзац" in desc
    assert len(desc) <= 80


@pytest.mark.django_db
def test_blog_post_list_excerpt_is_sanitized_html():
    BlogPost.objects.create(
        title="List HTML",
        slug="list-html-san",
        excerpt='<p class="x">Анонс</p><script>evil()</script>',
        body="",
        is_published=True,
    )
    post = BlogPost.objects.get(slug="list-html-san")
    from api.serializers import BlogPostListSerializer

    data = BlogPostListSerializer(post).data
    assert "<script>" not in (data.get("excerpt") or "")
    assert "Анонс" in (data.get("excerpt") or "")
