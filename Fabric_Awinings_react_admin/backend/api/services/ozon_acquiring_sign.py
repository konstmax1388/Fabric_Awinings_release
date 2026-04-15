"""
Подписи Ozon Acquiring API (SHA-256 hex).

Спецификация: https://docs.ozon.ru/api/acquiring/ — раздел «Подпись запроса», «Подпись уведомления».
"""

from __future__ import annotations

import hashlib
import hmac
from typing import Any


def request_sign_create_order(
    *,
    access_key: str,
    secret_key: str,
    expires_at: str,
    ext_id: str,
    fiscalization_type: str,
    payment_algorithm: str,
    amount_currency_code: str,
    amount_value: str,
) -> str:
    """
    POST /v1/createOrder — конкатенация полей без разделителей, затем SHA-256 hex.

    Порядок: accessKey, expiresAt, extId, fiscalizationType, paymentAlgorithm,
    amount.currencyCode, amount.value, secretKey.
    Пустые необязательные поля — пустые строки.
    """
    fingerprint = (
        f"{access_key}"
        f"{expires_at}"
        f"{ext_id}"
        f"{fiscalization_type}"
        f"{payment_algorithm}"
        f"{amount_currency_code}"
        f"{amount_value}"
        f"{secret_key}"
    )
    return hashlib.sha256(fingerprint.encode("utf-8")).hexdigest()


def _str_or_empty(v: Any) -> str:
    if v is None:
        return ""
    return str(v)


def expected_notification_signature(
    payload: dict[str, Any],
    *,
    shop_access_key: str,
    notification_secret_key: str,
) -> str | None:
    """
    Ожидаемый requestSign для входящего POST-уведомления (как в доке Ozon, Python-пример).

    Используется accessKey магазина из настроек (идентификатор токена), не из тела уведомления.

    Два сценария:
    - попытка оплаты по заказу (есть orderID);
    - самостоятельная попытка оплаты (без orderID, используется extTransactionID).
    """
    access_key = _str_or_empty(shop_access_key)
    if not access_key or not notification_secret_key:
        return None

    order_id = payload.get("orderID")
    has_order = order_id is not None and _str_or_empty(order_id) != ""

    if has_order:
        tx_num = payload.get("transactionID")
        tx_uid = payload.get("transactionUid") or payload.get("transactionUID")
        if tx_num is not None and tx_num != "":
            tx_part = _str_or_empty(tx_num)
        else:
            tx_part = _str_or_empty(tx_uid)

        fourth = _str_or_empty(payload.get("extOrderID"))

        digest = (
            f"{access_key}|"
            f"{_str_or_empty(order_id)}|"
            f"{tx_part}|"
            f"{fourth}|"
            f"{_str_or_empty(payload.get('amount'))}|"
            f"{_str_or_empty(payload.get('currencyCode'))}|"
            f"{notification_secret_key}"
        )
    else:
        ext_tx = _str_or_empty(payload.get("extTransactionID") or payload.get("extTransactionId"))
        digest = (
            f"{access_key}|||{ext_tx}|"
            f"{_str_or_empty(payload.get('amount'))}|"
            f"{_str_or_empty(payload.get('currencyCode'))}|"
            f"{notification_secret_key}"
        )

    return hashlib.sha256(digest.encode("utf-8")).hexdigest()


def verify_notification_request_sign(
    payload: dict[str, Any],
    *,
    shop_access_key: str,
    notification_secret_key: str,
) -> bool:
    """Сравнивает вычисленный SHA-256 с полем requestSign (без учёта регистра hex)."""
    expected = expected_notification_signature(
        payload,
        shop_access_key=shop_access_key,
        notification_secret_key=notification_secret_key,
    )
    got = _str_or_empty(payload.get("requestSign")).lower()
    if not expected or not got:
        return False
    return hmac.compare_digest(expected.lower(), got)
