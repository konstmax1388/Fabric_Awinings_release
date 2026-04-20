from unittest.mock import patch

import pytest


@pytest.mark.django_db
@patch("api.services.cdek_order_create.fetch_cdek_access_token", return_value="tok")
@patch("api.services.cdek_order_create.search_cdek_cities")
@patch("api.services.cdek_order_create.post_json")
def test_create_cdek_order_for_cart_success(mock_post_json, mock_search, _mock_token):
    from api.models import CartOrder, Product, ProductCategory, SiteSettings
    from api.services.cdek_order_create import create_cdek_order_for_cart

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.cdek_tariff_codes_office = "136"
    s.cdek_default_weight_grams = 2500
    s.cdek_default_length_cm = 40
    s.cdek_default_width_cm = 30
    s.cdek_default_height_cm = 20
    s.save(
        update_fields=[
            "cdek_enabled",
            "cdek_tariff_codes_office",
            "cdek_default_weight_grams",
            "cdek_default_length_cm",
            "cdek_default_width_cm",
            "cdek_default_height_cm",
        ]
    )

    cat = ProductCategory.objects.create(slug="cat-test", title="Категория")
    product = Product.objects.create(
        slug="prod-test",
        title="Товар",
        category=cat,
        price_from=1000,
        cdek_weight_grams=1800,
        cdek_length_cm=55,
        cdek_width_cm=35,
        cdek_height_cm=25,
    )

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
        lines=[{"title": "Товар", "priceFrom": 1000, "qty": 2, "productId": product.pk}],
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
    sent_body = mock_post_json.call_args.args[1]
    assert sent_body["packages"] == [
        {"number": "1", "weight": 1800, "length": 55, "width": 35, "height": 25},
        {"number": "2", "weight": 1800, "length": 55, "width": 35, "height": 25},
    ]


@pytest.mark.django_db
@patch("api.services.cdek_order_create.fetch_cdek_access_token", return_value="tok")
@patch("api.services.cdek_order_create.search_cdek_cities")
@patch("api.services.cdek_order_create.post_json")
def test_create_cdek_order_uses_global_fallback_dimensions(mock_post_json, mock_search, _mock_token):
    from api.models import CartOrder, SiteSettings
    from api.services.cdek_order_create import create_cdek_order_for_cart

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.cdek_tariff_codes_office = "136"
    s.cdek_default_weight_grams = 4200
    s.cdek_default_length_cm = 60
    s.cdek_default_width_cm = 45
    s.cdek_default_height_cm = 30
    s.save(
        update_fields=[
            "cdek_enabled",
            "cdek_tariff_codes_office",
            "cdek_default_weight_grams",
            "cdek_default_length_cm",
            "cdek_default_width_cm",
            "cdek_default_height_cm",
        ]
    )

    mock_search.side_effect = [
        [{"code": 44, "label": "Москва"}],
        [{"code": 137, "label": "Иваново"}],
    ]
    mock_post_json.return_value = {"entity": {"uuid": "req-2", "cdek_number": "CDEK-TRACK-2"}}

    order = CartOrder.objects.create(
        order_ref="T-CDEK-2",
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
    sent_body = mock_post_json.call_args.args[1]
    assert sent_body["packages"] == [
        {"number": "1", "weight": 4200, "length": 60, "width": 45, "height": 30}
    ]
