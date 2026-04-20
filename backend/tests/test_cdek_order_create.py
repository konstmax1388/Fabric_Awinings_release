from unittest.mock import patch

import pytest


@pytest.mark.django_db
@patch("api.services.cdek_order_create.fetch_cdek_access_token", return_value="tok")
@patch("api.services.cdek_order_create.search_cdek_cities")
@patch("api.services.cdek_order_create.post_json")
def test_create_cdek_order_for_cart_success(mock_post_json, mock_search, _mock_token):
    from api.models import CartOrder, SiteSettings
    from api.services.cdek_order_create import create_cdek_order_for_cart

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.cdek_tariff_codes_office = "136"
    s.save(update_fields=["cdek_enabled", "cdek_tariff_codes_office"])

    mock_search.side_effect = [
        [{"code": 44, "label": "Москва"}],  # from city
        [{"code": 137, "label": "Иваново"}],  # to city
    ]
    mock_post_json.return_value = {"entity": {"uuid": "req-1", "cdek_number": "CDEK-TRACK-1"}}

    order = CartOrder.objects.create(
        order_ref="T-CDEK-1",
        customer_name="Иван",
        customer_phone="+79990001122",
        customer_email="ivan@example.com",
        delivery_method=CartOrder.DeliveryMethod.CDEK,
        payment_method=CartOrder.PaymentMethod.COD_CDEK,
        total_approx=1500,
        lines=[{"title": "Товар", "priceFrom": 1000, "qty": 1}],
        delivery_snapshot={"city": "Иваново", "cdek": {"mode": "office", "pvzCode": "IVN1"}},
        manager_letter="x",
        client_ack="y",
    )

    ok, err = create_cdek_order_for_cart(order)
    assert ok is True
    assert err is None
    order.refresh_from_db()
    assert order.cdek_tracking == "CDEK-TRACK-1"
    assert isinstance(order.delivery_snapshot, dict)
    assert "cdekCreateResponse" in order.delivery_snapshot
