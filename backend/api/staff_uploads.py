"""Загрузка файлов для Staff API (спецификация §8)."""

from __future__ import annotations

import os
from uuid import uuid4

from django.core.files.storage import default_storage
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from PIL import Image
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsStaffUser

_ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
_MAX_BYTES = 8 * 1024 * 1024


@extend_schema(tags=["staff"], summary="Загрузка файла (изображение) для последующей привязки к сущности")
class StaffUploadView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        f = request.FILES.get("file")
        if not f:
            raise ValidationError({"file": ["Укажите файл в поле file."]})
        if f.size > _MAX_BYTES:
            raise ValidationError({"file": ["Файл слишком большой (макс. 8 МБ)."]})
        ext = os.path.splitext(f.name)[1].lower()
        if ext not in _ALLOWED_EXT:
            raise ValidationError(
                {"file": [f"Допустимые форматы: {', '.join(sorted(_ALLOWED_EXT))}"]}
            )
        try:
            img = Image.open(f)
            img.verify()
        except Exception:
            raise ValidationError({"file": ["Не удалось прочитать изображение."]})
        finally:
            if hasattr(f, "seek"):
                f.seek(0)
        subdir = timezone.now().strftime("%Y/%m")
        rel = f"uploads/staff/{subdir}/{uuid4().hex}{ext}"
        saved = default_storage.save(rel, f)
        media_url = default_storage.url(saved)
        if media_url.startswith("http"):
            url = media_url
        else:
            url = request.build_absolute_uri(media_url)
        return Response({"relativePath": saved, "url": url})
