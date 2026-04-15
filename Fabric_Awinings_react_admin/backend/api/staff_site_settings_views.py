"""Staff API: настройки сайта (singleton + секции)."""

from __future__ import annotations

from typing import Any

from django.core.exceptions import FieldDoesNotExist
from django.db import models
from django.http import Http404
from drf_spectacular.utils import extend_schema
from rest_framework import serializers as drf_serializers
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from config.sitesettings_nav import SECTION_FIELDS, SECTION_ORDER

from .admin import _sitesettings_section_modelform_factory, _validate_astrum_crm_section
from .models import SiteSettings
from .permissions import IsStaffUser
from .staff_content_serializers import _apply_image_relative_path
from .staff_utils import camel_to_snake, drf_json_safe_response, model_instance_to_camel_dict

_SECRET_WRITE_MAP = {
    "smtpPasswordNew": "smtp_password",
    "astrumCrmApiKeyNew": "astrum_crm_api_key",
    "cdekSecurePasswordNew": "cdek_secure_password",
    "ozonPayClientSecretNew": "ozon_pay_client_secret",
    "ozonPayWebhookSecretNew": "ozon_pay_webhook_secret",
    "bitrix24WebhookBaseNew": "bitrix24_webhook_base",
}

_IMAGE_RELATIVE = {
    "logoRelativePath": "logo",
    "faviconRelativePath": "favicon",
}

# Только через *RelativePath + uploads/, иначе можно случайно записать строку в FileField.
_SITE_FILE_MODEL_FIELDS = frozenset({"logo", "favicon"})


def _sitesettings_all_field_names() -> tuple[str, ...]:
    return tuple(f.name for f in SiteSettings._meta.concrete_fields if f.name != "id")


def _body_to_snake_flat(body: Any) -> dict[str, Any]:
    if not isinstance(body, dict):
        return {}
    out: dict[str, Any] = {}
    for k, v in body.items():
        if k in _SECRET_WRITE_MAP or k in _IMAGE_RELATIVE:
            continue
        sk = camel_to_snake(str(k))
        out[sk] = v
    return out


def _normalize_sitesettings_updates(updates: dict[str, Any]) -> dict[str, Any]:
    """Пустые строки из форм → None для nullable; не писать «***» в секреты при round-trip."""
    out = dict(updates)
    for k, v in list(out.items()):
        if _is_secret_snake(k) and isinstance(v, str) and v.strip() in ("***", "*"):
            out.pop(k, None)
            continue
        try:
            f = SiteSettings._meta.get_field(k)
        except FieldDoesNotExist:
            out.pop(k, None)
            continue
        if v == "" and getattr(f, "null", False):
            out[k] = None
        elif v == "" and isinstance(
            f, (models.IntegerField, models.PositiveIntegerField, models.PositiveSmallIntegerField)
        ):
            out.pop(k, None)
    return out


def _is_secret_snake(name: str) -> bool:
    fl = name.lower()
    return "password" in fl or "secret" in fl or fl.endswith("_key") or fl == "bitrix24_webhook_base"


@extend_schema(tags=["staff"], summary="Настройки сайта: текущий объект (маскированные секреты)")
class SiteSettingsCurrentStaffView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        obj = SiteSettings.get_solo()
        data: dict[str, Any] = {}
        for fname in _sitesettings_all_field_names():
            data.update(model_instance_to_camel_dict(obj, (fname,), request, mask_secrets=True))
        data["sectionOrder"] = list(SECTION_ORDER)
        return drf_json_safe_response(data)

    def patch(self, request):
        obj = SiteSettings.get_solo()
        body = request.data
        updates = _normalize_sitesettings_updates(_body_to_snake_flat(body))
        allowed = set(_sitesettings_all_field_names())
        for k, v in list(updates.items()):
            if k not in allowed or k in _SITE_FILE_MODEL_FIELDS:
                updates.pop(k, None)
        for camel, attr in _IMAGE_RELATIVE.items():
            rel = body.get(camel)
            if camel in body:
                try:
                    _apply_image_relative_path(obj, attr, rel, camel)
                except drf_serializers.ValidationError:
                    raise
                except Exception as exc:
                    raise drf_serializers.ValidationError({camel: [str(exc)]}) from exc
        for camel, snake in _SECRET_WRITE_MAP.items():
            if camel not in body:
                continue
            val = body.get(camel)
            if val is None or (isinstance(val, str) and not val.strip()):
                continue
            if snake in allowed:
                setattr(obj, snake, val)
        for k, v in updates.items():
            setattr(obj, k, v)
        obj.save()
        return self.get(request)


@extend_schema(tags=["staff"], summary="Настройки сайта: секция по slug")
class SiteSettingsSectionStaffView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request, slug: str):
        if slug not in SECTION_FIELDS:
            raise Http404
        obj = SiteSettings.get_solo()
        fields = SECTION_FIELDS[slug]
        data = model_instance_to_camel_dict(obj, fields, request, mask_secrets=True)
        data["slug"] = slug
        return drf_json_safe_response(data)

    def patch(self, request, slug: str):
        if slug not in SECTION_FIELDS:
            raise Http404
        obj = SiteSettings.get_solo()
        fields = SECTION_FIELDS[slug]
        Form = _sitesettings_section_modelform_factory(request, fields)
        raw = dict(request.data) if hasattr(request.data, "keys") else {}
        post_data: dict[str, Any] = {}
        for k, v in raw.items():
            if k in _IMAGE_RELATIVE or k in _SECRET_WRITE_MAP:
                continue
            post_data[camel_to_snake(str(k))] = v
        for camel, attr in _IMAGE_RELATIVE.items():
            if camel in raw and attr in fields:
                try:
                    _apply_image_relative_path(obj, attr, raw.get(camel), camel)
                except drf_serializers.ValidationError:
                    raise
                except Exception as exc:
                    raise drf_serializers.ValidationError({camel: [str(exc)]}) from exc
        form = Form(data=post_data, files=request.FILES, instance=obj)
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
        if slug == "crm_astrum":
            _validate_astrum_crm_section(form)
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
        for camel, snake in _SECRET_WRITE_MAP.items():
            if camel not in raw or snake not in fields:
                continue
            val = raw.get(camel)
            if val is None or (isinstance(val, str) and not val.strip()):
                continue
            setattr(obj, snake, val)
        form.save()
        return self.get(request, slug)
