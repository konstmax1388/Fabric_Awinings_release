"""
Отправка заказов корзины в CRM через приложение «Заявки с сайта» (Astrum Agency).

Документация провайдера: https://app-5.astrum.agency/documentation

Настройки: блок «Битрикс24: заявки с сайта (Astrum)» в админке (приоритет) или переменные
окружения ASTRUM_CRM_* (если интеграция в БД выключена).
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator

from api.models import CartOrder
from api.services.bitrix_product_map import resolve_bitrix_catalog_id_for_cart_line

logger = logging.getLogger(__name__)

DEFAULT_ASTRUM_API_URL = "https://app-5.astrum.agency/api/order"

# Домены, на которых Astrum (и MX-проверки) дают 400 «does not accept email» — не шлём в contact.email.
_BLOCKED_CRM_EMAIL_DOMAINS = frozenset(
    {
        "example.com",
        "example.org",
        "example.net",
        "example",  # TLD .example (RFC 6761)
        "invalid",
        "localhost",
        "test",
    }
)
_email_validator = EmailValidator()


def _email_acceptable_for_astrum_contact(raw: str) -> bool:
    """True — можно передать email в Astrum; иначе лучше только телефон + имя."""
    addr = (raw or "").strip()
    if not addr or len(addr) > 254:
        return False
    try:
        _email_validator(addr)
    except ValidationError:
        return False
    if "@" not in addr:
        return False
    _, _, domain = addr.rpartition("@")
    d = domain.lower().strip()
    if not d:
        return False
    if d in _BLOCKED_CRM_EMAIL_DOMAINS:
        return False
    if d.endswith(".example") or d.endswith(".localhost"):
        return False
    return True


@dataclass(frozen=True)
class AstrumCrmRuntimeConfig:
    api_key: str
    api_url: str
    assigned_default: int
    contact_behavior: str
    entity_behavior: str
    deal_title_prefix: str
    timeout: int


def resolve_astrum_crm_config() -> AstrumCrmRuntimeConfig | None:
    """Сначала настройки из SiteSettings (если включено), иначе — из django.conf.settings (env)."""
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    if getattr(s, "astrum_crm_enabled", False):
        key = (s.astrum_crm_api_key or "").strip()
        ad = s.astrum_crm_assigned_default
        if key and ad is not None:
            url = (s.astrum_crm_api_url or "").strip() or DEFAULT_ASTRUM_API_URL
            to = int(s.astrum_crm_timeout_seconds or 15)
            return AstrumCrmRuntimeConfig(
                api_key=key,
                api_url=url,
                assigned_default=int(ad),
                contact_behavior=s.astrum_crm_contact_behavior,
                entity_behavior=s.astrum_crm_entity_behavior,
                deal_title_prefix=(s.astrum_crm_deal_title_prefix or "Заказ с сайта").strip(),
                timeout=max(5, min(120, to)),
            )
        logger.warning(
            "astrum_crm: в админке включена интеграция, но не заданы API-ключ или ID ответственного — отправка отключена"
        )
        return None

    key = (getattr(settings, "ASTRUM_CRM_API_KEY", "") or "").strip()
    ad = getattr(settings, "ASTRUM_CRM_ASSIGNED_DEFAULT", None)
    if not key or ad is None:
        return None
    url = (getattr(settings, "ASTRUM_CRM_API_URL", "") or "").strip() or DEFAULT_ASTRUM_API_URL
    to = int(getattr(settings, "ASTRUM_CRM_TIMEOUT", 15) or 15)
    return AstrumCrmRuntimeConfig(
        api_key=key,
        api_url=url,
        assigned_default=int(ad),
        contact_behavior=(
            getattr(settings, "ASTRUM_CRM_CONTACT_BEHAVIOR", None) or "SELECT_EXISTING"
        ).strip(),
        entity_behavior=(
            getattr(settings, "ASTRUM_CRM_ENTITY_BEHAVIOR", None) or "CREATE_ANYWAY"
        ).strip(),
        deal_title_prefix=(
            getattr(settings, "ASTRUM_CRM_DEAL_TITLE_PREFIX", None) or "Заказ с сайта"
        ).strip(),
        timeout=max(5, min(120, to)),
    )


def astrum_crm_enabled() -> bool:
    return resolve_astrum_crm_config() is not None


def build_astrum_payload(order: CartOrder, cfg: AstrumCrmRuntimeConfig) -> dict[str, Any]:
    """Тело POST /api/order по спецификации Astrum."""
    lines = order.lines if isinstance(order.lines, list) else []
    products: list[dict[str, Any]] = []
    for row in lines:
        if not isinstance(row, dict):
            continue
        title = str(row.get("title") or "Товар").strip() or "Товар"
        try:
            price = int(row.get("priceFrom") or 0)
        except (TypeError, ValueError):
            price = 0
        try:
            qty = int(row.get("qty") or 1)
        except (TypeError, ValueError):
            qty = 1
        if qty < 1:
            qty = 1
        if price < 0:
            price = 0
        item: dict[str, Any] = {
            "product_name": title[:500],
            "price": price,
            "quantity": qty,
        }
        b24_id = resolve_bitrix_catalog_id_for_cart_line(row)
        if b24_id is not None:
            item["product_id"] = b24_id
        products.append(item)

    prefix = cfg.deal_title_prefix or "Заказ с сайта"
    deal_title = f"{prefix} {order.order_ref}"

    comments_parts = [
        f"Номер на сайте: {order.order_ref}",
        f"Сумма ориентировочно: {order.total_approx} ₽",
    ]
    if order.manager_letter:
        comments_parts.append("")
        comments_parts.append(order.manager_letter)
    comments = "\n".join(comments_parts)[:50000]

    contact: dict[str, Any] = {
        "name": order.customer_name.strip()[:250],
        "phone": order.customer_phone.strip()[:80],
    }
    ce = (order.customer_email or "").strip()
    if ce:
        if _email_acceptable_for_astrum_contact(ce):
            contact["email"] = ce[:250]
        else:
            logger.info(
                "astrum_crm: заказ %s — email не отправляем в CRM (недопустимый для посредника): %s",
                order.order_ref,
                ce[:80],
            )

    return {
        "assigned_default": cfg.assigned_default,
        "contact_behavior": cfg.contact_behavior,
        "entity_behavior": cfg.entity_behavior,
        "contact": contact,
        "deal": {
            "title": deal_title[:250],
            "comments": comments,
            "products": products,
        },
    }


def _post_json(url: str, api_key: str, payload: dict[str, Any], timeout: int) -> tuple[int, str, dict[str, Any] | None]:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = Request(
        url,
        data=body,
        method="POST",
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "X-API-Key": api_key,
        },
    )
    try:
        with urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            code = resp.getcode()
    except HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace") if e.fp else ""
        return e.code, raw, _safe_json(raw)
    except URLError as e:
        return 0, str(e.reason or e), None

    return code, raw, _safe_json(raw)


def _safe_json(text: str) -> dict[str, Any] | None:
    if not text.strip():
        return None
    try:
        out = json.loads(text)
        return out if isinstance(out, dict) else None
    except json.JSONDecodeError:
        return None


def push_cart_order_to_astrum_crm(order: CartOrder) -> None:
    """
    Отправляет заказ в Astrum API и обновляет поля bitrix_* на CartOrder.
    При выключенной интеграции (нет ключа / assigned) — no-op, статус NOT_SENT.
    """
    cfg = resolve_astrum_crm_config()
    if cfg is None:
        return

    order.bitrix_sync_attempts = (order.bitrix_sync_attempts or 0) + 1
    order.bitrix_sync_status = CartOrder.BitrixSyncStatus.PENDING
    order.bitrix_sync_error = ""
    order.save(
        update_fields=["bitrix_sync_attempts", "bitrix_sync_status", "bitrix_sync_error"]
    )

    payload = build_astrum_payload(order, cfg)
    try:
        code, raw, data = _post_json(
            cfg.api_url, cfg.api_key, payload, timeout=cfg.timeout
        )
    except Exception:
        logger.exception("astrum_crm: запрос для заказа %s", order.order_ref)
        order.bitrix_sync_status = CartOrder.BitrixSyncStatus.ERROR
        order.bitrix_sync_error = "Исключение при HTTP-запросе (см. логи сервера)."
        order.save(update_fields=["bitrix_sync_status", "bitrix_sync_error"])
        return

    if 200 <= code < 300:
        ext_id = ""
        if data is not None:
            rid = data.get("id")
            if rid is not None:
                ext_id = str(rid)[:128]
        order.bitrix_sync_status = CartOrder.BitrixSyncStatus.SYNCED
        order.bitrix_entity_id = ext_id
        order.bitrix_sync_error = ""
        order.save(
            update_fields=["bitrix_sync_status", "bitrix_entity_id", "bitrix_sync_error"]
        )
        logger.info(
            "astrum_crm: заказ %s принят посредником, code=%s id=%s",
            order.order_ref,
            code,
            ext_id or "—",
        )
        return

    err_msg = raw[:2000] if raw else f"HTTP {code}"
    order.bitrix_sync_status = CartOrder.BitrixSyncStatus.ERROR
    order.bitrix_sync_error = err_msg
    order.save(update_fields=["bitrix_sync_status", "bitrix_sync_error"])
    logger.warning(
        "astrum_crm: заказ %s ошибка HTTP %s: %s",
        order.order_ref,
        code,
        err_msg[:500],
    )
