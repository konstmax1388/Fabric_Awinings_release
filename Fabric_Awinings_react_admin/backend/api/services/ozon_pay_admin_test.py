"""Проверка интеграции Ozon Pay из админки: один вызов createOrder без сохранения заказа."""

from __future__ import annotations

import os
from typing import Any

from django.utils import timezone

from api.models import CartOrder, SiteSettings
from api.services.ozon_acquiring import try_begin_ozon_pay


def run_ozon_pay_create_order_test() -> dict[str, Any]:
    """
    Пробный createOrder (MODE_SHORTENED / самовывоз): уникальный extId, сумма из OZON_PAY_TEST_AMOUNT_RUB (по умолчанию 10 ₽).
    """
    s = SiteSettings.get_solo()
    suffix = timezone.now().strftime("%Y%m%d%H%M%S")
    order_ref = f"FAB-OZONPAY-TEST-{suffix}"
    try:
        amount_rub = int(os.environ.get("OZON_PAY_TEST_AMOUNT_RUB", "10"))
    except ValueError:
        amount_rub = 10
    amount_rub = max(1, min(1_000_000, amount_rub))

    return try_begin_ozon_pay(
        order_ref=order_ref,
        total_approx=amount_rub,
        settings=s,
        delivery_method=CartOrder.DeliveryMethod.PICKUP,
        cart_lines=[],
        receipt_email="",
        fiscalization_phone="",
    )
