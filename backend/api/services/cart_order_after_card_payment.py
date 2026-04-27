"""
Действия после фиксации оплаты картой (Ozon Pay): накладная СДЭК, выгрузка в CRM (Astrum), письмо покупателю.

При оформлении с `payment_method=card_online` в CRM и СДЭК на этапе POST /api/leads/cart/ не уходим — только после статуса «оплачено» (вебхук или админка).
"""

from __future__ import annotations

import logging

from api.models import CartOrder

logger = logging.getLogger(__name__)


def run_post_payment_integrations_for_card_order(
    order: CartOrder,
    *,
    send_buyer_confirmation: bool = True,
) -> None:
    """
    СДЭК (только доставка СДЭК), затем Astrum: либо первая отправка (заказ ещё не в CRM), либо
    follow-up «оплата прошла», если сделка уже создавалась на оформлении (старые заказы).
    """
    if order.payment_method != CartOrder.PaymentMethod.CARD_ONLINE:
        return
    if order.payment_status != CartOrder.PaymentStatus.CAPTURED:
        return

    co = CartOrder.objects.get(pk=order.pk)

    if co.delivery_method == CartOrder.DeliveryMethod.CDEK:
        try:
            from api.services.cdek_order_create import sync_cdek_order_with_retry

            sync_cdek_order_with_retry(co)
        except Exception:
            logger.exception(
                "post_payment: sync_cdek_order_with_retry failed for order=%s", co.order_ref
            )
        co.refresh_from_db()

    try:
        from api.services.astrum_crm import (
            push_astrum_crm_after_ozon_payment_captured,
            push_cart_order_to_astrum_crm,
        )

        ent = (co.bitrix_entity_id or "").strip()
        if co.bitrix_sync_status == CartOrder.BitrixSyncStatus.SYNCED and ent:
            push_astrum_crm_after_ozon_payment_captured(co)
        else:
            push_cart_order_to_astrum_crm(co)
    except Exception:
        logger.exception("post_payment: CRM push failed for order=%s", co.order_ref)

    if not send_buyer_confirmation:
        return
    try:
        from api.services.notification_email import send_buyer_order_confirmation_email

        send_buyer_order_confirmation_email(co)
    except Exception:
        logger.exception("post_payment: send_buyer_order_confirmation failed for order=%s", co.order_ref)


__all__ = ("run_post_payment_integrations_for_card_order",)
