"""Письма менеджерам и покупателям (SMTP из SiteSettings, шаблоны из SiteEmailTemplate)."""

from __future__ import annotations

import logging
import os
from email.utils import formataddr, parseaddr

from django.core.mail import EmailMessage
from django.core.mail.backends.smtp import EmailBackend

from .email_templates import effective_subject_body, fill_placeholders

logger = logging.getLogger(__name__)


def parse_recipient_list(raw: str) -> list[str]:
    if not (raw or "").strip():
        return []
    out: list[str] = []
    for line in raw.replace(";", "\n").split("\n"):
        for part in line.split(","):
            p = part.strip()
            if p and "@" in p:
                out.append(p)
    seen: set[str] = set()
    uniq: list[str] = []
    for e in out:
        el = e.lower()
        if el not in seen:
            seen.add(el)
            uniq.append(e)
    return uniq


def get_site_smtp_connection():
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    if not s.smtp_enabled or not (s.smtp_host or "").strip():
        return None
    password = os.environ.get("DJANGO_SMTP_PASSWORD") or s.smtp_password or ""
    use_ssl = bool(s.smtp_use_ssl)
    use_tls = bool(s.smtp_use_tls) and not use_ssl
    return EmailBackend(
        host=s.smtp_host.strip(),
        port=int(s.smtp_port),
        username=(s.smtp_user or "").strip() or None,
        password=password or None,
        use_tls=use_tls,
        use_ssl=use_ssl,
        timeout=25,
    )


def outbound_from_address(site: "SiteSettings") -> str:
    """Адрес From для SMTP: всегда с реальным email (иначе сервер/клиент падают)."""
    raw = (site.email_outbound_from or "").strip()
    fallback = (site.email or "").strip()
    if not fallback or "@" not in fallback:
        fallback = ""

    if not raw:
        return fallback

    name, addr = parseaddr(raw)
    if addr and "@" in addr:
        if name:
            return formataddr((name, addr))
        return addr

    if "@" in raw:
        return raw

    if not fallback:
        return ""

    return formataddr((raw, fallback))


def send_notification_email(subject: str, body: str) -> tuple[bool, str | None]:
    from api.models import SiteSettings

    site = SiteSettings.get_solo()
    recipients = parse_recipient_list(site.notification_recipients or "")
    if not recipients:
        logger.info("Письмо о заявке пропущено: не указаны получатели.")
        return False, "no_recipients"
    conn = get_site_smtp_connection()
    if conn is None:
        logger.info("Письмо о заявке пропущено: SMTP выключен или не задан хост.")
        return False, "smtp_disabled"
    from_addr = outbound_from_address(site)
    if not from_addr:
        logger.warning("Письмо о заявке пропущено: не задан отправитель (From).")
        return False, "no_from"
    try:
        msg = EmailMessage(
            subject=subject,
            body=body,
            from_email=from_addr,
            to=recipients,
            connection=conn,
        )
        msg.encoding = "utf-8"
        msg.send(fail_silently=False)
    except Exception as e:
        logger.exception("Ошибка отправки письма о заявке")
        return False, str(e)
    return True, None


def _site_name() -> str:
    from api.models import SiteSettings

    return (SiteSettings.get_solo().site_name or "Фабрика Тентов").strip()


def notify_calculator_lead(lead: "CalculatorLead") -> None:
    opts_lines: list[str] = []
    raw_opts = lead.options
    if isinstance(raw_opts, list):
        for o in raw_opts:
            opts_lines.append(f"  - {o}")
    options_block = "\n".join(opts_lines) if opts_lines else "  (нет)"
    est = f"{lead.estimated_price_rub:,}".replace(",", " ")
    created_at = f"{lead.created_at:%Y-%m-%d %H:%M:%S} UTC"
    ctx = dict(
        site_name=_site_name(),
        name=lead.name,
        phone=lead.phone,
        comment=lead.comment or "—",
        length_m=str(lead.length_m),
        width_m=str(lead.width_m),
        material_label=lead.material_label or lead.material_id,
        material_id=lead.material_id,
        estimated_price_rub=est,
        options_block=options_block,
        created_at=created_at,
    )
    subj_t, body_t = effective_subject_body("manager_calculator")
    subject = fill_placeholders(subj_t, **ctx)
    body = fill_placeholders(body_t, **ctx)
    ok, err = send_notification_email(subject, body)
    if not ok and err not in ("no_recipients", "smtp_disabled", "no_from"):
        logger.warning("notify_calculator_lead: не отправлено: %s", err)


def notify_callback_lead(lead: "CallbackLead") -> None:
    created_at = f"{lead.created_at:%Y-%m-%d %H:%M:%S} UTC"
    ctx = dict(
        site_name=_site_name(),
        name=lead.name,
        phone=lead.phone,
        comment=lead.comment or "—",
        source=lead.get_source_display(),
        created_at=created_at,
    )
    subj_t, body_t = effective_subject_body("manager_callback")
    subject = fill_placeholders(subj_t, **ctx)
    body = fill_placeholders(body_t, **ctx)
    ok, err = send_notification_email(subject, body)
    if not ok and err not in ("no_recipients", "smtp_disabled", "no_from"):
        logger.warning("notify_callback_lead: не отправлено: %s", err)


def notify_cart_order(order: "CartOrder") -> None:
    ctx = dict(
        site_name=_site_name(),
        order_ref=order.order_ref,
        customer_name=order.customer_name,
        manager_letter=order.manager_letter or "",
    )
    subj_t, body_t = effective_subject_body("manager_cart")
    subject = fill_placeholders(subj_t, **ctx)
    body = fill_placeholders(body_t, **ctx)
    ok, err = send_notification_email(subject, body)
    if not ok and err not in ("no_recipients", "smtp_disabled", "no_from"):
        logger.warning("notify_cart_order: не отправлено: %s", err)


def send_buyer_order_confirmation_email(order: "CartOrder") -> None:
    """Письмо покупателю на customer_email при каждом заказе из корзины (текст как client_ack на сайте)."""
    from api.models import SiteSettings

    to_email = (order.customer_email or "").strip()
    if not to_email or "@" not in to_email:
        return
    site = SiteSettings.get_solo()
    conn = get_site_smtp_connection()
    if conn is None:
        logger.info(
            "Подтверждение заказа покупателю пропущено (SMTP выключен или нет хоста): %s",
            order.order_ref,
        )
        return
    from_addr = outbound_from_address(site)
    if not from_addr:
        logger.warning(
            "Подтверждение заказа покупателю пропущено (нет From): order=%s",
            order.order_ref,
        )
        return
    subj_t, body_t = effective_subject_body("buyer_order_confirmation")
    ctx = dict(
        site_name=_site_name(),
        order_ref=order.order_ref,
        customer_name=order.customer_name,
        client_ack=(order.client_ack or "").strip() or f"Ваш заказ {order.order_ref} принят.",
    )
    subject = fill_placeholders(subj_t, **ctx)
    body = fill_placeholders(body_t, **ctx)
    try:
        msg = EmailMessage(
            subject=subject,
            body=body,
            from_email=from_addr,
            to=[to_email],
            connection=conn,
        )
        msg.encoding = "utf-8"
        msg.send(fail_silently=False)
    except Exception:
        logger.exception(
            "Ошибка отправки подтверждения заказа покупателю order=%s to=%s",
            order.order_ref,
            to_email,
        )


def send_order_account_credentials_email(
    to_email: str,
    login: str,
    password_plain: str,
    order_ref: str,
    deadline_label: str,
) -> tuple[bool, str | None]:
    from api.models import SiteSettings

    to_email = (to_email or "").strip()
    if not to_email or "@" not in to_email:
        return False, "bad_recipient"
    site = SiteSettings.get_solo()
    conn = get_site_smtp_connection()
    if conn is None:
        logger.info("Письмо с паролем покупателю пропущено: SMTP выключен или не задан хост.")
        return False, "smtp_disabled"
    from_addr = outbound_from_address(site)
    if not from_addr:
        logger.warning("Письмо с паролем покупателю пропущено: нет адреса From.")
        return False, "no_from"
    site_name = _site_name()
    subj_t, body_t = effective_subject_body("buyer_credentials")
    ctx = dict(
        site_name=site_name,
        order_ref=order_ref,
        login=login,
        password_plain=password_plain,
        deadline_label=deadline_label,
    )
    subject = fill_placeholders(subj_t, **ctx)
    body = fill_placeholders(body_t, **ctx)
    try:
        msg = EmailMessage(
            subject=subject,
            body=body,
            from_email=from_addr,
            to=[to_email],
            connection=conn,
        )
        msg.encoding = "utf-8"
        msg.send(fail_silently=False)
    except Exception as e:
        logger.exception("Ошибка отправки письма с паролем покупателю")
        return False, str(e)
    return True, None


def send_smtp_test(to_email: str) -> tuple[bool, str]:
    from api.models import SiteSettings

    site = SiteSettings.get_solo()
    to_email = (to_email or "").strip()
    if not to_email or "@" not in to_email:
        return False, "Укажите корректный email получателя."
    conn = get_site_smtp_connection()
    if conn is None:
        return False, "Включите SMTP и укажите сервер (хост), затем сохраните настройки."
    from_addr = outbound_from_address(site)
    if not from_addr:
        return False, "Укажите поле «Отправитель писем (From)» или email в контактах на витрине."
    site_name = _site_name()
    subj_t, body_t = effective_subject_body("smtp_test")
    subject = fill_placeholders(subj_t, site_name=site_name)
    body = fill_placeholders(body_t, site_name=site_name)
    try:
        msg = EmailMessage(
            subject=subject,
            body=body,
            from_email=from_addr,
            to=[to_email],
            connection=conn,
        )
        msg.encoding = "utf-8"
        msg.send(fail_silently=False)
    except Exception as e:
        logger.exception("SMTP test failed")
        return False, str(e)
    return True, ""
