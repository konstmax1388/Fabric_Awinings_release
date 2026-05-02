"""
Вызов Seller API ``delivery/checkout`` при оформлении заказа с доставкой Ozon (новый поток).

Срабатывает только если в ``ozon_logistics`` включён ``seller_delivery_api_enabled`` — иначе
снимок доставки не меняется (старый поток Ozon Pay без изменений).

При ошибке HTTP запроса в снимок пишется ``sellerCheckout`` с ``checkoutError`` / ``checkoutHttpStatus``,
оформление заказа на сайте не блокируется (оплата и эквайринг как раньше); создание заказа в Ozon
после оплаты будет пропущено, если не удалось собрать валидное тело из пары request/result.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def enrich_ozon_logistics_delivery_snapshot(
    delivery_snapshot: dict[str, Any],
    *,
    lines_plain: list[dict[str, Any]],
    customer_phone: str,
) -> dict[str, Any]:
    try:
        from ozon_logistics.services.order_guard import normalize_phone_digits, seller_delivery_api_enabled
    except Exception:
        return delivery_snapshot

    if not seller_delivery_api_enabled():
        return delivery_snapshot

    snap = dict(delivery_snapshot) if isinstance(delivery_snapshot, dict) else {}
    oz0 = snap.get("ozonLogistics")
    oz = dict(oz0) if isinstance(oz0, dict) else {}
    existing = oz.get("sellerCheckout")
    if isinstance(existing, dict) and existing.get("orderCreateBody"):
        # Редактор/клиент передал явное тело — не перезаписываем
        snap["ozonLogistics"] = oz
        return snap
    if isinstance(existing, dict) and existing.get("checkoutResult") is not None:
        # Уже есть успешный ответ checkout — не вызываем API повторно
        snap["ozonLogistics"] = oz
        return snap

    digits = normalize_phone_digits(customer_phone) or ""
    if not digits:
        logger.warning("ozon_logistics_seller_checkout_enrich: empty phone, skip delivery/checkout")
        snap["ozonLogistics"] = oz
        return snap

    body = _build_checkout_request_body(lines_plain=lines_plain, client_phone_digits=digits, delivery_snapshot=snap)
    if not body.get("products"):
        snap["ozonLogistics"] = oz
        return snap

    try:
        from ozon_logistics.services import delivery_checkout
    except Exception:
        return snap

    try:
        result = delivery_checkout(body)
        oz["sellerCheckout"] = {"checkoutRequest": body, "checkoutResult": result}
    except Exception as e:
        from api.services.http_util import HttpJsonError

        err_msg = str(e)[:2000]
        http_status = getattr(e, "status", None) if isinstance(e, HttpJsonError) else None
        logger.warning("ozon_logistics_seller_checkout_enrich: delivery/checkout failed: %s", err_msg)
        oz["sellerCheckout"] = {
            "checkoutRequest": body,
            "checkoutResult": None,
            "checkoutError": err_msg,
            **({"checkoutHttpStatus": int(http_status)} if http_status is not None else {}),
        }

    snap["ozonLogistics"] = oz
    return snap


def _build_checkout_request_body(
    *,
    lines_plain: list[dict[str, Any]],
    client_phone_digits: str,
    delivery_snapshot: dict[str, Any],
) -> dict[str, Any]:
    from api.services.ozon_acquiring_cart import aggregate_qty_by_ozon_sku

    need = aggregate_qty_by_ozon_sku(lines_plain)
    products: list[dict[str, Any]] = []
    for sku, qty in sorted(need.items()):
        try:
            products.append({"sku": int(sku), "quantity": int(qty)})
        except (TypeError, ValueError):
            continue
    body: dict[str, Any] = {"client_phone": client_phone_digits, "products": products}
    city = str(delivery_snapshot.get("city") or "").strip()
    addr = str(delivery_snapshot.get("address") or "").strip()
    comment = str(delivery_snapshot.get("comment") or "").strip()
    parts = [p for p in (city, addr, comment) if p]
    if parts:
        body["address"] = ", ".join(parts)[:2000]
    return body
