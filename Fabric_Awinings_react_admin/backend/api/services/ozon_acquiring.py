"""
Ozon Pay Checkout — Ozon Acquiring API: POST /v1/createOrder + подпись requestSign.

При доставке «Логистика Ozon» добавляются deliverySettings.isEnabled и MODE_FULL + items.

Документация: https://docs.ozon.ru/api/acquiring/
"""

from __future__ import annotations

import logging
import os
from datetime import timedelta
from typing import Any

from django.conf import settings as django_settings
from django.utils import timezone

from api.models import CartOrder, SiteSettings
from api.services.http_util import HttpJsonError, post_json
from api.services.ozon_acquiring_cart import (
    build_create_order_items,
    synthetic_single_item_order,
    total_kopecks_from_cart_lines,
)
from api.services.ozon_acquiring_sign import request_sign_create_order

logger = logging.getLogger(__name__)


def _effective_access_key(s: SiteSettings) -> str:
    return (os.environ.get("OZON_PAY_ACCESS_KEY") or s.ozon_pay_client_id or "").strip()


def _effective_secret_key(s: SiteSettings) -> str:
    return (os.environ.get("OZON_PAY_SECRET_KEY") or os.environ.get("OZON_PAY_CLIENT_SECRET") or s.ozon_pay_client_secret or "").strip()


def _env(name: str, default: str = "") -> str:
    return (os.environ.get(name) or default).strip()


def _checkout_return_urls(order_ref: str) -> tuple[str, str]:
    base = (getattr(django_settings, "PUBLIC_SITE_URL", "") or "http://localhost:17300").rstrip("/")
    from urllib.parse import quote

    enc = quote(order_ref, safe="")
    return (
        f"{base}/checkout?pay=ok&orderRef={enc}",
        f"{base}/checkout?pay=cancel&orderRef={enc}",
    )


def _notification_url() -> str:
    u = _env("OZON_PAY_NOTIFICATION_URL")
    if u:
        return u.rstrip("/")
    base = (getattr(django_settings, "PUBLIC_SITE_URL", "") or "").rstrip("/")
    if not base:
        return ""
    return f"{base}/api/webhooks/ozon-pay/"


def _extract_pay_link(resp: dict[str, Any]) -> str | None:
    order = resp.get("order")
    if isinstance(order, dict):
        link = order.get("payLink")
        if isinstance(link, str) and link.startswith("http"):
            return link
    for key in ("payLink", "paymentUrl", "redirectUrl"):
        v = resp.get(key)
        if isinstance(v, str) and v.startswith("http"):
            return v
    return None


def try_begin_ozon_pay(
    *,
    order_ref: str,
    total_approx: int,
    settings: SiteSettings | None = None,
    delivery_method: str = CartOrder.DeliveryMethod.PICKUP,
    cart_lines: list[dict[str, Any]] | None = None,
    receipt_email: str = "",
    fiscalization_phone: str = "",
) -> dict[str, Any]:
    """
    Создание заказа в Ozon Acquiring (Ozon Pay Checkout) и ссылка на оплату (order.payLink).

    Для delivery_method=ozon_logistics — MODE_FULL, items из корзины, deliverySettings.isEnabled=true.
    """
    s = settings or SiteSettings.get_solo()
    lines = list(cart_lines or [])
    use_ozon_logistics = delivery_method == CartOrder.DeliveryMethod.OZON_LOGISTICS

    base_out: dict[str, Any] = {
        "provider": "ozon_pay",
        "sandbox": s.ozon_pay_sandbox,
        "orderRef": order_ref,
        "integration": "ozon_pay_checkout",
        "ozonLogisticsInOrder": use_ozon_logistics,
    }

    if not s.ozon_pay_enabled:
        return {
            **base_out,
            "configured": False,
            "redirectUrl": None,
            "message": "Онлайн-оплата выключена в настройках сайта.",
        }

    access_key = _effective_access_key(s)
    secret_key = _effective_secret_key(s)
    if not access_key or not secret_key:
        return {
            **base_out,
            "configured": False,
            "redirectUrl": None,
            "message": "Укажите идентификатор токена (accessKey) и секретный ключ (secretKey) в админке или OZON_PAY_ACCESS_KEY / OZON_PAY_SECRET_KEY.",
        }

    api_base = _env("OZON_PAY_API_BASE_URL").rstrip("/")
    if not api_base:
        return {
            **base_out,
            "configured": True,
            "liveHttp": False,
            "redirectUrl": None,
            "missingEnv": ["OZON_PAY_API_BASE_URL"],
            "message": "Задайте OZON_PAY_API_BASE_URL — базовый URL API эквайринга из личного кабинета / документации (без завершающего слэша).",
        }

    currency_code = _env("OZON_PAY_CURRENCY_CODE", "643")
    payment_algorithm = _env("OZON_PAY_PAYMENT_ALGORITHM", "PAY_ALGO_SMS")
    fiscal_type = _env("OZON_PAY_FISCALIZATION_TYPE", "FISCAL_TYPE_SINGLE")

    hours_raw = _env("OZON_PAY_ORDER_EXPIRES_HOURS", "24")
    try:
        hours = max(1, int(hours_raw))
    except ValueError:
        hours = 24
    expires_at = (timezone.now() + timedelta(hours=hours)).strftime("%Y-%m-%dT%H:%M:%S.000Z")

    if use_ozon_logistics:
        mode = "MODE_FULL"
        if lines:
            items = build_create_order_items(order_ref=order_ref, lines=lines)
            amount_kopecks = total_kopecks_from_cart_lines(lines)
        else:
            amount_kopecks = max(0, int(total_approx)) * 100
            items = synthetic_single_item_order(order_ref=order_ref, amount_kopecks=amount_kopecks)

        total_client_kop = max(0, int(total_approx)) * 100
        if lines and abs(amount_kopecks - total_client_kop) > 100:
            logger.warning(
                "Ozon createOrder: сумма по строкам (%s коп.) расходится с totalApprox (%s коп.), в API уходит сумма строк",
                amount_kopecks,
                total_client_kop,
            )
    else:
        mode = _env("OZON_PAY_ORDER_MODE", "MODE_SHORTENED")
        amount_kopecks = max(0, int(total_approx)) * 100
        items = None

    amount_value_str = str(amount_kopecks)

    request_sign = request_sign_create_order(
        access_key=access_key,
        secret_key=secret_key,
        expires_at=expires_at,
        ext_id=order_ref,
        fiscalization_type=fiscal_type,
        payment_algorithm=payment_algorithm,
        amount_currency_code=currency_code,
        amount_value=amount_value_str,
    )

    success_url, fail_url = _checkout_return_urls(order_ref)
    notif_url = _notification_url()

    body: dict[str, Any] = {
        "accessKey": access_key,
        "amount": {"currencyCode": currency_code, "value": amount_value_str},
        "paymentAlgorithm": payment_algorithm,
        "fiscalizationType": fiscal_type,
        "mode": mode,
        "extId": order_ref,
        "expiresAt": expires_at,
        "successUrl": success_url,
        "failUrl": fail_url,
        "requestSign": request_sign,
    }
    if notif_url:
        body["notificationUrl"] = notif_url

    if use_ozon_logistics:
        body["deliverySettings"] = {"isEnabled": True}
        body["items"] = items

    email = (receipt_email or "").strip()
    if email:
        body["receiptEmail"] = email
    phone = (fiscalization_phone or "").strip()
    if phone and use_ozon_logistics:
        body["fiscalizationPhone"] = phone

    enable_fiscal = _env("OZON_PAY_ENABLE_FISCALIZATION", "").lower()
    if enable_fiscal in ("true", "1", "yes"):
        body["enableFiscalization"] = True
    elif enable_fiscal in ("false", "0", "no"):
        body["enableFiscalization"] = False

    url = f"{api_base}/v1/createOrder"

    try:
        raw = post_json(url, body)
        if not isinstance(raw, dict):
            raw = {"_raw": raw}
        pay_link = _extract_pay_link(raw)
        ozon_order_id = None
        od = raw.get("order")
        if isinstance(od, dict):
            ozon_order_id = od.get("id")

        out = {
            **base_out,
            "configured": True,
            "liveHttp": True,
            "redirectUrl": pay_link,
            "ozonOrderId": ozon_order_id,
            "ozonResponse": raw,
        }
        if not pay_link:
            out["message"] = (
                "Заказ создан в ответе API, но не найден order.payLink. Проверьте ozonResponse и контур (тест/бой)."
            )
        return out
    except HttpJsonError as e:
        logger.warning("Ozon Acquiring HTTP: %s", e)
        return {
            **base_out,
            "configured": True,
            "liveHttp": True,
            "redirectUrl": None,
            "httpError": str(e),
            "message": f"Ошибка HTTP при createOrder: {e}",
        }
    except (ValueError, TypeError, OSError) as e:
        logger.warning("Ozon Acquiring: %s", e)
        return {
            **base_out,
            "configured": True,
            "liveHttp": False,
            "redirectUrl": None,
            "message": str(e),
        }


def try_begin_ozon_pay_for_order(order: CartOrder) -> dict[str, Any]:
    lines = order.lines if isinstance(order.lines, list) else []
    return try_begin_ozon_pay(
        order_ref=order.order_ref,
        total_approx=order.total_approx,
        delivery_method=order.delivery_method,
        cart_lines=[dict(x) for x in lines],
        receipt_email=order.customer_email or "",
        fiscalization_phone=order.customer_phone or "",
    )
