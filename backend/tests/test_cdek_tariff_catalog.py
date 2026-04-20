"""Сервис подбора тарифов СДЭК для админки."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from api.models import SiteSettings
from api.services.cdek_tariff_catalog import fetch_cdek_tariff_catalog


@pytest.mark.django_db
def test_fetch_groups_by_widget_bucket():
    site = SiteSettings.get_solo()
    site.cdek_enabled = True
    site.save(update_fields=["cdek_enabled"])

    sample = {
        "tariff_codes": [
            {
                "tariff_code": 100,
                "tariff_name": "Тест дверь-дверь",
                "tariff_description": "",
                "delivery_mode": 1,
                "delivery_sum": 100.0,
            },
            {
                "tariff_code": 200,
                "tariff_name": "Тест склад-склад",
                "tariff_description": "",
                "delivery_mode": 4,
                "delivery_sum": 200.0,
            },
        ]
    }

    with (
        patch("api.services.cdek_tariff_catalog.fetch_cdek_access_token", return_value="tok"),
        patch("api.services.cdek_tariff_catalog.post_json", return_value=sample),
    ):
        items, err = fetch_cdek_tariff_catalog(site, from_city_code=270, to_city_code=44)

    assert err is None
    assert items is not None
    by_code = {x["tariff_code"]: x for x in items}
    assert by_code[100]["widget_bucket"] == "door"
    assert by_code[200]["widget_bucket"] == "office"


@pytest.mark.django_db
def test_fetch_disabled_cdek():
    site = SiteSettings.get_solo()
    site.cdek_enabled = False
    site.save(update_fields=["cdek_enabled"])

    items, err = fetch_cdek_tariff_catalog(site, from_city_code=1, to_city_code=2)
    assert items is None
    assert err and "отключ" in err.lower()
