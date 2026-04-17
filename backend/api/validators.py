"""Общая валидация контактов и антиспам (honeypot)."""

from __future__ import annotations

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from rest_framework import serializers

# Поле-приманка: легитимный клиент всегда шлёт пустую строку; боты часто заполняют.
HONEYPOT_FIELD = "website"

COMMENT_MAX_LEN = 4000

# Домены-заглушки (RFC / тесты) — не принимаются при оформлении заказа и не должны уходить в CRM как «реальный» email.
ORDER_EMAIL_BLOCKED_DOMAINS = frozenset(
    {
        "example.com",
        "example.org",
        "example.net",
        "example",
        "invalid",
        "localhost",
        "test",
    }
)


def clean_customer_order_email(raw: str) -> str:
    """Email покупателя при заказе из корзины: обязателен, формат, без example.com и т.п."""
    addr = (raw or "").strip()
    if not addr:
        raise serializers.ValidationError("Укажите email")
    if len(addr) > 254:
        raise serializers.ValidationError("Email слишком длинный")
    try:
        validate_email(addr)
    except DjangoValidationError:
        raise serializers.ValidationError("Некорректный email")
    if "@" not in addr:
        raise serializers.ValidationError("Некорректный email")
    _, _, domain = addr.rpartition("@")
    d = domain.lower().strip()
    if not d:
        raise serializers.ValidationError("Некорректный email")
    if d in ORDER_EMAIL_BLOCKED_DOMAINS:
        raise serializers.ValidationError(
            "Укажите настоящий email (адреса вида @example.com для заказа не подходят)."
        )
    if d.endswith(".example") or d.endswith(".localhost"):
        raise serializers.ValidationError(
            "Укажите настоящий email (служебные домены для заказа не подходят)."
        )
    return addr


def reject_honeypot(attrs: dict) -> None:
    raw = attrs.pop(HONEYPOT_FIELD, None)
    if raw is not None and str(raw).strip():
        raise serializers.ValidationError({HONEYPOT_FIELD: ["Invalid"]})


def clean_person_name(name: str) -> str:
    t = (name or "").strip()
    if len(t) < 2 or len(t) > 120:
        raise serializers.ValidationError("Укажите имя")
    for ch in t:
        if ch in " .'\"" or ch in "-–—":
            continue
        if ch.isalpha():
            continue
        raise serializers.ValidationError("Имя содержит недопустимые символы")
    return t


def normalize_ru_phone(raw: str) -> str:
    """10 национальных цифр → +7XXXXXXXXXX."""
    s = (raw or "").strip()
    digits = "".join(c for c in s if c.isdigit())
    if not digits:
        raise serializers.ValidationError("Укажите телефон")
    if digits.startswith("8") and len(digits) >= 11:
        digits = "7" + digits[1:]
    if digits.startswith("7"):
        digits = digits[1:]
    if len(digits) != 10:
        raise serializers.ValidationError("Укажите корректный номер телефона России")
    return "+7" + digits


def normalize_ru_phone_optional(raw: str) -> str:
    if not (raw or "").strip():
        return ""
    return normalize_ru_phone(raw)
