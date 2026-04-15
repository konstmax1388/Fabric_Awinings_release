"""Проверка вебхука Б24 из админки (только сохранённые SiteSettings)."""

from unittest.mock import patch

import pytest

from api.models import SiteSettings
from api.services.bitrix24_admin_test import run_bitrix24_saved_settings_test


@pytest.mark.django_db
def test_saved_test_rejects_empty_webhook():
    s = SiteSettings.get_solo()
    s.bitrix24_webhook_base = ""
    s.bitrix24_catalog_product_iblock_id = None
    s.bitrix24_catalog_offer_iblock_id = None
    s.save()

    rows = run_bitrix24_saved_settings_test()
    assert len(rows) == 1
    assert rows[0]["ok"] is False
    assert rows[0]["id"] == "webhook"


@pytest.mark.django_db
@patch("api.services.bitrix24_admin_test.call_bitrix_webhook")
def test_saved_test_profile_and_product_list(mock_call):
    s = SiteSettings.get_solo()
    s.bitrix24_webhook_base = "https://p.bitrix24.ru/rest/1/secret"
    s.bitrix24_catalog_product_iblock_id = 23
    s.bitrix24_catalog_offer_iblock_id = None
    s.save()

    mock_call.side_effect = [
        {"result": {"NAME": "Иван", "LAST_NAME": "Тестов"}},
        {"result": {"products": [{"id": 1, "xmlId": "a"}]}},
    ]

    rows = run_bitrix24_saved_settings_test()
    assert mock_call.call_count == 2
    assert rows[0]["ok"] is True
    assert rows[0]["id"] == "profile"
    assert rows[1]["ok"] is True
    assert rows[1]["id"] == "product_list"
    assert "1" in rows[1]["detail"]


@pytest.mark.django_db
@patch("api.services.bitrix24_admin_test.call_bitrix_webhook")
def test_saved_test_profile_failure_stops(mock_call):
    s = SiteSettings.get_solo()
    s.bitrix24_webhook_base = "https://p.bitrix24.ru/rest/1/bad"
    s.bitrix24_catalog_product_iblock_id = 1
    s.save()

    from api.services.bitrix24_rest import BitrixRestError

    mock_call.side_effect = BitrixRestError("INVALID_CREDENTIALS")

    rows = run_bitrix24_saved_settings_test()
    assert mock_call.call_count == 1
    assert len(rows) == 1
    assert rows[0]["ok"] is False
