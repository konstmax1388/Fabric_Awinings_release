"""Общая валидация контактов и антиспам (honeypot)."""

from __future__ import annotations

from rest_framework import serializers

# Поле-приманка: легитимный клиент всегда шлёт пустую строку; боты часто заполняют.
HONEYPOT_FIELD = "website"

COMMENT_MAX_LEN = 4000


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
