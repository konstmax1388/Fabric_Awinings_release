"""
Методы Seller API для Ozon Доставка (логистика маркетплейса).

Документация: https://docs.ozon.ru/api/seller/ (раздел Ozon Логистика / доставка).
Порядок из гайда dev.ozon.ru: ``/v1/delivery/check`` → ``/v2/delivery/checkout`` → после оплаты ``/v2/order/create``.

Тела запросов передаются как ``dict`` в формате Ozon (часто camelCase) — собирайте их на уровне вызова
или в сервисах оформления заказа; здесь только тонкая обёртка над HTTP.
"""

from __future__ import annotations

from typing import Any

from .credentials import post_seller_json
from .order_guard import assert_order_create_phone_allowed


def delivery_check(body: dict[str, Any]) -> Any:
    """POST ``/v1/delivery/check`` — доступность доставки для покупателя (телефон и пр. по документации)."""
    return post_seller_json("/v1/delivery/check", body)


def delivery_checkout(body: dict[str, Any]) -> Any:
    """POST ``/v2/delivery/checkout`` — расчёт сплитов, сроков, доступности по товарам и способу доставки."""
    return post_seller_json("/v2/delivery/checkout", body)


def order_create(body: dict[str, Any]) -> Any:
    """POST ``/v2/order/create`` — создание заказа в Ozon после подтверждения оплаты у покупателя."""
    return post_seller_json("/v2/order/create", body)


def order_create_with_phone_guard(body: dict[str, Any], *, customer_phone: str | None) -> Any:
    """
    То же, что ``order_create``, но с проверкой телефона по настройкам «только внутренние номера».

    Используйте из нового потока checkout; старый поток в ``api`` может продолжать вызывать свой код без этого.
    """
    assert_order_create_phone_allowed(customer_phone)
    return order_create(body)


def delivery_map(body: dict[str, Any]) -> Any:
    """POST ``/v1/delivery/map`` — точки ПВЗ на карте (без проверки сроков)."""
    return post_seller_json("/v1/delivery/map", body)


def delivery_point_list(body: dict[str, Any]) -> Any:
    """POST ``/v1/delivery/point/list`` — список ПВЗ для своей карты/кэша."""
    return post_seller_json("/v1/delivery/point/list", body)


def delivery_point_info(body: dict[str, Any]) -> Any:
    """POST ``/v1/delivery/point/info`` — карточка точки."""
    return post_seller_json("/v1/delivery/point/info", body)
