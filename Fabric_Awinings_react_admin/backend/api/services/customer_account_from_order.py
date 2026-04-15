"""Автоаккаунт покупателя при гостевом заказе с email: привязка заказа, первый раз — пароль в письме."""

from __future__ import annotations

import logging
import secrets
from datetime import timedelta

from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone

from api.models import CartOrder, CustomerProfile

from .notification_email import send_order_account_credentials_email

logger = logging.getLogger(__name__)


def _split_customer_name(full: str) -> tuple[str, str]:
    name = (full or "").strip()
    if not name:
        return "", ""
    parts = name.split(None, 1)
    first = parts[0][:150]
    last = (parts[1] if len(parts) > 1 else "")[:150]
    return first, last


@transaction.atomic
def link_cart_order_to_customer_account(order: CartOrder) -> None:
    """
    Если заказ без user и указан email:
    — существующий пользователь с таким логином/email: привязать заказ;
    — иначе создать пользователя, профиль с password_change_deadline (+3 дня), отправить письмо с паролем.
    """
    if order.user_id:
        return
    email = (order.customer_email or "").strip().lower()
    if not email or "@" not in email:
        return

    user = User.objects.filter(username__iexact=email).first()
    if user is None:
        user = User.objects.filter(email__iexact=email).first()

    if user is not None:
        order.user = user
        order.save(update_fields=["user"])
        prof, _ = CustomerProfile.objects.get_or_create(user=user)
        if not (prof.phone or "").strip() and order.customer_phone:
            prof.phone = order.customer_phone.strip()
            prof.save(update_fields=["phone"])
        return

    plain = secrets.token_urlsafe(18)
    first_name, last_name = _split_customer_name(order.customer_name)
    user = User.objects.create_user(
        username=email,
        email=email,
        password=plain,
        first_name=first_name,
        last_name=last_name,
        is_staff=False,
    )
    deadline = timezone.now() + timedelta(days=3)
    CustomerProfile.objects.create(
        user=user,
        phone=(order.customer_phone or "").strip(),
        password_change_deadline=deadline,
    )
    order.user = user
    order.save(update_fields=["user"])

    deadline_label = timezone.localtime(deadline).strftime("%d.%m.%Y %H:%M")
    ok, err = send_order_account_credentials_email(
        to_email=email,
        login=email,
        password_plain=plain,
        order_ref=order.order_ref,
        deadline_label=deadline_label,
    )
    if not ok:
        logger.warning(
            "link_cart_order_to_customer_account: письмо с паролем не отправлено order=%s err=%s",
            order.order_ref,
            err,
        )
