from unittest.mock import patch

import pytest


@pytest.mark.django_db
@patch("api.services.cdek_order_create.fetch_cdek_access_token", return_value="tok")
@patch("api.services.cdek_order_create.search_cdek_cities")
@patch("api.services.notification_email.send_buyer_order_confirmation_email")
@patch("api.services.astrum_crm.push_cart_order_to_astrum_crm")
@patch("api.services.cdek_order_create.post_json")
def test_create_cdek_order_for_cart_success(
    mock_post_json, mock_push_crm, mock_send_buyer, mock_search, _mock_token
):
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
    assert "Трек СДЭК: CDEK-TRACK-1" in (order.client_ack or "")
    assert "Трек СДЭК: CDEK-TRACK-1" in (order.manager_letter or "")
    sent_body = mock_post_json.call_args.args[1]
    assert "delivery_recipient_cost" not in sent_body
    assert sent_body["packages"] == [
        {
            "number": "1",
            "weight": 1800,
            "length": 55,
            "width": 35,
            "height": 25,
            "items": [
                {
                    "name": "Товар",
                    "ware_key": "1-1",
                    "cost": 1000,
                    "payment": {"value": 1000},
                    "amount": 1,
                    "weight": 1800,
                }
            ],
        },
        {
            "number": "2",
            "weight": 1800,
            "length": 55,
            "width": 35,
            "height": 25,
            "items": [
                {
                    "name": "Товар",
                    "ware_key": "1-2",
                    "cost": 1000,
                    "payment": {"value": 1000},
                    "amount": 1,
                    "weight": 1800,
                }
            ],
        },
    ]
    mock_send_buyer.assert_called_once()
    mock_push_crm.assert_called_once()


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
    assert "delivery_recipient_cost" not in sent_body
    assert sent_body["packages"] == [
        {
            "number": "1",
            "weight": 4200,
            "length": 60,
            "width": 45,
            "height": 30,
            "items": [
                {
                    "name": "Товар",
                    "ware_key": "1-1",
                    "cost": 1000,
                    "payment": {"value": 1000},
                    "amount": 1,
                    "weight": 4200,
                }
            ],
        }
    ]


@pytest.mark.django_db
@patch("api.services.cdek_order_create.fetch_cdek_access_token", return_value="tok")
@patch("api.services.cdek_order_create.search_cdek_cities")
@patch("api.services.cdek_order_create.get_json")
@patch("api.services.notification_email.send_buyer_order_confirmation_email")
@patch("api.services.astrum_crm.push_cart_order_to_astrum_crm")
@patch("api.services.cdek_order_create.post_json")
def test_create_cdek_order_fetches_tracking_by_request_uuid(
    mock_post_json, mock_push_crm, mock_send_buyer, mock_get_json, mock_search, _mock_token
):
    from api.models import CartOrder, SiteSettings
    from api.services.cdek_order_create import create_cdek_order_for_cart

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.cdek_tariff_codes_office = "136"
    s.save(update_fields=["cdek_enabled", "cdek_tariff_codes_office"])

    mock_search.side_effect = [
        [{"code": 44, "label": "Москва"}],
        [{"code": 137, "label": "Иваново"}],
    ]
    mock_post_json.return_value = {"request_uuid": "req-uuid-1"}
    mock_get_json.return_value = {"entity": {"cdek_number": "CDEK-TRACK-UUID"}}

    order = CartOrder.objects.create(
        order_ref="T-CDEK-3",
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
    assert order.cdek_tracking == "CDEK-TRACK-UUID"
    mock_send_buyer.assert_called_once()
    mock_push_crm.assert_called_once()


@pytest.mark.django_db
@patch("api.services.notification_email.send_buyer_order_confirmation_email")
@patch("api.services.astrum_crm.push_cart_order_to_astrum_crm")
def test_sync_cdek_with_existing_tracking_dispatches_once(mock_push_crm, mock_send_buyer):
    from api.models import CartOrder
    from api.services.cdek_order_create import sync_cdek_order_with_retry

    order = CartOrder.objects.create(
        order_ref="T-CDEK-TRACK-EXISTS",
        customer_name="Иван",
        customer_phone="+79990001122",
        customer_email="ivan@example.com",
        delivery_method=CartOrder.DeliveryMethod.CDEK,
        payment_method=CartOrder.PaymentMethod.COD_CDEK,
        total_approx=1500,
        lines=[{"title": "Товар", "priceFrom": 1000, "qty": 1}],
        cdek_tracking="TRACK-READY-1",
        manager_letter="x",
        client_ack="y",
    )
    ok, err = sync_cdek_order_with_retry(order)
    assert ok is True
    assert err is None
    order.refresh_from_db()
    assert isinstance(order.delivery_snapshot, dict)
    meta = order.delivery_snapshot.get("cdekTrackingDispatched") or {}
    assert meta.get("buyerEmail") is True
    assert meta.get("crm") is True
    assert mock_send_buyer.call_count == 1
    assert mock_push_crm.call_count == 1

    ok2, err2 = sync_cdek_order_with_retry(order)
    assert ok2 is True
    assert err2 is None
    assert mock_send_buyer.call_count == 1
    assert mock_push_crm.call_count == 1


@pytest.mark.django_db
@patch("api.services.cdek_order_create.fetch_cdek_access_token", return_value="tok")
@patch("api.services.cdek_order_create.search_cdek_cities")
@patch("api.services.cdek_order_create.post_json")
def test_create_cdek_order_sends_recipient_delivery_fee_fixed(
    mock_post_json, mock_search, _mock_token
):
    from api.models import CartOrder, SiteSettings
    from api.services.cdek_order_create import create_cdek_order_for_cart

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.cdek_tariff_codes_office = "136"
    s.save(
        update_fields=[
            "cdek_enabled",
            "cdek_tariff_codes_office",
        ]
    )

    mock_search.side_effect = [
        [{"code": 44, "label": "Москва"}],
        [{"code": 137, "label": "Иваново"}],
    ]
    mock_post_json.return_value = {"entity": {"uuid": "req-fixed", "cdek_number": "CDEK-FIXED"}}

    order = CartOrder.objects.create(
        order_ref="T-CDEK-FIXED",
        customer_name="Иван",
        customer_phone="+79990001122",
        customer_email="ivan@example.com",
        delivery_method=CartOrder.DeliveryMethod.CDEK,
        payment_method=CartOrder.PaymentMethod.COD_CDEK,
        total_approx=1500,
        goods_subtotal_approx=1200,
        lines=[{"title": "Товар", "priceFrom": 1200, "qty": 1}],
        delivery_snapshot={
            "city": "Иваново",
            "cdek": {"mode": "office", "pvzCode": "IVN1", "recipientFeeRub": 350},
        },
        manager_letter="x",
        client_ack="y",
    )

    ok, err = create_cdek_order_for_cart(order)
    assert ok is True
    assert err is None
    sent_body = mock_post_json.call_args.args[1]
    assert sent_body["delivery_recipient_cost"] == {"value": 350, "vat_sum": 0}


@pytest.mark.django_db
@patch("api.services.cdek_order_create.fetch_cdek_access_token", return_value="tok")
@patch("api.services.cdek_order_create.search_cdek_cities")
@patch("api.services.cdek_order_create.post_json")
def test_create_cdek_order_sends_recipient_delivery_fee_percent(
    mock_post_json, mock_search, _mock_token
):
    from api.models import CartOrder, SiteSettings
    from api.services.cdek_order_create import create_cdek_order_for_cart

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.cdek_tariff_codes_office = "136"
    s.save(
        update_fields=[
            "cdek_enabled",
            "cdek_tariff_codes_office",
        ]
    )

    mock_search.side_effect = [
        [{"code": 44, "label": "Москва"}],
        [{"code": 137, "label": "Иваново"}],
    ]
    mock_post_json.return_value = {"entity": {"uuid": "req-percent", "cdek_number": "CDEK-PERCENT"}}

    order = CartOrder.objects.create(
        order_ref="T-CDEK-PERCENT",
        customer_name="Иван",
        customer_phone="+79990001122",
        customer_email="ivan@example.com",
        delivery_method=CartOrder.DeliveryMethod.CDEK,
        payment_method=CartOrder.PaymentMethod.COD_CDEK,
        total_approx=1500,
        goods_subtotal_approx=1200,
        lines=[{"title": "Товар", "priceFrom": 1200, "qty": 1}],
        delivery_snapshot={
            "city": "Иваново",
            "cdek": {"mode": "office", "pvzCode": "IVN1", "recipientFeeRub": 120},
        },
        manager_letter="x",
        client_ack="y",
    )

    ok, err = create_cdek_order_for_cart(order)
    assert ok is True
    assert err is None
    sent_body = mock_post_json.call_args.args[1]
    assert sent_body["delivery_recipient_cost"] == {"value": 120, "vat_sum": 0}


@pytest.mark.django_db
@patch("api.services.cdek_order_create.fetch_cdek_access_token", return_value="tok")
@patch("api.services.cdek_order_create.search_cdek_cities")
@patch("api.services.cdek_order_create.get_json")
@patch("api.services.cdek_order_create.post_json")
def test_sync_cdek_order_tracking_pending_keeps_pending_status(
    mock_post_json, mock_get_json, mock_search, _mock_token
):
    from api.models import CartOrder, SiteSettings
    from api.services.cdek_order_create import sync_cdek_order_with_retry

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.cdek_tariff_codes_office = "136"
    s.save(update_fields=["cdek_enabled", "cdek_tariff_codes_office"])

    mock_search.side_effect = [
        [{"code": 44, "label": "Москва"}],
        [{"code": 137, "label": "Иваново"}],
    ]
    mock_post_json.return_value = {"request_uuid": "req-pending-1"}
    mock_get_json.return_value = {"entity": []}

    order = CartOrder.objects.create(
        order_ref="T-CDEK-PENDING",
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
    ok, err = sync_cdek_order_with_retry(order)
    assert ok is False
    assert isinstance(err, str) and err.startswith("tracking_pending:")
    order.refresh_from_db()
    assert order.cdek_sync_status == CartOrder.CdekSyncStatus.PENDING


@pytest.mark.django_db
@patch("api.services.cdek_order_create.fetch_cdek_access_token", return_value="tok")
@patch("api.services.cdek_order_create.search_cdek_cities")
@patch("api.services.cdek_order_create.post_json")
def test_create_cdek_order_door_uses_top_level_address_without_delivery_point(
    mock_post_json, mock_search, _mock_token
):
    from api.models import CartOrder, SiteSettings
    from api.services.cdek_order_create import create_cdek_order_for_cart

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.cdek_tariff_codes_door = "137"
    s.save(update_fields=["cdek_enabled", "cdek_tariff_codes_door"])

    mock_search.side_effect = [
        [{"code": 44, "label": "Москва"}],
        [{"code": 137, "label": "Иваново"}],
    ]
    mock_post_json.return_value = {"entity": {"uuid": "req-door-1", "cdek_number": "CDEK-DOOR-1"}}

    order = CartOrder.objects.create(
        order_ref="T-CDEK-DOOR-1",
        customer_name="Иван",
        customer_phone="+79990001122",
        customer_email="ivan@example.com",
        delivery_method=CartOrder.DeliveryMethod.CDEK,
        payment_method=CartOrder.PaymentMethod.COD_CDEK,
        total_approx=1500,
        goods_subtotal_approx=1200,
        lines=[{"title": "Товар", "priceFrom": 1200, "qty": 1}],
        delivery_snapshot={
            "city": "Иваново",
            "address": "Россия, Иваново, улица Красных Зорь, 7А",
            "cdek": {"mode": "door", "address": "", "pvzCode": "", "tariffCode": 137},
        },
        manager_letter="x",
        client_ack="y",
    )

    ok, err = create_cdek_order_for_cart(order)
    assert ok is True
    assert err is None
    sent_body = mock_post_json.call_args.args[1]
    assert sent_body["to_location"]["address"] == "Россия, Иваново, улица Красных Зорь, 7А"
    assert "delivery_point" not in sent_body
