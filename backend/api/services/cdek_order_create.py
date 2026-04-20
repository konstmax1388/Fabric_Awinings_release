"""Создание заказа (накладной) в СДЭК API v2 после оформления на витрине."""

from __future__ import annotations

import logging
import os
from typing import Any

from api.models import CartOrder, SiteSettings
from api.services.cdek_http import CdekAuthError, fetch_cdek_access_token
from api.services.cdek_locations import search_cdek_cities
from api.services.cdek_runtime import cdek_api_base_url
from api.services.cdek_widget_service import WIDGET_APP_HEADERS
from api.services.http_util import HttpJsonError, post_json

logger = logging.getLogger(__name__)
DEFAULT_MAX_SYNC_ATTEMPTS = 5


def _first_city_code(settings: SiteSettings, query: str) -> int | None:
    q = (query or "").strip()
    if len(q) < 2:
        return None
    rows = search_cdek_cities(settings, q, limit=1)
    if not rows:
        return None
    code = rows[0].get("code")
    return int(code) if isinstance(code, int) else None


def _tariff_code_from_snapshot(order: CartOrder, settings: SiteSettings) -> int | None:
    snap = order.delivery_snapshot if isinstance(order.delivery_snapshot, dict) else {}
    cdek = snap.get("cdek") if isinstance(snap, dict) else {}
    if isinstance(cdek, dict):
        raw = cdek.get("tariffCode")
        try:
            if raw is not None:
                val = int(raw)
                if val > 0:
                    return val
        except (TypeError, ValueError):
            pass
        mode = str(cdek.get("mode") or "").strip().lower()
    else:
        mode = ""

    src = settings.cdek_tariff_codes_door if mode == "door" else settings.cdek_tariff_codes_office
    for part in (src or "").replace(";", ",").split(","):
        p = part.strip()
        if p.isdigit():
            return int(p)
    return None


def _extract_cdek_payload(order: CartOrder, settings: SiteSettings) -> dict[str, Any] | None:
    snap = order.delivery_snapshot if isinstance(order.delivery_snapshot, dict) else {}
    cdek = snap.get("cdek") if isinstance(snap, dict) else {}
    if not isinstance(cdek, dict):
        return None

    tariff_code = _tariff_code_from_snapshot(order, settings)
    if not tariff_code:
        return None

    to_city = str(snap.get("city") or "").strip()
    from_city = (settings.cdek_widget_sender_city or "Москва").strip()
    from_code = _first_city_code(settings, from_city)
    to_code = _first_city_code(settings, to_city)
    if not from_code or not to_code:
        return None

    weight = int(os.environ.get("CDEK_WIDGET_DEFAULT_WEIGHT_G", "3000") or "3000")
    if weight <= 0:
        weight = 3000

    mode = str(cdek.get("mode") or "").strip().lower()
    pvz_code = str(cdek.get("pvzCode") or "").strip()
    addr = str(snap.get("address") or cdek.get("address") or "").strip()

    payload: dict[str, Any] = {
        "type": 1,
        "number": order.order_ref,
        "tariff_code": int(tariff_code),
        "comment": (order.customer_comment or "").strip()[:255],
        "from_location": {"code": int(from_code)},
        "to_location": {"code": int(to_code)},
        "recipient": {
            "name": (order.customer_name or "").strip()[:100],
            "phones": [{"number": (order.customer_phone or "").strip()}],
        },
        "packages": [{"number": "1", "weight": int(weight)}],
    }
    email = (order.customer_email or "").strip()
    if email:
        payload["recipient"]["email"] = email
    if mode == "office" and pvz_code:
        payload["delivery_point"] = pvz_code
    if mode == "door" and addr:
        payload["to_location"]["address"] = addr

    if order.payment_method == CartOrder.PaymentMethod.COD_CDEK:
        payload["delivery_recipient_cost"] = {
            "value": int(order.total_approx or 0),
            "vat_sum": 0,
        }

    return payload


def create_cdek_order_for_cart(order: CartOrder) -> tuple[bool, str | None]:
    """Создаёт заказ в СДЭК для CartOrder с delivery_method=cdek."""
    if order.delivery_method != CartOrder.DeliveryMethod.CDEK:
        return False, "not_cdek_delivery"
    if (order.cdek_tracking or "").strip():
        return False, "already_created"

    settings = SiteSettings.get_solo()
    if not settings.cdek_enabled:
        return False, "cdek_disabled"

    body = _extract_cdek_payload(order, settings)
    if not body:
        return False, "insufficient_payload"

    try:
        token = fetch_cdek_access_token(settings)
    except CdekAuthError as e:
        return False, str(e)

    url = f"{cdek_api_base_url(settings).rstrip('/')}/v2/orders"
    headers = {"Authorization": f"Bearer {token}", **WIDGET_APP_HEADERS}
    try:
        resp = post_json(url, body, headers=headers, timeout=45.0)
    except HttpJsonError as e:
        return False, str(e)

    tracking = ""
    req_uuid = ""
    if isinstance(resp, dict):
        ent = resp.get("entity")
        if isinstance(ent, dict):
            tracking = str(ent.get("cdek_number") or ent.get("number") or "").strip()
            req_uuid = str(ent.get("uuid") or "").strip()
        if not req_uuid:
            req_uuid = str(resp.get("request_uuid") or "").strip()

    if not (tracking or req_uuid):
        logger.warning("CDEK create order response without tracking/request_uuid: %s", resp)
        return False, "unexpected_response"

    order.cdek_tracking = tracking or req_uuid
    snap = order.delivery_snapshot if isinstance(order.delivery_snapshot, dict) else {}
    snap["cdekCreateResponse"] = {"tracking": tracking, "requestUuid": req_uuid}
    order.delivery_snapshot = snap
    order.save(update_fields=["cdek_tracking", "delivery_snapshot"])
    return True, None


def _max_sync_attempts() -> int:
    raw = os.environ.get("CDEK_SYNC_MAX_ATTEMPTS", str(DEFAULT_MAX_SYNC_ATTEMPTS))
    try:
        val = int(raw)
    except (TypeError, ValueError):
        return DEFAULT_MAX_SYNC_ATTEMPTS
    return max(1, min(val, 20))


def sync_cdek_order_with_retry(order: CartOrder) -> tuple[bool, str | None]:
    """
    Безопасная отправка заказа в СДЭК с учётом статуса/попыток.
    Используется для онлайн-оплаты после webhook Completed и для ручных ретраев.
    """
    if order.delivery_method != CartOrder.DeliveryMethod.CDEK:
        return False, "not_cdek_delivery"
    if (order.cdek_tracking or "").strip():
        if order.cdek_sync_status != CartOrder.CdekSyncStatus.SUCCESS:
            order.cdek_sync_status = CartOrder.CdekSyncStatus.SUCCESS
            order.cdek_sync_error = ""
            order.save(update_fields=["cdek_sync_status", "cdek_sync_error"])
        return True, None

    max_attempts = _max_sync_attempts()
    if int(order.cdek_sync_attempts or 0) >= max_attempts:
        return False, f"max_attempts_reached:{max_attempts}"

    order.cdek_sync_attempts = int(order.cdek_sync_attempts or 0) + 1
    order.cdek_sync_status = CartOrder.CdekSyncStatus.PENDING
    order.save(update_fields=["cdek_sync_attempts", "cdek_sync_status"])

    ok, err = create_cdek_order_for_cart(order)
    order.refresh_from_db(fields=["cdek_tracking", "delivery_snapshot", "cdek_sync_status", "cdek_sync_error"])
    if ok:
        order.cdek_sync_status = CartOrder.CdekSyncStatus.SUCCESS
        order.cdek_sync_error = ""
        order.save(update_fields=["cdek_sync_status", "cdek_sync_error"])
        return True, None

    order.cdek_sync_status = CartOrder.CdekSyncStatus.ERROR
    order.cdek_sync_error = (err or "unknown_error")[:2000]
    order.save(update_fields=["cdek_sync_status", "cdek_sync_error"])
    return False, err
