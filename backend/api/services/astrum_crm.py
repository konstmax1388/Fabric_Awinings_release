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

from api.models import CartOrder
from api.services.bitrix_product_map import resolve_bitrix_catalog_id_for_cart_line

logger = logging.getLogger(__name__)

DEFAULT_ASTRUM_API_URL = "https://app-5.astrum.agency/api/order"


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


def build_astrum_payload(
    order: CartOrder,
    cfg: AstrumCrmRuntimeConfig,
    *,
    include_contact_email: bool = True,
) -> dict[str, Any]:
    """Тело POST /api/order по спецификации Astrum.

    По умолчанию в contact передаётся e-mail из заказа (как пришёл с витрины). Если посредник
    отклоняет адрес (например, из‑за проверки DNS домена), при повторной отправке можно вызвать
    с ``include_contact_email=False``: тогда e-mail в contact не уходит, но строка с адресом
    добавляется в комментарий сделки, чтобы менеджер видел его вручную.
    """
    ce = (order.customer_email or "").strip()
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

    delivery_price = max(0, int(order.delivery_price_rub or 0))
    cdek_raw = (order.delivery_snapshot or {}).get("cdek") if isinstance(order.delivery_snapshot, dict) else None
    cdek_data = cdek_raw if isinstance(cdek_raw, dict) else {}
    try:
        recipient_fee = max(0, int(float(cdek_data.get("recipientFeeRub") or 0)))
    except (TypeError, ValueError):
        recipient_fee = 0
    if recipient_fee > 0:
        products.append(
            {
                "product_name": "Доп. сбор с получателя (СДЭК)",
                "price": recipient_fee,
                "quantity": 1,
            }
        )

    prefix = cfg.deal_title_prefix or "Заказ с сайта"
    is_one_click = order.order_source == CartOrder.OrderSource.ONE_CLICK
    if is_one_click:
        deal_title = f"Заказ в 1 клик {order.order_ref}"
    else:
        deal_title = f"{prefix} {order.order_ref}"

    comments_parts = [
        *(
            [
                "Тип: заказ в 1 клик (оформление с карточки товара или из корзины, без выбора доставки).",
            ]
            if is_one_click
            else []
        ),
        f"Номер на сайте: {order.order_ref}",
        f"Статус оплаты: {order.get_payment_status_display()}",
        f"Способ оплаты: {order.get_payment_method_display()}",
        f"Сумма в CRM (без доставки): {max(0, int(order.total_approx or 0) - delivery_price)} ₽",
        f"Доставка (справочно): {delivery_price} ₽",
        f"Итого для клиента (справочно): {order.total_approx} ₽",
    ]
    cdek_tracking = (order.cdek_tracking or "").strip()
    if cdek_tracking:
        comments_parts.append(f"Трек СДЭК: {cdek_tracking}")
    if order.manager_letter:
        comments_parts.append("")
        comments_parts.append(order.manager_letter)
    if not include_contact_email and ce:
        comments_parts.append("")
        comments_parts.append(
            f"E-mail с сайта: {ce[:500]} "
            "(в поле contact API не передавался: посредник отклонил адрес по своим правилам; "
            "на сайте адрес прошёл проверку — для связи используйте телефон или уточните почту у клиента.)"
        )
    comments = "\n".join(comments_parts)[:50000]

    contact: dict[str, Any] = {
        "name": order.customer_name.strip()[:250],
        "phone": order.customer_phone.strip()[:80],
    }
    if include_contact_email and ce:
        contact["email"] = ce[:250]

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


def _astrum_post_order_succeeds(order: CartOrder, cfg: AstrumCrmRuntimeConfig) -> bool:
    """
    POST /api/order с теми же повторами, что push_cart_order_to_astrum_crm (e-mail),
    без изменения полей CartOrder. Для «мягкого» повторного пуша после смены статуса.
    """
    had_email = bool((order.customer_email or "").strip())
    payload = build_astrum_payload(order, cfg, include_contact_email=True)
    try:
        code, raw, data = _post_json(
            cfg.api_url, cfg.api_key, payload, timeout=cfg.timeout
        )
    except Exception:
        logger.exception("astrum_crm: HTTP-запрос (follow-up) для %s", order.order_ref)
        return False
    if 200 <= code < 300:
        return True
    if had_email and _should_retry_astrum_without_contact_email(code, raw, data):
        logger.info("astrum_crm: follow-up — повтор POST без contact.email для %s", order.order_ref)
        payload2 = build_astrum_payload(order, cfg, include_contact_email=False)
        try:
            code2, raw2, data2 = _post_json(
                cfg.api_url, cfg.api_key, payload2, timeout=cfg.timeout
            )
        except Exception:
            logger.exception("astrum_crm: follow-up (повтор) для %s", order.order_ref)
            return False
        if 200 <= code2 < 300:
            return True
        logger.warning(
            "astrum_crm: follow-up (повтор) HTTP %s: %s",
            code2,
            (raw2 or "")[:500],
        )
        return False
    logger.warning("astrum_crm: follow-up HTTP %s: %s", code, (raw or "")[:500])
    return False


def push_astrum_crm_after_ozon_payment_captured(order: CartOrder) -> None:
    """
    Повторный POST в Astrum после вебхука Ozon (оплата прошла), чтобы в сделке Б24 в комментариях
    отразились «Оплачен» и актуальные поля. Не трогает bitrix_sync_*: при сбое первая синхронизация
    оформления не портится. Один успешный запуск на заказ (флаг acquiring_payload).
    """
    cfg = resolve_astrum_crm_config()
    if cfg is None:
        return
    if order.payment_method != CartOrder.PaymentMethod.CARD_ONLINE:
        return
    if order.payment_status != CartOrder.PaymentStatus.CAPTURED:
        return
    ap0 = order.acquiring_payload if isinstance(order.acquiring_payload, dict) else {}
    if ap0.get("bitrixOzonPaymentPushSent"):
        return
    if not _astrum_post_order_succeeds(order, cfg):
        return
    co = CartOrder.objects.get(pk=order.pk)
    ap = dict(co.acquiring_payload) if isinstance(co.acquiring_payload, dict) else {}
    ap["bitrixOzonPaymentPushSent"] = True
    co.acquiring_payload = ap
    co.save(update_fields=["acquiring_payload"])
    logger.info("astrum_crm: follow-up после оплаты Ozon — ок, order=%s", order.order_ref)


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


_ASTRUM_ADMIN_CONTACT_EMAIL_HINT = (
    "Посредник (Astrum) отклонил e-mail в поле contact (часто из‑за проверки домена). "
    "Система автоматически повторяет заявку без e-mail в API, а адрес с сайта добавляет в комментарий сделки. "
    "Если эта подсказка сопровождает сохранённую ошибку — оба запроса не прошли; смотрите JSON ниже."
)


def _looks_like_astrum_contact_email_rejection(err_text: str) -> bool:
    if "contact.email" not in err_text:
        return False
    t = err_text.lower()
    return "invalid email" in t or "domain name" in t or "does not exist" in t


def _should_retry_astrum_without_contact_email(
    code: int, raw: str, data: dict[str, Any] | None
) -> bool:
    """Один повтор POST без contact.email, если ответ API явно про отклонение contact.email."""
    if not (400 <= code < 500):
        return False
    s = (raw or "").strip()
    if _looks_like_astrum_contact_email_rejection(s):
        return True
    if data and isinstance(data.get("extra"), list):
        for item in data.get("extra") or []:
            if isinstance(item, dict) and item.get("key") == "contact.email":
                return True
    return False


def humanize_astrum_api_error_for_admin(raw: str) -> str:
    """
    Краткое пояснение к ответу Astrum/Б24 для сводки в админке; при отсутствии шаблона — пустая строка.
    """
    s = (raw or "").strip()
    if not s:
        return ""
    if _looks_like_astrum_contact_email_rejection(s):
        return _ASTRUM_ADMIN_CONTACT_EMAIL_HINT
    data = _safe_json(s) if s.lstrip().startswith("{") else None
    if data and isinstance(data.get("extra"), list):
        for item in data.get("extra") or []:
            if not isinstance(item, dict) or item.get("key") != "contact.email":
                continue
            msg = str(item.get("message") or "")
            t = msg.lower()
            if "invalid" in t or "domain" in t:
                return _ASTRUM_ADMIN_CONTACT_EMAIL_HINT
    return ""


def push_cart_order_to_astrum_crm(order: CartOrder) -> None:
    """
    Отправляет заказ в Astrum API и обновляет поля bitrix_* на CartOrder.
    При выключенной интеграции (нет ключа / assigned) — no-op, статус NOT_SENT.
    При ответе 4xx с ошибкой contact.email повторяет запрос без поля e-mail в contact (один раз),
    сохраняя адрес в комментарии сделки.
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

    def _apply_http_success(http_code: int, body_data: dict[str, Any] | None, log_note: str = "") -> None:
        ext_id = ""
        if body_data is not None:
            rid = body_data.get("id")
            if rid is not None:
                ext_id = str(rid)[:128]
        order.bitrix_sync_status = CartOrder.BitrixSyncStatus.SYNCED
        order.bitrix_entity_id = ext_id
        order.bitrix_sync_error = ""
        order.save(
            update_fields=["bitrix_sync_status", "bitrix_entity_id", "bitrix_sync_error"]
        )
        logger.info(
            "astrum_crm: заказ %s принят посредником, code=%s id=%s%s",
            order.order_ref,
            http_code,
            ext_id or "—",
            log_note,
        )

    def _apply_http_error(http_code: int, raw: str) -> None:
        err_msg = raw[:2000] if raw else f"HTTP {http_code}"
        order.bitrix_sync_status = CartOrder.BitrixSyncStatus.ERROR
        order.bitrix_sync_error = err_msg
        order.save(update_fields=["bitrix_sync_status", "bitrix_sync_error"])
        logger.warning(
            "astrum_crm: заказ %s ошибка HTTP %s: %s",
            order.order_ref,
            http_code,
            err_msg[:500],
        )

    had_email = bool((order.customer_email or "").strip())
    payload = build_astrum_payload(order, cfg, include_contact_email=True)
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
        _apply_http_success(code, data)
        return

    if had_email and _should_retry_astrum_without_contact_email(code, raw, data):
        logger.info(
            "astrum_crm: повтор POST без contact.email для заказа %s (после HTTP %s)",
            order.order_ref,
            code,
        )
        payload2 = build_astrum_payload(order, cfg, include_contact_email=False)
        try:
            code2, raw2, data2 = _post_json(
                cfg.api_url, cfg.api_key, payload2, timeout=cfg.timeout
            )
        except Exception:
            logger.exception("astrum_crm: повторный запрос для заказа %s", order.order_ref)
            order.bitrix_sync_status = CartOrder.BitrixSyncStatus.ERROR
            order.bitrix_sync_error = "Исключение при HTTP-запросе (повтор без e-mail, см. логи сервера)."
            order.save(update_fields=["bitrix_sync_status", "bitrix_sync_error"])
            return

        if 200 <= code2 < 300:
            _apply_http_success(
                code2, data2, log_note=" (второй запрос, без contact.email в теле API)"
            )
            return
        _apply_http_error(code2, raw2)
        return

    _apply_http_error(code, raw)
