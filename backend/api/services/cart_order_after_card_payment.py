"""
Действия после успешной оплаты картой (Ozon Pay, вебхук `Completed` или ручная отметка в админке).

Сценарии (всё автоматически по вебхуку, без ручных шагов):

1. **СДЭК + наложенный платёж (`cod_cdek`)** — CRM и СДЭК сразу при создании заказа
   (см. `CartOrderCreateView`, не `card_online`).

2. **СДЭК + Ozon Pay (`card_online`)** — накладная СДЭК и CRM **после** фиксации оплаты (здесь + `sync_cdek`).

3. **Логистика Ozon + Ozon Pay** — в CRM **после** оплаты (здесь). Заказ в эквайринге с
   `deliverySettings` и товарами создаётся в `try_begin_ozon_pay` при оформлении (нужен `payLink`).

При оформлении с `card_online` в CRM/СДЭК на POST /api/leads/cart/ не уходим (кроме п.1).
"""

from __future__ import annotations

import logging

from api.models import CartOrder

logger = logging.getLogger(__name__)


def _buyer_email_already_sent_with_cdek_tracking(order: CartOrder) -> bool:
    """Письмо с треком могло уйти из `cdek_order_create._dispatch_tracking_to_email_and_crm`."""
    snap = order.delivery_snapshot if isinstance(order.delivery_snapshot, dict) else {}
    meta = snap.get("cdekTrackingDispatched")
    return isinstance(meta, dict) and bool(meta.get("buyerEmail"))


def run_post_payment_integrations_for_card_order(
    order: CartOrder,
    *,
    send_buyer_confirmation: bool = True,
) -> None:
    """
    После `payment_status=CAPTURED` для оплаты картой: СДЭК (если доставка СДЭК) → CRM (Astrum) → письмо покупателю.

    CRM: либо первая выгрузка, либо follow-up, если сделка уже создавалась на оформлении (легаси-заказы).
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
    co.refresh_from_db()
    if _buyer_email_already_sent_with_cdek_tracking(co):
        return
    try:
        from api.services.notification_email import send_buyer_order_confirmation_email

        send_buyer_order_confirmation_email(co)
    except Exception:
        logger.exception("post_payment: send_buyer_order_confirmation failed for order=%s", co.order_ref)


__all__ = ("run_post_payment_integrations_for_card_order",)
