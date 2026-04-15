"""Вебхуки и служебные endpoint’ы оформления (эквайринг, доставка)."""

from __future__ import annotations

import json
import logging
import os

from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from api.models import CartOrder, SiteSettings
from api.services.ozon_acquiring_sign import verify_notification_request_sign

logger = logging.getLogger(__name__)


def _ozon_shop_access_key() -> str:
    s = SiteSettings.get_solo()
    return (os.environ.get("OZON_PAY_ACCESS_KEY") or s.ozon_pay_client_id or "").strip()


def _ozon_notification_secret() -> str:
    s = SiteSettings.get_solo()
    return (os.environ.get("OZON_PAY_WEBHOOK_SECRET") or s.ozon_pay_webhook_secret or "").strip()


@method_decorator(csrf_exempt, name="dispatch")
class OzonPayWebhookView(View):
    """
    POST-уведомления Ozon Acquiring о транзакциях.
    Подпись requestSign: docs/ozon-pay-env.md и docs.ozon.ru/api/acquiring/
    """

    def post(self, request):
        try:
            raw = request.body.decode("utf-8") if request.body else ""
            payload = json.loads(raw) if raw.strip() else {}
        except (UnicodeDecodeError, json.JSONDecodeError):
            return JsonResponse({"ok": False, "error": "invalid_json"}, status=400)

        if not isinstance(payload, dict):
            return JsonResponse({"ok": False, "error": "invalid_payload"}, status=400)

        notif_sec = _ozon_notification_secret()
        access_key = _ozon_shop_access_key()
        if not notif_sec:
            logger.warning("Ozon webhook: notification secret not configured")
            return JsonResponse({"ok": False, "error": "webhook_not_configured"}, status=503)

        if not verify_notification_request_sign(
            payload,
            shop_access_key=access_key,
            notification_secret_key=notif_sec,
        ):
            logger.warning("Ozon webhook: signature mismatch")
            return JsonResponse({"ok": False, "error": "bad_signature"}, status=403)

        ext_order = str(payload.get("extOrderID") or "").strip()
        status = str(payload.get("status") or "")
        order_id_ozon = str(payload.get("orderID") or "").strip()

        if ext_order:
            co = CartOrder.objects.filter(order_ref=ext_order).first()
            if co:
                ap = co.acquiring_payload if isinstance(co.acquiring_payload, dict) else {}
                ap["ozonWebhookLast"] = {
                    "status": status,
                    "operationType": payload.get("operationType"),
                    "paymentMethod": payload.get("paymentMethod"),
                }
                co.acquiring_payload = ap
                if order_id_ozon:
                    co.payment_external_id = order_id_ozon[:128]

                if status == "Completed":
                    co.payment_status = CartOrder.PaymentStatus.CAPTURED
                    co.fulfillment_status = CartOrder.FulfillmentStatus.PAID
                elif status == "Authorized":
                    co.payment_status = CartOrder.PaymentStatus.AUTHORIZED
                elif status == "Rejected":
                    co.payment_status = CartOrder.PaymentStatus.FAILED

                co.save(
                    update_fields=[
                        "acquiring_payload",
                        "payment_external_id",
                        "payment_status",
                        "fulfillment_status",
                    ]
                )

        logger.info(
            "Ozon webhook ok: extOrderID=%s status=%s",
            ext_order or "-",
            status or "-",
        )
        return JsonResponse({"ok": True})
