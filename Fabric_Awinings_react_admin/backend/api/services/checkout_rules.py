"""Правила: какие способы оплаты доступны для выбранной доставки (настройки из SiteSettings)."""

from __future__ import annotations

from api.models import CartOrder, SiteSettings


def delivery_options_public(settings: SiteSettings) -> list[dict[str, str]]:
    """Список включённых способов доставки для витрины."""
    out: list[dict[str, str]] = []
    if settings.checkout_pickup_enabled:
        out.append(
            {
                "id": CartOrder.DeliveryMethod.PICKUP,
                "label": CartOrder.DeliveryMethod.PICKUP.label,
            }
        )
    if settings.cdek_enabled:
        out.append(
            {
                "id": CartOrder.DeliveryMethod.CDEK,
                "label": CartOrder.DeliveryMethod.CDEK.label,
            }
        )
    if settings.ozon_logistics_enabled:
        out.append(
            {
                "id": CartOrder.DeliveryMethod.OZON_LOGISTICS,
                "label": CartOrder.DeliveryMethod.OZON_LOGISTICS.label,
            }
        )
    return out


def allowed_payment_methods(
    delivery_method: str,
    settings: SiteSettings,
) -> list[str]:
    """Коды CartOrder.PaymentMethod, разрешённые для данной доставки."""
    if delivery_method == CartOrder.DeliveryMethod.PICKUP:
        allowed: list[str] = []
        if settings.checkout_pickup_enabled:
            allowed.append(CartOrder.PaymentMethod.CASH_PICKUP)
            if settings.ozon_pay_enabled:
                allowed.append(CartOrder.PaymentMethod.CARD_ONLINE)
        return allowed

    if delivery_method == CartOrder.DeliveryMethod.CDEK:
        allowed = []
        if settings.cdek_enabled:
            allowed.append(CartOrder.PaymentMethod.COD_CDEK)
            if settings.ozon_pay_enabled:
                allowed.append(CartOrder.PaymentMethod.CARD_ONLINE)
        return allowed

    if delivery_method == CartOrder.DeliveryMethod.OZON_LOGISTICS:
        if settings.ozon_logistics_enabled and settings.ozon_pay_enabled:
            return [CartOrder.PaymentMethod.CARD_ONLINE]
        return []

    return []


def validate_delivery_and_payment(
    delivery_method: str,
    payment_method: str,
    settings: SiteSettings,
) -> None:
    from rest_framework.exceptions import ValidationError

    opts = {x["id"] for x in delivery_options_public(settings)}
    if delivery_method not in opts:
        raise ValidationError(
            {"deliveryMethod": ["Выбранный способ доставки недоступен или выключен в настройках."]}
        )
    allowed = allowed_payment_methods(delivery_method, settings)
    if payment_method not in allowed:
        raise ValidationError(
            {"paymentMethod": ["Такая комбинация оплаты и доставки не разрешена."]}
        )
