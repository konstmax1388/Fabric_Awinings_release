"""
Мост между заказом на сайте и Seller API Ozon Доставка (приложение ``ozon_logistics``).

Старый поток **не меняется**, пока в админке Ozon Доставка выключено
``seller_delivery_api_enabled`` (и нет env ``OZON_LOGISTICS_SELLER_DELIVERY_API_ENABLED``).

Когда включено и заказ: доставка «Логистика Ozon» + оплата картой + статус оплаты ``CAPTURED``:

1. Вызывается ``POST /v1/delivery/check`` с телефоном покупателя — результат пишется в
   ``acquiring_payload["ozonLogisticsSellerApi"]["deliveryCheck"]``.

2. Если из ``delivery_snapshot["ozonLogistics"]["sellerCheckout"]`` удаётся собрать тело
   ``POST /v2/order/create`` (см. ``ozon_logistics.services.order_create_payload.resolve_order_create_body`` —
   в т.ч. пара ``checkoutRequest``/``checkoutResult`` после серверного ``/v2/delivery/checkout``),
   после проверки телефона вызывается ``order_create_with_phone_guard``;
   ответ — в ``acquiring_payload["ozonLogisticsSellerApi"]["orderCreate"]``.

Пока фронт не передаёт ``sellerCheckout`` и сервер не вызвал ``delivery/checkout``,
шаг 2 пропускается — оплата и эквайринг как раньше.
"""

from __future__ import annotations

import logging
from typing import Any

from django.utils import timezone

from api.models import CartOrder

logger = logging.getLogger(__name__)


def _delivery_check_body(phone: str) -> dict[str, Any]:
    from ozon_logistics.services.order_guard import normalize_phone_digits

    digits = normalize_phone_digits(phone) or ""
    return {"client_phone": digits}


def try_seller_logistics_after_ozon_payment(order: CartOrder) -> None:
    """
    Вызывать из ``run_post_payment_integrations_for_card_order`` для заказов с доставкой Ozon.

    Ошибки API не падают наружу (лог + сохранение частичного состояния), чтобы вебхук Ozon Pay
    оставался успешным.
    """
    if order.delivery_method != CartOrder.DeliveryMethod.OZON_LOGISTICS:
        return
    if order.payment_method != CartOrder.PaymentMethod.CARD_ONLINE:
        return
    if order.payment_status != CartOrder.PaymentStatus.CAPTURED:
        return

    try:
        from ozon_logistics.services.order_guard import seller_delivery_api_enabled
    except Exception:
        return

    if not seller_delivery_api_enabled():
        return

    phone = (order.customer_phone or "").strip()
    if not phone:
        logger.warning(
            "ozon_logistics_bridge: order %s has no customer_phone, skip Seller API",
            order.order_ref,
        )
        return

    from ozon_logistics.services.exceptions import (
        OzonLogisticsConfigError,
        OzonLogisticsPhoneNotAllowedError,
    )
    from ozon_logistics.services.order_guard import assert_order_create_phone_allowed

    try:
        assert_order_create_phone_allowed(phone)
    except OzonLogisticsPhoneNotAllowedError as e:
        logger.warning(
            "ozon_logistics_bridge: phone not allowed for Seller order create, order=%s: %s",
            order.order_ref,
            e,
        )
        return

    ap: dict[str, Any] = dict(order.acquiring_payload) if isinstance(order.acquiring_payload, dict) else {}
    ol_api: dict[str, Any] = dict(ap.get("ozonLogisticsSellerApi") or {})

    try:
        from ozon_logistics.services import delivery_check

        chk_body = _delivery_check_body(phone)
        chk_result = delivery_check(chk_body)
        ol_api["deliveryCheck"] = {
            "at": timezone.now().isoformat(),
            "request": chk_body,
            "result": chk_result,
        }
    except OzonLogisticsConfigError:
        logger.warning("ozon_logistics_bridge: no Seller credentials, order=%s", order.order_ref)
        ol_api["deliveryCheck"] = {
            "at": timezone.now().isoformat(),
            "error": "OzonLogisticsConfigError: нет Client-Id / Api-Key для Ozon Доставка",
        }
    except Exception as e:
        logger.exception(
            "ozon_logistics_bridge: delivery/check failed order=%s",
            order.order_ref,
        )
        ol_api["deliveryCheck"] = {
            "at": timezone.now().isoformat(),
            "error": str(e)[:2000],
        }

    snap = order.delivery_snapshot if isinstance(order.delivery_snapshot, dict) else {}
    oz = snap.get("ozonLogistics") if isinstance(snap.get("ozonLogistics"), dict) else {}
    seller_checkout = oz.get("sellerCheckout")
    from ozon_logistics.services.order_create_payload import resolve_order_create_body

    create_body = (
        resolve_order_create_body(seller_checkout, customer_phone=phone)
        if isinstance(seller_checkout, dict)
        else None
    )
    if isinstance(create_body, dict) and create_body:
        try:
            from ozon_logistics.services.delivery_api import order_create_with_phone_guard

            oc_result = order_create_with_phone_guard(create_body, customer_phone=phone)
            ol_api["orderCreate"] = {
                "at": timezone.now().isoformat(),
                "ok": True,
                "result": oc_result,
            }
        except Exception as e:
            logger.exception(
                "ozon_logistics_bridge: order/create failed order=%s",
                order.order_ref,
            )
            ol_api["orderCreate"] = {
                "at": timezone.now().isoformat(),
                "ok": False,
                "error": str(e)[:4000],
            }

    ap["ozonLogisticsSellerApi"] = ol_api
    CartOrder.objects.filter(pk=order.pk).update(acquiring_payload=ap)


__all__ = ("try_seller_logistics_after_ozon_payment",)
