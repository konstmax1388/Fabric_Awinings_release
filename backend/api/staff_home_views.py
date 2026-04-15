"""Staff API: контент главной страницы (singleton + секции)."""

from __future__ import annotations

from typing import Any

from django.http import Http404
from drf_spectacular.utils import extend_schema
from rest_framework import serializers as drf_serializers
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from config.homepage_nav import SECTION_FIELDS, SECTION_ORDER

from .home_page_admin_form import HomePageSectionForm, apply_homepage_section_save
from .home_defaults import merged_home_payload
from .models import HomePageContent
from .permissions import IsStaffUser
from .staff_content_serializers import _abs_media, _apply_image_relative_path
from .staff_utils import camel_to_snake, snake_to_camel

_HP_IMAGE_RELATIVE: dict[str, str] = {
    "heroBackgroundRelativePath": "hero_background",
    "ps0IconImageRelativePath": "ps0_icon_image",
    "ps1IconImageRelativePath": "ps1_icon_image",
    "ps2IconImageRelativePath": "ps2_icon_image",
    "ps3IconImageRelativePath": "ps3_icon_image",
}


def _home_image_urls(request, obj: HomePageContent) -> dict[str, str]:
    return {
        "heroBackgroundUrl": _abs_media(request, obj.hero_background),
        "ps0IconImageUrl": _abs_media(request, obj.ps0_icon_image),
        "ps1IconImageUrl": _abs_media(request, obj.ps1_icon_image),
        "ps2IconImageUrl": _abs_media(request, obj.ps2_icon_image),
        "ps3IconImageUrl": _abs_media(request, obj.ps3_icon_image),
    }


@extend_schema(tags=["staff"], summary="Главная страница: текущий payload и URL изображений")
class HomeContentCurrentStaffView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        obj = HomePageContent.get_solo()
        payload = merged_home_payload(obj.payload if isinstance(obj.payload, dict) else {})
        return Response(
            {
                "payload": payload,
                "sectionOrder": list(SECTION_ORDER),
                "images": _home_image_urls(request, obj),
            }
        )


@extend_schema(tags=["staff"], summary="Главная страница: секция по slug")
class HomeContentSectionStaffView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request, slug: str):
        if slug not in SECTION_FIELDS:
            raise Http404
        obj = HomePageContent.get_solo()
        fields = SECTION_FIELDS[slug]
        data: dict[str, Any] = {"slug": slug}
        ghost = HomePageSectionForm(instance=obj, section_slug=slug)
        for name in fields:
            bf = ghost.fields.get(name)
            if bf is None:
                continue
            val = ghost.initial.get(name, bf.initial)
            ck = snake_to_camel(name)
            if hasattr(val, "isoformat"):
                data[ck] = val.isoformat() if val else None
            elif val is not None and hasattr(val, "quantize"):
                data[ck] = str(val)
            else:
                data[ck] = val
        data["imageUrls"] = _home_image_urls(request, obj)
        return Response(data)

    def patch(self, request, slug: str):
        if slug not in SECTION_FIELDS:
            raise Http404
        obj = HomePageContent.get_solo()
        raw = dict(request.data) if hasattr(request.data, "keys") else {}
        post_data: dict[str, Any] = {}
        for k, v in raw.items():
            if k in _HP_IMAGE_RELATIVE:
                continue
            post_data[camel_to_snake(str(k))] = v
        form = HomePageSectionForm(data=post_data, instance=obj, section_slug=slug)
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
        apply_homepage_section_save(obj, form.cleaned_data)
        fields_set = set(SECTION_FIELDS[slug])
        for camel, fname in _HP_IMAGE_RELATIVE.items():
            if fname not in fields_set or camel not in raw:
                continue
            try:
                _apply_image_relative_path(obj, fname, raw.get(camel), camel)
            except drf_serializers.ValidationError:
                raise
            except Exception as exc:
                raise drf_serializers.ValidationError({camel: [str(exc)]}) from exc
        obj.save()
        return self.get(request, slug)
