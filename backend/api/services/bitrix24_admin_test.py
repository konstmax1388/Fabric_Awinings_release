"""
Проверка сохранённых в админке настроек вебхука Битрикс24 (REST каталог).

Используются только поля ``SiteSettings`` — не переменные окружения.
"""

from __future__ import annotations

from typing import Any

from api.models import SiteSettings
from api.services.bitrix24_catalog_sync import rows_from_bitrix_list_response
from api.services.bitrix24_rest import BitrixRestError, call_bitrix_webhook


def run_bitrix24_saved_settings_test(*, timeout: int = 45) -> list[dict[str, Any]]:
    """
    Последовательные проверки: ``profile``, при необходимости один запрос к каталогу.

    Каждый элемент: ``id``, ``ok`` (bool), ``title``, ``detail`` (str).
    """
    s = SiteSettings.get_solo()
    wb = (s.bitrix24_webhook_base or "").strip().rstrip("/")
    out: list[dict[str, Any]] = []

    if not wb:
        out.append(
            {
                "id": "webhook",
                "ok": False,
                "title": "База URL вебхука",
                "detail": "Поле пустое. Вставьте URL вебхука (…/rest/1/секрет), сохраните форму и повторите проверку.",
            }
        )
        return out

    try:
        prof = call_bitrix_webhook(wb, "profile", {}, timeout=timeout)
        r = prof.get("result") or {}
        name = ""
        if isinstance(r, dict):
            name = (r.get("NAME") or r.get("name") or r.get("LAST_NAME") or "").strip()
            if not name:
                ln = (r.get("LAST_NAME") or "").strip()
                fn = (r.get("NAME") or "").strip()
                name = (f"{ln} {fn}".strip() or r.get("EMAIL") or r.get("email") or "").strip()
        tail = f" ({name})" if name else ""
        out.append(
            {
                "id": "profile",
                "ok": True,
                "title": "REST: метод profile",
                "detail": f"Вебхук отвечает, доступ к API есть{tail}.",
            }
        )
    except BitrixRestError as e:
        out.append(
            {
                "id": "profile",
                "ok": False,
                "title": "REST: метод profile",
                "detail": str(e),
            }
        )
        return out

    pid = s.bitrix24_catalog_product_iblock_id
    oid = s.bitrix24_catalog_offer_iblock_id

    if pid is None and oid is None:
        out.append(
            {
                "id": "iblocks",
                "ok": False,
                "title": "Инфоблоки каталога",
                "detail": "Укажите хотя бы один ID инфоблока (товары и/или торговые предложения), сохраните и повторите проверку.",
            }
        )
        return out

    if pid is not None:
        try:
            data = call_bitrix_webhook(
                wb,
                "catalog.product.list",
                {
                    "select": ["id", "iblockId", "xmlId"],
                    "filter": {"iblockId": int(pid)},
                    "start": 0,
                },
                timeout=timeout,
            )
            rows = rows_from_bitrix_list_response(data)
            out.append(
                {
                    "id": "product_list",
                    "ok": True,
                    "title": f"Каталог: товары (инфоблок {pid})",
                    "detail": f"Запрос catalog.product.list выполнен; на первой странице элементов: {len(rows)} (до 50).",
                }
            )
        except BitrixRestError as e:
            out.append(
                {
                    "id": "product_list",
                    "ok": False,
                    "title": f"Каталог: товары (инфоблок {pid})",
                    "detail": str(e),
                }
            )

    if oid is not None:
        try:
            data = call_bitrix_webhook(
                wb,
                "catalog.product.offer.list",
                {
                    "select": ["id", "iblockId", "xmlId"],
                    "filter": {"iblockId": int(oid)},
                    "start": 0,
                },
                timeout=timeout,
            )
            rows = rows_from_bitrix_list_response(data)
            out.append(
                {
                    "id": "offer_list",
                    "ok": True,
                    "title": f"Каталог: торговые предложения (инфоблок {oid})",
                    "detail": f"Запрос catalog.product.offer.list выполнен; на первой странице элементов: {len(rows)} (до 50).",
                }
            )
        except BitrixRestError as e:
            out.append(
                {
                    "id": "offer_list",
                    "ok": False,
                    "title": f"Каталог: торговые предложения (инфоблок {oid})",
                    "detail": str(e),
                }
            )

    return out
