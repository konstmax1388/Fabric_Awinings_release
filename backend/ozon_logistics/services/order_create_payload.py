"""
Сборка тела ``POST /v2/order/create`` из снимка ``sellerCheckout`` (Ozon Доставка).

Поддерживается:
- явное поле ``orderCreateBody`` — уходит в Ozon как есть (после нормализации телефона);
- пара ``checkoutRequest`` + ``checkoutResult`` — слияние ответа checkout с запросом
  (поля запроса перекрывают одноимённые из ответа; ``client_phone`` берётся из заказа, если задан);
- иначе весь ``sellerCheckout`` трактуется как тело заказа (обратная совместимость с ручной передачей).
"""

from __future__ import annotations

from typing import Any

from .order_guard import normalize_phone_digits


def build_from_checkout_pair(
    checkout_request: Any,
    checkout_result: Any,
    *,
    customer_phone: str | None,
) -> dict[str, Any] | None:
    """
    Объединяет запрос и ответ ``/v2/delivery/checkout`` (или ``/v1/...``) в один dict для ``/v2/order/create``.

    Если в ответе явная ошибка без ``result`` — возвращает ``None`` (заказ в Ozon не создаём).
    """
    req = dict(checkout_request) if isinstance(checkout_request, dict) else {}
    if not isinstance(checkout_result, dict):
        merged = {**req}
    else:
        if checkout_result.get("result") is None and (
            checkout_result.get("error") or checkout_result.get("message") or checkout_result.get("code")
        ):
            return None
        inner = checkout_result.get("result")
        if not isinstance(inner, dict):
            inner = {}
        merged = {**inner, **req}
    nd = normalize_phone_digits(customer_phone or "") if customer_phone else None
    if nd:
        merged["client_phone"] = nd
    if not merged:
        return None
    products = merged.get("products")
    if not (isinstance(products, list) and len(products) > 0):
        return None
    return merged


def resolve_order_create_body(seller_checkout: dict[str, Any], *, customer_phone: str | None) -> dict[str, Any] | None:
    """
    Из ``delivery_snapshot[\"ozonLogistics\"][\"sellerCheckout\"]`` — тело для ``order_create_with_phone_guard``.
    """
    if not isinstance(seller_checkout, dict) or not seller_checkout:
        return None
    ocb = seller_checkout.get("orderCreateBody")
    if isinstance(ocb, dict) and ocb:
        out = dict(ocb)
        nd = normalize_phone_digits(customer_phone or "") if customer_phone else None
        if nd:
            out["client_phone"] = nd
        return out if out else None
    if "checkoutRequest" in seller_checkout or "checkoutResult" in seller_checkout:
        if seller_checkout.get("checkoutError"):
            return None
        if seller_checkout.get("checkoutResult") is None:
            return None
        return build_from_checkout_pair(
            seller_checkout.get("checkoutRequest"),
            seller_checkout.get("checkoutResult"),
            customer_phone=customer_phone,
        )
    out = dict(seller_checkout)
    nd = normalize_phone_digits(customer_phone or "") if customer_phone else None
    if nd:
        out["client_phone"] = nd
    return out if out else None
