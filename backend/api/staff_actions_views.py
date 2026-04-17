"""Staff API: операции (импорт WB, SMTP, Битрикс24)."""

from __future__ import annotations

import logging
from typing import Any

_logger = logging.getLogger(__name__)

from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ProductCategory
from .permissions import IsStaffUser
from .product_wb_import import WbImportError, import_one_from_wb_url
from .services.bitrix24_admin_test import run_bitrix24_saved_settings_test
from .services.bitrix24_catalog_sync import run_bitrix24_catalog_sync_job
from .services.notification_email import parse_recipient_list, send_smtp_test


class WbImportStaffSerializer(serializers.Serializer):
    urls = serializers.ListField(child=serializers.CharField(), allow_empty=False)
    categoryId = serializers.IntegerField(min_value=1)
    publish = serializers.BooleanField(default=True)
    dryRun = serializers.BooleanField(default=False)


@extend_schema(tags=["staff"], summary="Импорт карточек с Wildberries по URL")
class StaffWbImportView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def post(self, request, *args, **kwargs):
        ser = WbImportStaffSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        urls = [u.strip() for u in ser.validated_data["urls"] if (u or "").strip()]
        if not urls:
            return Response({"detail": "Список urls пуст."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            category = ProductCategory.objects.get(pk=ser.validated_data["categoryId"])
        except ProductCategory.DoesNotExist:
            return Response({"detail": "Категория не найдена."}, status=status.HTTP_400_BAD_REQUEST)
        publish = ser.validated_data["publish"]
        dry = ser.validated_data["dryRun"]
        results: list[dict[str, Any]] = []
        for line in urls:
            try:
                preview, p, wb_warnings = import_one_from_wb_url(
                    line,
                    category=category,
                    publish=publish,
                    dry_run=dry,
                )
            except WbImportError as e:
                results.append({"url": line, "ok": False, "message": str(e), "productId": None})
                continue
            except Exception as e:
                _logger.exception("WB import failed (staff API)")
                results.append(
                    {
                        "url": line,
                        "ok": False,
                        "message": str(e),
                        "productId": None,
                    }
                )
                continue
            msg_parts: list[str] = []
            if dry and preview is not None:
                msg_parts.append(
                    f"nm={preview.seed_nm}, вариантов {len(preview.variants)}, "
                    f"характеристик {len(preview.specifications)}"
                )
            elif p is not None:
                msg_parts.append(f"Создан товар «{p.title}» (id={p.pk})")
            for w in wb_warnings:
                msg_parts.append(str(w))
            results.append(
                {
                    "url": line,
                    "ok": True,
                    "message": "; ".join(msg_parts) if msg_parts else "OK",
                    "productId": None if dry or p is None else str(p.pk),
                }
            )
        return Response({"results": results})


class SmtpTestStaffSerializer(serializers.Serializer):
    toEmail = serializers.EmailField(required=False, allow_blank=True)


@extend_schema(tags=["staff"], summary="Проверка SMTP (тестовое письмо)")
class StaffSmtpTestView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def post(self, request, *args, **kwargs):
        ser = SmtpTestStaffSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        from .models import SiteSettings

        to = (ser.validated_data.get("toEmail") or "").strip()
        if not to:
            s = SiteSettings.get_solo()
            rec = parse_recipient_list(s.notification_recipients or "")
            if rec:
                to = rec[0]
            elif getattr(request.user, "email", None):
                to = (request.user.email or "").strip()
        ok, err = send_smtp_test(to)
        return Response({"ok": ok, "detail": err or ("Отправлено на " + to if ok else "")})


@extend_schema(tags=["staff"], summary="Проверка вебхука Битрикс24 (каталог)")
class StaffBitrix24WebhookTestView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def post(self, request, *args, **kwargs):
        test_results = run_bitrix24_saved_settings_test()
        return Response({"results": test_results})


class Bitrix24CatalogSyncStaffSerializer(serializers.Serializer):
    dryRun = serializers.BooleanField(default=True)
    force = serializers.BooleanField(default=False)
    skipVariants = serializers.BooleanField(default=False)
    skipProducts = serializers.BooleanField(default=False)
    noProducts = serializers.BooleanField(default=False)
    noOffers = serializers.BooleanField(default=False)
    timeoutSec = serializers.IntegerField(default=120, min_value=10, max_value=600)


@extend_schema(tags=["staff"], summary="Синхронизация каталога Битрикс24 (bitrix_catalog_id)")
class StaffBitrix24CatalogSyncView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def post(self, request, *args, **kwargs):
        ser = Bitrix24CatalogSyncStaffSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        r = run_bitrix24_catalog_sync_job(
            dry_run=d["dryRun"],
            force=d["force"],
            skip_model_variants=d["skipVariants"],
            skip_model_products=d["skipProducts"],
            no_products=d["noProducts"],
            no_offers=d["noOffers"],
            timeout=d["timeoutSec"],
        )
        applied = None
        if r.applied is not None:
            applied = {
                "variantsUpdated": r.applied.variants_updated,
                "productsUpdated": r.applied.products_updated,
                "variantsSkippedNoKey": r.applied.variants_skipped_no_key,
                "productsSkippedNoKey": r.applied.products_skipped_no_key,
                "variantsNoMatch": r.applied.variants_no_match,
                "productsNoMatch": r.applied.products_no_match,
            }
        summary = {
            "ok": r.ok,
            "error": r.error,
            "dryRun": r.dry_run,
            "indexSize": r.index_size,
            "duplicateWarnings": r.duplicate_warnings[:80],
            "applied": applied,
        }
        code = status.HTTP_200_OK if r.ok else status.HTTP_400_BAD_REQUEST
        return Response({"summary": summary}, status=code)
