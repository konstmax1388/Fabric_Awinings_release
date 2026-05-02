"""
Проверки перед вызовом ``/v2/order/create`` (Ozon Доставка).

Вызывайте ``assert_order_create_phone_allowed`` из кода нового потока сразу перед ``order_create``,
если в настройках включено ограничение по «внутренним» номерам.

Переменные окружения (опционально, перекрывают поля в админке): ``OZON_LOGISTICS_SELLER_DELIVERY_API_ENABLED``,
``OZON_LOGISTICS_ORDER_INTERNAL_PHONES_ONLY`` — значения ``1``/``true`` или ``0``/``false``.
"""

from __future__ import annotations

import os
import re

from ozon_logistics.models import OzonLogisticsSettings

from .exceptions import OzonLogisticsPhoneNotAllowedError


def _env_tri_bool(name: str) -> bool | None:
    v = (os.environ.get(name) or "").strip().lower()
    if v in ("1", "true", "yes"):
        return True
    if v in ("0", "false", "no"):
        return False
    return None


def normalize_phone_digits(phone: str | None) -> str | None:
    """Только цифры; для РФ приводит к виду 7XXXXXXXXXX (11 цифр), если было 10XXXXXXXXX."""
    if not phone:
        return None
    d = re.sub(r"\D", "", str(phone).strip())
    if not d:
        return None
    if len(d) == 10 and d[0] == "9":
        d = "7" + d
    if len(d) == 11 and d[0] == "8":
        d = "7" + d[1:]
    if len(d) == 11 and d[0] == "7":
        return d
    if len(d) >= 11:
        return d[-11:] if d[-11] == "7" else d
    return d


def _parse_allowlist_entries(raw: str) -> list[str]:
    out: list[str] = []
    if not (raw or "").strip():
        return out
    for part in re.split(r"[\n,;]+", raw):
        p = (part or "").strip()
        if p:
            out.append(p)
    return out


def phone_matches_allowlist(phone: str | None, allowlist_raw: str) -> bool:
    """Совпадение с любым из номеров списка после нормализации."""
    norm = normalize_phone_digits(phone)
    if not norm:
        return False
    allowed_norms: set[str] = set()
    for entry in _parse_allowlist_entries(allowlist_raw):
        n = normalize_phone_digits(entry)
        if n:
            allowed_norms.add(n)
    return norm in allowed_norms


def assert_order_create_phone_allowed(customer_phone: str | None) -> None:
    """
    Если в настройках включено «только внутренние телефоны» — проверяет ``customer_phone`` по списку.

    При пустом списке и включённой опции — блокируем (fail-closed), чтобы не отправить заказ случайно.
    """
    s = OzonLogisticsSettings.get_solo()
    restrict = _env_tri_bool("OZON_LOGISTICS_ORDER_INTERNAL_PHONES_ONLY")
    if restrict is None:
        restrict = bool(s.order_create_only_internal_phones)
    if not restrict:
        return
    raw = (s.internal_phones_allowlist or "").strip()
    if not raw:
        raise OzonLogisticsPhoneNotAllowedError(
            "Включено ограничение по телефонам для создания заказа в Ozon, но список разрешённых номеров пуст. "
            "Заполните «Список разрешённых телефонов» в настройках Ozon Доставка или выключите опцию."
        )
    if not phone_matches_allowlist(customer_phone, raw):
        raise OzonLogisticsPhoneNotAllowedError(
            "Телефон покупателя не входит в список разрешённых для создания заказа в Ozon (режим тестирования)."
        )


def seller_delivery_api_enabled() -> bool:
    """Включён ли новый поток вызовов Seller API доставки (фича-флаг для постепенного переключения)."""
    eb = _env_tri_bool("OZON_LOGISTICS_SELLER_DELIVERY_API_ENABLED")
    if eb is not None:
        return eb
    return bool(OzonLogisticsSettings.get_solo().seller_delivery_api_enabled)
