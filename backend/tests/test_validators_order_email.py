"""Валидация email при заказе из корзины (api.validators.clean_customer_order_email)."""

import pytest
from rest_framework import serializers

from api.validators import clean_customer_order_email


def test_clean_order_email_ok():
    assert clean_customer_order_email("  a@mail.ru  ") == "a@mail.ru"


def test_clean_order_email_empty():
    with pytest.raises(serializers.ValidationError):
        clean_customer_order_email("")


def test_clean_order_email_example_com():
    with pytest.raises(serializers.ValidationError) as ei:
        clean_customer_order_email("test@example.com")
    assert "example" in str(ei.value).lower()


def test_clean_order_email_dot_example_tld():
    with pytest.raises(serializers.ValidationError):
        clean_customer_order_email("x@host.example")
