"""Создание заказа (накладной) в СДЭК API v2 после оформления на витрине."""

from __future__ import annotations

import logging
import os
import time
import urllib.parse
from typing import Any

from api.models import CartOrder, SiteSettings
from api.services.cdek_dimensions import cdek_widget_goods_for_lines
from api.services.cdek_http import CdekAuthError, fetch_cdek_access_token
from api.services.cdek_locations import search_cdek_cities
from api.services.cdek_runtime import cdek_api_base_url
from api.services.cdek_widget_service import WIDGET_APP_HEADERS
from api.services.http_util import HttpJsonError, get_json, post_json

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


def _parse_tariff_codes(raw: str) -> list[int]:
    out: list[int] = []
    for part in (raw or "").replace(";", ",").split(","):
        p = part.strip()
        if p.isdigit():
            out.append(int(p))
    return out


def _extract_cdek_payload(order: CartOrder, settings: SiteSettings) -> dict[str, Any] | None:
    snap = order.delivery_snapshot if isinstance(order.delivery_snapshot, dict) else {}
    cdek = snap.get("cdek") if isinstance(snap, dict) else {}
    if not isinstance(cdek, dict):
        return None

    tariff_code = _tariff_code_from_snapshot(order, settings)

    to_city = str(snap.get("city") or "").strip()
    from_city = (settings.cdek_widget_sender_city or "Москва").strip()
    from_code = _first_city_code(settings, from_city)
    to_code = _first_city_code(settings, to_city)
    if not from_code or not to_code:
        return None

    mode = str(cdek.get("mode") or "").strip().lower()
    pvz_code = str(cdek.get("pvzCode") or "").strip()
    addr = str(snap.get("address") or cdek.get("address") or "").strip()
    office_tariffs = _parse_tariff_codes(settings.cdek_tariff_codes_office)
    door_tariffs = _parse_tariff_codes(settings.cdek_tariff_codes_door)

    destination_mode = ""
    # Приоритет — явный выбор покупателя на checkout.
    if mode in {"office", "pickup"}:
        destination_mode = "office"
    elif mode == "door":
        destination_mode = "door"
    elif addr and not pvz_code:
        destination_mode = "door"
    elif pvz_code and not addr:
        destination_mode = "office"
    elif addr and pvz_code:
        destination_mode = "office"

    if destination_mode == "office":
        if office_tariffs:
            if tariff_code not in office_tariffs:
                tariff_code = office_tariffs[0]
        if not tariff_code:
            return None
    elif destination_mode == "door":
        if door_tariffs:
            if tariff_code not in door_tariffs:
                tariff_code = door_tariffs[0]
        if not tariff_code:
            return None
    else:
        return None

    packages = []
    goods = cdek_widget_goods_for_lines(order.lines if isinstance(order.lines, list) else [], settings)
    unit_items: list[dict[str, Any]] = []
    lines = order.lines if isinstance(order.lines, list) else []
    for line_idx, raw in enumerate(lines, start=1):
        if not isinstance(raw, dict):
            continue
        title = str(raw.get("title") or "Товар").strip()[:255] or "Товар"
        try:
            price = int(raw.get("priceFrom") or 0)
        except (TypeError, ValueError):
            price = 0
        price = max(0, price)
        try:
            qty = int(raw.get("qty") or 1)
        except (TypeError, ValueError):
            qty = 1
        qty = min(max(1, qty), 50)
        for unit_no in range(1, qty + 1):
            unit_items.append(
                {
                    "name": title,
                    "ware_key": f"{line_idx}-{unit_no}",
                    "cost": price,
                    "payment": {"value": price if order.payment_method == CartOrder.PaymentMethod.COD_CDEK else 0},
                    "amount": 1,
                }
            )
    if not unit_items:
        unit_items = [
            {
                "name": "Товар",
                "ware_key": "1-1",
                "cost": 0,
                "payment": {"value": 0},
                "amount": 1,
            }
        ]

    package_count = max(len(goods), len(unit_items))
    if package_count < 1:
        package_count = 1
    for idx in range(package_count):
        pack = goods[idx] if idx < len(goods) else goods[-1]
        base_item = unit_items[idx] if idx < len(unit_items) else unit_items[-1]
        item = dict(base_item)
        item["weight"] = int(pack["weight"])
        packages.append(
            {
                "number": str(idx + 1),
                "weight": int(pack["weight"]),
                "length": int(pack["length"]),
                "width": int(pack["width"]),
                "height": int(pack["height"]),
                "items": [item],
            }
        )

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
        "packages": packages,
    }
    email = (order.customer_email or "").strip()
    if email:
        payload["recipient"]["email"] = email
    if destination_mode == "office":
        if not pvz_code:
            return None
        payload["to_location"] = {"code": int(to_code)}
        payload["delivery_point"] = pvz_code
    elif destination_mode == "door":
        if not addr:
            return None
        payload.pop("delivery_point", None)
        payload["to_location"] = {"code": int(to_code), "address": addr}
    else:
        return None

    if order.payment_method == CartOrder.PaymentMethod.COD_CDEK:
        cdek_raw = snap.get("cdek") if isinstance(snap, dict) else None
        cdek_data = cdek_raw if isinstance(cdek_raw, dict) else {}
        fee_value = 0
        raw_fee = cdek_data.get("recipientFeeRub")
        try:
            fee_value = max(0, int(float(raw_fee))) if raw_fee is not None else 0
        except (TypeError, ValueError):
            fee_value = 0
        if fee_value > 0:
            payload["delivery_recipient_cost"] = {
                "value": fee_value,
                "vat_sum": 0,
            }

    return payload


def _extract_tracking_from_cdek_response(payload: Any) -> tuple[str, str]:
    tracking = ""
    req_uuid = ""
    if isinstance(payload, dict):
        ent = payload.get("entity")
        if isinstance(ent, dict):
            tracking = str(ent.get("cdek_number") or ent.get("number") or "").strip()
            req_uuid = str(ent.get("uuid") or "").strip()
        if not req_uuid:
            req_uuid = str(payload.get("request_uuid") or "").strip()
    return tracking, req_uuid


def _fetch_cdek_order_by_uuid(settings: SiteSettings, token: str, req_uuid: str) -> dict[str, Any] | None:
    if not req_uuid:
        return None
    base = cdek_api_base_url(settings).rstrip("/")
    qs = urllib.parse.urlencode({"uuid": req_uuid})
    url = f"{base}/v2/orders?{qs}"
    headers = {"Authorization": f"Bearer {token}", **WIDGET_APP_HEADERS}
    data = get_json(url, headers=headers, timeout=45.0)
    if isinstance(data, dict):
        return data
    return None


def _extract_tracking_from_uuid_lookup(payload: dict[str, Any] | None) -> str:
    if not isinstance(payload, dict):
        return ""
    entity = payload.get("entity")
    if isinstance(entity, dict):
        return str(entity.get("cdek_number") or entity.get("number") or "").strip()
    if isinstance(entity, list):
        for row in entity:
            if not isinstance(row, dict):
                continue
            tr = str(row.get("cdek_number") or row.get("number") or "").strip()
            if tr:
                return tr
    return ""


def _inject_tracking_into_order_texts(order: CartOrder, tracking: str) -> None:
    tr = (tracking or "").strip()
    if not tr:
        return
    changed_fields: list[str] = []
    client_ack = (order.client_ack or "").strip()
    manager_letter = (order.manager_letter or "").strip()
    marker = f"Трек СДЭК: {tr}"
    if marker not in client_ack:
        sep = "\n\n" if client_ack else ""
        order.client_ack = f"{client_ack}{sep}{marker}"
        changed_fields.append("client_ack")
    if marker not in manager_letter:
        sep = "\n" if manager_letter else ""
        order.manager_letter = f"{manager_letter}{sep}{marker}"
        changed_fields.append("manager_letter")
    if changed_fields:
        order.save(update_fields=changed_fields)


def _dispatch_tracking_to_email_and_crm(order: CartOrder) -> None:
    tracking = (order.cdek_tracking or "").strip()
    if not tracking:
        return
    snap = order.delivery_snapshot if isinstance(order.delivery_snapshot, dict) else {}
    meta = snap.get("cdekTrackingDispatched") if isinstance(snap.get("cdekTrackingDispatched"), dict) else {}
    sent_buyer = bool(meta.get("buyerEmail"))
    sent_crm = bool(meta.get("crm"))
    changed = False

    if not sent_buyer:
        try:
            from api.services.notification_email import send_buyer_order_confirmation_email

            send_buyer_order_confirmation_email(order)
            meta["buyerEmail"] = True
            changed = True
        except Exception:
            logger.exception("send_buyer_order_confirmation_email with tracking failed for order=%s", order.order_ref)
    if not sent_crm:
        try:
            from api.services.astrum_crm import push_cart_order_to_astrum_crm

            push_cart_order_to_astrum_crm(order)
            meta["crm"] = True
            changed = True
        except Exception:
            logger.exception("push_cart_order_to_astrum_crm with tracking failed for order=%s", order.order_ref)

    if changed:
        snap["cdekTrackingDispatched"] = meta
        order.delivery_snapshot = snap
        order.save(update_fields=["delivery_snapshot"])


def create_cdek_order_for_cart(order: CartOrder) -> tuple[bool, str | None]:
    """Создаёт заказ в СДЭК для CartOrder с delivery_method=cdek."""
    if order.delivery_method != CartOrder.DeliveryMethod.CDEK:
        return False, "not_cdek_delivery"
    if (order.cdek_tracking or "").strip():
        return False, "already_created"

    settings = SiteSettings.get_solo()
    if not settings.cdek_enabled:
        return False, "cdek_disabled"

    snap = order.delivery_snapshot if isinstance(order.delivery_snapshot, dict) else {}
    create_resp = snap.get("cdekCreateResponse") if isinstance(snap, dict) else {}
    if isinstance(create_resp, dict):
        req_uuid = str(create_resp.get("requestUuid") or "").strip()
        if req_uuid:
            try:
                token = fetch_cdek_access_token(settings)
                details = _fetch_cdek_order_by_uuid(settings, token, req_uuid)
            except (CdekAuthError, HttpJsonError):
                details = None
            tracking = _extract_tracking_from_uuid_lookup(details)
            if tracking:
                order.cdek_tracking = tracking
                order.save(update_fields=["cdek_tracking"])
                _inject_tracking_into_order_texts(order, tracking)
                _dispatch_tracking_to_email_and_crm(order)
                return True, None
            return False, f"tracking_pending:{req_uuid}"

    body = _extract_cdek_payload(order, settings)
    if not body:
        return False, "insufficient_payload"
    snap_for_debug = order.delivery_snapshot if isinstance(order.delivery_snapshot, dict) else {}
    snap_for_debug["cdekLastCreatePayload"] = body
    order.delivery_snapshot = snap_for_debug
    order.save(update_fields=["delivery_snapshot"])

    try:
        token = fetch_cdek_access_token(settings)
    except CdekAuthError as e:
        return False, str(e)

    url = f"{cdek_api_base_url(settings).rstrip('/')}/v2/orders"
    headers = {"Authorization": f"Bearer {token}", **WIDGET_APP_HEADERS}
    try:
        resp = post_json(url, body, headers=headers, timeout=45.0)
    except HttpJsonError as e:
        logger.warning("CDEK create order failed order=%s payload=%s error=%s", order.order_ref, body, str(e))
        return False, str(e)

    tracking, req_uuid = _extract_tracking_from_cdek_response(resp)
    if not tracking and req_uuid:
        for _ in range(3):
            try:
                details = _fetch_cdek_order_by_uuid(settings, token, req_uuid)
            except HttpJsonError:
                details = None
            tracking = _extract_tracking_from_uuid_lookup(details)
            if tracking:
                break
            time.sleep(0.8)

    if not (tracking or req_uuid):
        logger.warning("CDEK create order response without tracking/request_uuid: %s", resp)
        return False, "unexpected_response"

    if tracking:
        order.cdek_tracking = tracking
    snap = order.delivery_snapshot if isinstance(order.delivery_snapshot, dict) else {}
    snap["cdekCreateResponse"] = {"tracking": tracking, "requestUuid": req_uuid}
    order.delivery_snapshot = snap
    update_fields = ["delivery_snapshot"]
    if tracking:
        update_fields.append("cdek_tracking")
    order.save(update_fields=update_fields)
    if tracking:
        _inject_tracking_into_order_texts(order, tracking)
        _dispatch_tracking_to_email_and_crm(order)
        return True, None
    return False, f"tracking_pending:{req_uuid or 'unknown'}"


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
        _dispatch_tracking_to_email_and_crm(order)
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

    err_text = (err or "unknown_error")[:2000]
    if err_text.startswith("tracking_pending:"):
        order.cdek_sync_status = CartOrder.CdekSyncStatus.PENDING
        order.cdek_sync_error = err_text
        order.save(update_fields=["cdek_sync_status", "cdek_sync_error"])
        return False, err

    order.cdek_sync_status = CartOrder.CdekSyncStatus.ERROR
    order.cdek_sync_error = err_text
    order.save(update_fields=["cdek_sync_status", "cdek_sync_error"])
    return False, err
