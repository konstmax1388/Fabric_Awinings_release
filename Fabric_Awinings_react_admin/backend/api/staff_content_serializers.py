"""Сериализаторы Staff API: контент (camelCase)."""

from __future__ import annotations

from typing import Any

from django.core.files.storage import default_storage
from rest_framework import serializers

from .models import BlogPost, PortfolioProject, Review, SiteEmailTemplate


def _abs_media(request, f) -> str:
    if not f or not getattr(f, "name", None):
        return ""
    u = f.url
    if request and u.startswith("/"):
        return request.build_absolute_uri(u)
    return u


def _apply_image_relative_path(
    instance,
    attr: str,
    val: str | None,
    err_key: str,
) -> None:
    """Подставляет путь в ImageField после POST /uploads/. Пустая строка — сбросить файл."""
    if val is None:
        return
    s = val.strip()
    field = getattr(instance, attr)
    if s == "":
        field.delete(save=False)
        return
    if not default_storage.exists(s):
        raise serializers.ValidationError(
            {err_key: ["Файл не найден. Сначала загрузите через POST /api/staff/v1/uploads/."]}
        )
    field.name = s


class PortfolioProjectStaffSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=120)
    beforeImageRelativePath = serializers.CharField(write_only=True, required=False, allow_blank=True)
    afterImageRelativePath = serializers.CharField(write_only=True, required=False, allow_blank=True)
    completedOn = serializers.DateField(source="completed_on", allow_null=True, required=False)
    isPublished = serializers.BooleanField(source="is_published")
    sortOrder = serializers.IntegerField(source="sort_order", min_value=0)

    class Meta:
        model = PortfolioProject
        fields = (
            "id",
            "slug",
            "title",
            "category",
            "beforeImageRelativePath",
            "afterImageRelativePath",
            "completedOn",
            "isPublished",
            "sortOrder",
        )
        read_only_fields = ("id",)

    def to_representation(self, instance: PortfolioProject) -> dict[str, Any]:
        req = self.context.get("request")
        return {
            "id": str(instance.pk),
            "slug": instance.slug,
            "title": instance.title,
            "category": instance.category,
            "beforeImageUrl": _abs_media(req, instance.before_image_file),
            "afterImageUrl": _abs_media(req, instance.after_image_file),
            "completedOn": instance.completed_on.isoformat() if instance.completed_on else None,
            "isPublished": instance.is_published,
            "sortOrder": instance.sort_order,
            "createdAt": instance.created_at.isoformat() if instance.created_at else None,
        }

    def create(self, validated_data: dict) -> PortfolioProject:
        b = validated_data.pop("beforeImageRelativePath", None)
        a = validated_data.pop("afterImageRelativePath", None)
        instance = PortfolioProject.objects.create(**validated_data)
        try:
            _apply_image_relative_path(instance, "before_image_file", b, "beforeImageRelativePath")
            _apply_image_relative_path(instance, "after_image_file", a, "afterImageRelativePath")
        except serializers.ValidationError:
            instance.delete()
            raise
        instance.save()
        return instance

    def update(self, instance: PortfolioProject, validated_data: dict) -> PortfolioProject:
        b = validated_data.pop("beforeImageRelativePath", None)
        a = validated_data.pop("afterImageRelativePath", None)
        instance = super().update(instance, validated_data)
        _apply_image_relative_path(instance, "before_image_file", b, "beforeImageRelativePath")
        _apply_image_relative_path(instance, "after_image_file", a, "afterImageRelativePath")
        instance.save()
        return instance


class ReviewStaffSerializer(serializers.ModelSerializer):
    photoRelativePath = serializers.CharField(write_only=True, required=False, allow_blank=True)
    videoUrl = serializers.URLField(source="video_url", allow_blank=True, required=False, max_length=2048)
    isPublished = serializers.BooleanField(source="is_published")
    sortOrder = serializers.IntegerField(source="sort_order", min_value=0)
    rating = serializers.IntegerField(min_value=1, max_value=5)

    class Meta:
        model = Review
        fields = (
            "id",
            "name",
            "text",
            "rating",
            "photoRelativePath",
            "videoUrl",
            "isPublished",
            "sortOrder",
        )
        read_only_fields = ("id",)

    def to_representation(self, instance: Review) -> dict[str, Any]:
        req = self.context.get("request")
        return {
            "id": str(instance.pk),
            "name": instance.name,
            "text": instance.text,
            "rating": instance.rating,
            "photoUrl": _abs_media(req, instance.photo_file),
            "videoUrl": instance.video_url or "",
            "isPublished": instance.is_published,
            "sortOrder": instance.sort_order,
            "createdAt": instance.created_at.isoformat() if instance.created_at else None,
        }

    def create(self, validated_data: dict) -> Review:
        p = validated_data.pop("photoRelativePath", None)
        instance = Review.objects.create(**validated_data)
        try:
            _apply_image_relative_path(instance, "photo_file", p, "photoRelativePath")
        except serializers.ValidationError:
            instance.delete()
            raise
        instance.save()
        return instance

    def update(self, instance: Review, validated_data: dict) -> Review:
        p = validated_data.pop("photoRelativePath", None)
        instance = super().update(instance, validated_data)
        _apply_image_relative_path(instance, "photo_file", p, "photoRelativePath")
        instance.save()
        return instance


class BlogPostStaffSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=160)
    coverImageRelativePath = serializers.CharField(write_only=True, required=False, allow_blank=True)
    publishedAt = serializers.DateField(source="published_at", allow_null=True, required=False)
    isPublished = serializers.BooleanField(source="is_published")

    class Meta:
        model = BlogPost
        fields = (
            "id",
            "slug",
            "title",
            "excerpt",
            "body",
            "coverImageRelativePath",
            "publishedAt",
            "isPublished",
        )
        read_only_fields = ("id",)

    def to_representation(self, instance: BlogPost) -> dict[str, Any]:
        req = self.context.get("request")
        return {
            "id": str(instance.pk),
            "slug": instance.slug,
            "title": instance.title,
            "excerpt": instance.excerpt,
            "body": instance.body,
            "coverImageUrl": _abs_media(req, instance.cover_image),
            "publishedAt": instance.published_at.isoformat() if instance.published_at else None,
            "isPublished": instance.is_published,
            "createdAt": instance.created_at.isoformat() if instance.created_at else None,
            "updatedAt": instance.updated_at.isoformat() if instance.updated_at else None,
        }

    def create(self, validated_data: dict) -> BlogPost:
        c = validated_data.pop("coverImageRelativePath", None)
        instance = BlogPost.objects.create(**validated_data)
        try:
            _apply_image_relative_path(instance, "cover_image", c, "coverImageRelativePath")
        except serializers.ValidationError:
            instance.delete()
            raise
        instance.save()
        return instance

    def update(self, instance: BlogPost, validated_data: dict) -> BlogPost:
        c = validated_data.pop("coverImageRelativePath", None)
        instance = super().update(instance, validated_data)
        _apply_image_relative_path(instance, "cover_image", c, "coverImageRelativePath")
        instance.save()
        return instance


class SiteEmailTemplateStaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteEmailTemplate
        fields = ("id", "key", "subject", "body")
        read_only_fields = ("id", "key")

    def to_representation(self, instance: SiteEmailTemplate) -> dict[str, Any]:
        return {
            "id": str(instance.pk),
            "key": instance.key,
            "keyLabel": instance.get_key_display(),
            "subject": instance.subject,
            "body": instance.body,
        }
