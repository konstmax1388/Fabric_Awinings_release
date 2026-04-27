import os
from unittest.mock import patch

import pytest


@pytest.mark.django_db
def test_slug_autofilled_when_empty():
    from api.models import BlogPost, ProductCategory

    c = ProductCategory(title="Категория без слага", sort_order=0)
    c.slug = ""
    c.save()
    assert c.slug

    b = BlogPost(title="Статья без слага", excerpt="", body="")
    b.slug = ""
    b.save()
    assert b.slug


def test_teasers_list_for_save_order():
    from api.admin_forms import teasers_list_for_save

    cleaned = {
        "teaser_bestseller": False,
        "teaser_new": True,
        "teaser_recommended": True,
    }
    assert teasers_list_for_save(["recommended", "new"], cleaned) == ["recommended", "new"]
    assert teasers_list_for_save([], cleaned) == ["new", "recommended"]

    all_on = {**cleaned, "teaser_bestseller": True}
    assert teasers_list_for_save(["recommended", "new"], all_on) == ["recommended", "new", "bestseller"]


@pytest.mark.django_db
def test_admin_index_includes_dashboard(client):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    user = User.objects.create_superuser("dashadm", "dash@example.com", "secretpass1")
    client.force_login(user)
    r = client.get("/admin/")
    assert r.status_code == 200
    ctx = r.context
    assert ctx is not None
    assert "dashboard_site" in ctx
    assert ctx["dashboard_site"]["name"]
    assert len(ctx["dashboard_stat_cards"]) == 4


@pytest.mark.django_db
def test_admin_dashboard_hides_calculator_when_disabled(client):
    from django.contrib.auth import get_user_model

    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.show_calculator = False
    s.save()

    User = get_user_model()
    user = User.objects.create_superuser("nocalc", "nc@example.com", "secretpass1")
    client.force_login(user)
    r = client.get("/admin/")
    assert r.status_code == 200
    ctx = r.context
    assert ctx is not None
    assert len(ctx["dashboard_stat_cards"]) == 3
    assert ctx["dashboard_recent_calc"] == []


@pytest.mark.django_db
def test_admin_sitesettings_section_logo(client):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    user = User.objects.create_superuser("sssec", "ss@e.com", "secretpass1")
    client.force_login(user)
    r = client.get("/admin/api/sitesettings/section/logo/")
    assert r.status_code == 200


@pytest.mark.django_db
def test_admin_homepage_section_meta(client):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    user = User.objects.create_superuser("hpsec", "hp@e.com", "secretpass1")
    client.force_login(user)
    r = client.get("/admin/api/homepagecontent/section/meta/")
    assert r.status_code == 200


@pytest.mark.django_db
def test_admin_sitesettings_change_redirects_to_first_section(client):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    user = User.objects.create_superuser("ssred", "ssr@e.com", "secretpass1")
    client.force_login(user)
    r = client.get("/admin/api/sitesettings/1/change/", follow=False)
    assert r.status_code == 302
    assert "/admin/api/sitesettings/section/logo/" in r["Location"]


@pytest.mark.django_db
def test_health(client):
    r = client.get("/api/health/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"
    assert data.get("service") == "fabric-awnings-api"


@pytest.mark.django_db
def test_products_list_empty(client):
    from api.models import Product

    Product.objects.all().delete()
    r = client.get("/api/products/")
    assert r.status_code == 200
    body = r.json()
    assert body.get("count") == 0
    assert body.get("results") == []


@pytest.mark.django_db
def test_products_list_with_product(client):
    from api.models import Product, ProductCategory

    cat, _ = ProductCategory.objects.get_or_create(
        slug="truck",
        defaults={"title": "Транспорт", "sort_order": 0, "is_published": True},
    )
    Product.objects.create(
        slug="test-item",
        title="Test",
        excerpt="",
        description="",
        category=cat,
        price_from=1000,
        show_on_home=False,
        teasers=[],
        marketplace_links={},
        is_published=True,
        sort_order=0,
    )
    r = client.get("/api/products/")
    assert r.status_code == 200
    body = r.json()
    assert body["count"] == 1
    assert body["results"][0]["slug"] == "test-item"
    assert body["results"][0]["priceFrom"] == 1000
    assert body["results"][0]["category"] == "truck"
    assert body["results"][0]["categoryTitle"] == cat.title


@pytest.mark.django_db
def test_product_categories_public(client):
    from api.models import ProductCategory

    ProductCategory.objects.get_or_create(
        slug="demo",
        defaults={"title": "Демо-категория", "sort_order": 1, "is_published": True},
    )
    r = client.get("/api/product-categories/")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    row = next(c for c in data if c.get("slug") == "demo")
    assert row.get("title") == "Демо-категория"
    assert "sortOrder" in row
    assert "imageUrl" in row


@pytest.mark.django_db
def test_calculator_lead_create(client):
    payload = {
        "name": "Иван",
        "phone": "+79991234567",
        "comment": "",
        "lengthM": 3,
        "widthM": 2,
        "materialId": "pvc",
        "materialLabel": "ПВХ",
        "options": ["opt1"],
        "estimatedPriceRub": 50000,
    }
    r = client.post("/api/leads/calculator/", data=payload, content_type="application/json")
    assert r.status_code == 201
    assert r.json().get("name") == "Иван"


@pytest.mark.django_db
def test_cart_order_create(client):
    payload = {
        "customer": {"name": "Пётр", "phone": "+79997654321", "email": "petr@mail.ru"},
        "lines": [
            {
                "productId": "1",
                "slug": "x",
                "title": "Товар",
                "priceFrom": 1000,
                "qty": 2,
            }
        ],
        "totalApprox": 2000,
    }
    r = client.post("/api/leads/cart/", data=payload, content_type="application/json")
    assert r.status_code == 201
    data = r.json()
    assert "orderRef" in data
    assert data["orderRef"]
    assert "clientAck" in data
    assert data.get("fulfillmentStatus") == "received"
    from api.models import CartOrder

    assert CartOrder.objects.get(order_ref=data["orderRef"]).customer_email == "petr@mail.ru"


@pytest.mark.django_db
def test_cart_order_rejects_missing_email(client):
    payload = {
        "customer": {"name": "Пётр", "phone": "+79997654321"},
        "lines": [
            {
                "productId": "1",
                "slug": "x",
                "title": "Товар",
                "priceFrom": 1000,
                "qty": 1,
            }
        ],
        "totalApprox": 1000,
    }
    r = client.post("/api/leads/cart/", data=payload, content_type="application/json")
    assert r.status_code == 400
    body = r.json()
    assert "customer" in body


@pytest.mark.django_db
def test_cart_order_rejects_example_com_email(client):
    payload = {
        "customer": {"name": "Пётр", "phone": "+79997654321", "email": "test@example.com"},
        "lines": [
            {
                "productId": "1",
                "slug": "x",
                "title": "Товар",
                "priceFrom": 1000,
                "qty": 1,
            }
        ],
        "totalApprox": 1000,
    }
    r = client.post("/api/leads/cart/", data=payload, content_type="application/json")
    assert r.status_code == 400


@pytest.mark.django_db
def test_cart_order_rejects_cash_pickup_with_cdek_delivery(client):
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.save(update_fields=["cdek_enabled"])

    payload = {
        "customer": {"name": "Пётр", "phone": "+79997654321", "email": "petr@mail.ru"},
        "lines": [
            {
                "productId": "1",
                "slug": "x",
                "title": "Товар",
                "priceFrom": 1000,
                "qty": 1,
            }
        ],
        "totalApprox": 1000,
        "deliveryMethod": "cdek",
        "paymentMethod": "cash_pickup",
    }
    r = client.post("/api/leads/cart/", data=payload, content_type="application/json")
    assert r.status_code == 400
    err = r.json()
    assert "paymentMethod" in err or "non_field_errors" in err


@pytest.mark.django_db
def test_cdek_oauth_token_uses_cache():
    from django.core.cache import cache

    from api.models import SiteSettings
    from api.services import cdek_http

    cache.clear()
    calls = {"n": 0}

    def fake_post_form(url, fields, **kwargs):
        calls["n"] += 1
        assert "oauth" in url
        return {"access_token": "tok_cached", "expires_in": 3600}

    s = SiteSettings.get_solo()
    s.cdek_test_mode = True
    s.cdek_account = "acc"
    s.cdek_secure_password = "sec"
    s.save()

    with patch.object(cdek_http, "post_form", side_effect=fake_post_form):
        t1 = cdek_http.fetch_cdek_access_token(s, force_refresh=True)
        t2 = cdek_http.fetch_cdek_access_token(s, force_refresh=False)
    assert t1 == t2 == "tok_cached"
    assert calls["n"] == 1


@pytest.mark.django_db
def test_ozon_pay_uses_default_api_base_when_env_empty():
    """Без OZON_PAY_API_URL / OZON_PAY_API_BASE_URL используется https://payapi.ozon.ru (док. Ozon)."""
    from api.models import SiteSettings
    from api.services import ozon_acquiring as ozon_mod

    s = SiteSettings.get_solo()
    s.ozon_pay_enabled = True
    s.ozon_pay_client_id = "cid"
    s.ozon_pay_client_secret = "sec"
    s.save()

    def fake_post_json(url, body, headers=None, **kwargs):
        assert str(url).startswith("https://payapi.ozon.ru/")
        return {"order": {"payLink": "https://pay.example/o", "id": "def-base-1"}}

    with patch.dict(
        os.environ,
        {"OZON_PAY_API_BASE_URL": "", "OZON_PAY_API_URL": ""},
        clear=False,
    ):
        with patch.object(ozon_mod, "post_json", side_effect=fake_post_json):
            out = ozon_mod.try_begin_ozon_pay(order_ref="ORD1", total_approx=100, settings=s)
    assert out.get("liveHttp") is True
    assert out.get("redirectUrl") == "https://pay.example/o"
    assert out.get("ozonOrderId") == "def-base-1"


@pytest.mark.django_db
def test_ozon_pay_create_order_mocked():
    from api.models import SiteSettings
    from api.services import ozon_acquiring as ozon_mod

    s = SiteSettings.get_solo()
    s.ozon_pay_enabled = True
    s.ozon_pay_client_id = "cid"
    s.ozon_pay_client_secret = "sec"
    s.save()

    def fake_post_json(url, body, headers=None, **kwargs):
        assert "/v1/createOrder" in url
        assert body.get("requestSign")
        return {"order": {"payLink": "https://pay.example/o", "id": "oz-id-1"}}

    with patch.dict(os.environ, {"OZON_PAY_API_BASE_URL": "https://acq.test"}, clear=False):
        with patch.object(ozon_mod, "post_json", side_effect=fake_post_json):
            out = ozon_mod.try_begin_ozon_pay(order_ref="R1", total_approx=10, settings=s)
    assert out.get("liveHttp") is True
    assert out.get("redirectUrl") == "https://pay.example/o"
    assert out.get("ozonOrderId") == "oz-id-1"


@pytest.mark.django_db
def test_ozon_create_order_with_logistics_sends_items_and_delivery():
    from api.models import CartOrder, Product, ProductCategory, SiteSettings
    from api.services import ozon_acquiring as ozon_mod

    cat = ProductCategory.objects.create(title="Cat", slug="cat-oz", sort_order=0)
    p = Product.objects.create(
        title="Tent",
        slug="tent-oz",
        category=cat,
        price_from=1000,
        ozon_sku=999888777,
    )

    s = SiteSettings.get_solo()
    s.ozon_pay_enabled = True
    s.ozon_pay_client_id = "cid"
    s.ozon_pay_client_secret = "sec"
    s.save()

    captured: dict = {}

    def fake_post_json(url, body, headers=None, **kwargs):
        captured["body"] = body
        return {"order": {"payLink": "https://pay.test/x", "id": "o1"}}

    lines = [
        {
            "productId": str(p.id),
            "variantId": "",
            "slug": p.slug,
            "title": p.title,
            "priceFrom": 1000,
            "qty": 1,
            "image": "",
        }
    ]
    with patch.dict(os.environ, {"OZON_PAY_API_BASE_URL": "https://acq.test"}, clear=False):
        with patch.object(ozon_mod, "post_json", side_effect=fake_post_json):
            out = ozon_mod.try_begin_ozon_pay(
                order_ref="Z1",
                total_approx=1000,
                settings=s,
                delivery_method=CartOrder.DeliveryMethod.OZON_LOGISTICS,
                cart_lines=lines,
            )
    assert out.get("redirectUrl") == "https://pay.test/x"
    assert out.get("ozonLogisticsInOrder") is True
    b = captured["body"]
    assert b["mode"] == "MODE_FULL"
    assert b["deliverySettings"]["isEnabled"] is True
    assert len(b["items"]) == 1
    assert b["items"][0]["sku"] == 999888777
    assert b["amount"]["value"] == "100000"


def test_ozon_create_order_signature_matches_documentation():
    from api.services.ozon_acquiring_sign import request_sign_create_order

    sig = request_sign_create_order(
        access_key="63fd43a4-f16d-4c3a-9bdf-50f2328781db",
        secret_key="PnHtbKc0lLiTlo4WITnWB44Qb1kpygRl",
        expires_at="2025-10-01T20:00:00.000Z",
        ext_id="MyOrderID-1",
        fiscalization_type="FISCAL_TYPE_SINGLE",
        payment_algorithm="PAY_ALGO_SMS",
        amount_currency_code="643",
        amount_value="100",
    )
    assert sig == "406d29c45ffcb991eb40c3fbce98e714c1ed8963fee0024d7c3ba80dabc407bd"


def test_ozon_notification_signature_matches_documentation():
    from api.services.ozon_acquiring_sign import verify_notification_request_sign

    payload = {
        "orderID": "69f37767-8a8b-4de1-a601-384387aea8c4",
        "extOrderID": "",
        "transactionID": 6981437,
        "transactionUid": "2f460e52-4a7a-4eaf-94fc-6699f7c91741",
        "amount": 52569,
        "currencyCode": "643",
        "requestSign": "ae3c635dd72ec6b2c7833aa7458d57827895a57d4c35fba0e7dcb48f1d367d5f",
    }
    assert verify_notification_request_sign(
        payload,
        shop_access_key="1fac5a70-0ec4-4963-a33a-040ea301ea85",
        notification_secret_key="4qEzUJjBoCXwA6P5NMyrJJUdA6xsnvbV",
    )


@pytest.mark.django_db
def test_ozon_webhook_rejects_invalid_signature(client):
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.ozon_pay_client_id = "ack"
    s.ozon_pay_webhook_secret = "sec"
    s.save()
    r = client.post(
        "/api/webhooks/ozon-pay/",
        data='{"requestSign":"bad","extOrderID":"x"}',
        content_type="application/json",
    )
    assert r.status_code == 403


@pytest.mark.django_db
def test_cart_order_line_stores_image_url(client):
    from api.models import CartOrder

    img = "https://example.com/product-cover.jpg"
    payload = {
        "customer": {"name": "Пётр", "phone": "+79997654321", "email": "petr@mail.ru"},
        "lines": [
            {
                "productId": "1",
                "slug": "x",
                "title": "Товар",
                "priceFrom": 1000,
                "qty": 1,
                "image": img,
            }
        ],
        "totalApprox": 1000,
    }
    r = client.post("/api/leads/cart/", data=payload, content_type="application/json")
    assert r.status_code == 201
    order = CartOrder.objects.get(order_ref=r.json()["orderRef"])
    assert order.lines and order.lines[0].get("image") == img


@patch("api.services.notification_email.send_buyer_order_confirmation_email")
@pytest.mark.django_db
def test_cart_order_with_email_triggers_buyer_confirmation(mock_send, client):
    payload = {
        "customer": {
            "name": "Пётр",
            "phone": "+79997654321",
            "email": "buyer_confirm_test@mail.ru",
        },
        "lines": [
            {
                "productId": "1",
                "slug": "x",
                "title": "Товар",
                "priceFrom": 1000,
                "qty": 1,
            }
        ],
        "totalApprox": 1000,
    }
    r = client.post("/api/leads/cart/", data=payload, content_type="application/json")
    assert r.status_code == 201
    mock_send.assert_called_once()


@pytest.mark.django_db
def test_site_settings_public(client):
    r = client.get("/api/site-settings/")
    assert r.status_code == 200
    assert "no-store" in (r.headers.get("Cache-Control") or "")
    body = r.json()
    assert "enabledMarketplaces" in body
    assert "wb" in body["enabledMarketplaces"]
    assert "ozon" in body["enabledMarketplaces"]
    assert "globalMarketplaceUrls" in body
    for key in (
        "siteName",
        "siteTagline",
        "footerNote",
        "logoUrl",
        "faviconUrl",
        "phone",
        "phoneHref",
        "email",
        "address",
        "legal",
        "footerVkUrl",
        "footerTelegramUrl",
        "contactsPageTitle",
        "contactsIntro",
        "contactsHours",
        "contactsMetaDescription",
        "contactsBackLinkLabel",
        "calculatorEnabled",
        "portfolioEnabled",
        "showSocialLinks",
        "productPhotoAspect",
        "catalogIntro",
        "checkout",
        "analyticsYandex",
        "seoDefaults",
    ):
        assert key in body
    assert body["productPhotoAspect"] in ("portrait_3_4", "square")
    co = body["checkout"]
    assert "deliveryOptions" in co
    assert "paymentMatrix" in co
    assert "pickup" in co
    assert "cdek" in co
    cdek = co["cdek"]
    for k in (
        "enabled",
        "testMode",
        "apiBaseUrl",
        "widgetScriptUrl",
        "yandexMapApiKey",
        "widgetServiceUrl",
        "widgetSenderCity",
        "manualPvzEnabled",
        "checkoutUi",
        "widgetGoods",
    ):
        assert k in cdek
    assert isinstance(cdek["widgetGoods"], list)
    assert "ozonLogistics" in co
    assert "ozonPay" in co
    assert "cdek" in co


@pytest.mark.django_db
def test_site_settings_public_cdek_payment_methods_depend_on_acquiring(client):
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.ozon_pay_enabled = False
    s.save(update_fields=["cdek_enabled", "ozon_pay_enabled"])
    r1 = client.get("/api/site-settings/")
    assert r1.status_code == 200
    pm1 = r1.json()["checkout"]["paymentMatrix"]
    assert "cod_cdek" in pm1.get("cdek", [])
    assert "card_online" not in pm1.get("cdek", [])

    s.ozon_pay_enabled = True
    s.save(update_fields=["ozon_pay_enabled"])
    r2 = client.get("/api/site-settings/")
    assert r2.status_code == 200
    pm2 = r2.json()["checkout"]["paymentMatrix"]
    assert "cod_cdek" in pm2.get("cdek", [])
    assert "card_online" in pm2.get("cdek", [])


@pytest.mark.django_db
def test_cdek_widget_service_requires_action(client):
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.save(update_fields=["cdek_enabled"])
    r = client.post("/api/cdek-widget/service/", data="{}", content_type="application/json")
    assert r.status_code == 400
    assert r.json().get("message")


@pytest.mark.django_db
def test_cdek_widget_service_disabled(client):
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = False
    s.save(update_fields=["cdek_enabled"])
    r = client.post(
        "/api/cdek-widget/service/",
        data='{"action":"offices"}',
        content_type="application/json",
    )
    assert r.status_code == 403


@pytest.mark.django_db
def test_cdek_pickup_points_disabled(client):
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = False
    s.save(update_fields=["cdek_enabled"])
    r = client.get("/api/cdek/pickup-points/?city_code=44")
    assert r.status_code == 400


@pytest.mark.django_db
def test_cdek_pickup_points_requires_city_code(client):
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.save(update_fields=["cdek_enabled"])
    r = client.get("/api/cdek/pickup-points/")
    assert r.status_code == 400


@pytest.mark.django_db
def test_cdek_pickup_points_mocked(client):
    from unittest.mock import patch

    from api.models import SiteSettings
    from api.services import cdek_widget_service

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.cdek_test_mode = True
    s.cdek_account = "acc"
    s.cdek_secure_password = "sec"
    s.save()

    with (
        patch.object(cdek_widget_service, "fetch_cdek_access_token", return_value="tok"),
        patch.object(
            cdek_widget_service,
            "get_json",
            return_value=[
                {
                    "code": "MSK1",
                    "name": "ПВЗ 1",
                    "location": {"address_full": "ул. Тестовая, 1"},
                }
            ],
        ),
    ):
        r = client.get("/api/cdek/pickup-points/?city_code=44")
    assert r.status_code == 200
    data = r.json()
    assert "points" in data
    assert len(data["points"]) == 1
    assert data["points"][0]["code"] == "MSK1"


@pytest.mark.django_db
def test_cdek_widget_service_offices_mocked(client):
    from unittest.mock import patch

    from api.models import SiteSettings
    from api.services import cdek_widget_service

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.cdek_test_mode = True
    s.cdek_account = "acc"
    s.cdek_secure_password = "sec"
    s.save()

    with (
        patch.object(cdek_widget_service, "fetch_cdek_access_token", return_value="tok"),
        patch.object(cdek_widget_service, "get_json", return_value=[{"code": "XXX"}]),
    ):
        r = client.post(
            "/api/cdek-widget/service/",
            data='{"action":"offices","city_code":44}',
            content_type="application/json",
        )
    assert r.status_code == 200
    assert r.json() == [{"code": "XXX"}]
    assert r.headers.get("X-Service-Version") == "3.11.1"


@pytest.mark.django_db
def test_cdek_widget_service_calculate_fills_sender_code(client):
    from unittest.mock import patch

    from api.models import SiteSettings
    from api.services import cdek_widget_service

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.cdek_test_mode = True
    s.cdek_account = "acc"
    s.cdek_secure_password = "sec"
    s.cdek_widget_sender_city = "Москва"
    s.save()

    with (
        patch.object(cdek_widget_service, "fetch_cdek_access_token", return_value="tok"),
        patch.object(
            cdek_widget_service,
            "search_cdek_cities",
            return_value=[{"code": 44, "label": "Москва"}],
        ),
        patch.object(cdek_widget_service, "post_json", return_value={"tariff_codes": []}) as post_mock,
    ):
        r = client.post(
            "/api/cdek-widget/service/",
            data=(
                '{"action":"calculate","from_location":{"city":"Иваново","code":null},'
                '"to_location":{"code":164},"packages":[{"weight":3000,"length":30,"width":20,"height":20}]}'
            ),
            content_type="application/json",
        )
    assert r.status_code == 200
    body = post_mock.call_args.args[1]
    assert body["from_location"]["code"] == 44


@pytest.mark.django_db
def test_cdek_address_suggest_cdek_off(client):
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = False
    s.save(update_fields=["cdek_enabled"])
    r = client.get("/api/cdek/address-suggest/?q=тек")
    assert r.status_code == 400


@pytest.mark.django_db
def test_cdek_address_suggest_short_query(client):
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.cdek_yandex_map_api_key = "test-key"
    s.save()
    r = client.get("/api/cdek/address-suggest/?q=ab")
    assert r.status_code == 200
    assert r.json() == {"suggestions": []}


@pytest.mark.django_db
def test_cdek_suggest_cities_disabled(client):
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = False
    s.save()
    r = client.get("/api/cdek/suggest-cities/?q=мос")
    assert r.status_code == 400


@pytest.mark.django_db
def test_cdek_suggest_cities_short_query(client):
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.save()
    r = client.get("/api/cdek/suggest-cities/?q=м")
    assert r.status_code == 200
    assert r.json()["results"] == []


@pytest.mark.django_db
def test_cdek_suggest_cities_mocked(client):
    from unittest.mock import patch

    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.save()
    fake = [
        {"code": 6, "city": "Иваново", "region": "Ивановская область", "label": "Иваново, Ивановская область"}
    ]
    with patch("api.views_cdek_cities.search_cdek_cities", return_value=fake):
        r = client.get("/api/cdek/suggest-cities/?q=ива")
    assert r.status_code == 200
    assert r.json()["results"] == fake


@pytest.mark.django_db
def test_callback_lead_create(client):
    from api.models import CallbackLead

    r = client.post(
        "/api/leads/callback/",
        data={"name": "Иван", "phone": "+79991234567", "comment": ""},
        content_type="application/json",
    )
    assert r.status_code == 201
    assert CallbackLead.objects.filter(name="Иван", phone="+79991234567").exists()


@pytest.mark.django_db
def test_callback_lead_map_source_other(client):
    from api.models import CallbackLead

    r = client.post(
        "/api/leads/callback/",
        data={
            "name": "Пётр",
            "phone": "89991234567",
            "comment": "",
            "leadSource": "other",
        },
        content_type="application/json",
    )
    assert r.status_code == 201
    lead = CallbackLead.objects.get(name="Пётр")
    assert lead.phone == "+79991234567"
    assert lead.source == CallbackLead.Source.OTHER


@pytest.mark.django_db
def test_callback_lead_honeypot_rejected(client):
    r = client.post(
        "/api/leads/callback/",
        data={
            "name": "Иван",
            "phone": "+79991234567",
            "comment": "",
            "website": "http://spam.test",
        },
        content_type="application/json",
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_callback_lead_invalid_phone(client):
    r = client.post(
        "/api/leads/callback/",
        data={"name": "Иван", "phone": "123", "comment": ""},
        content_type="application/json",
    )
    assert r.status_code == 400


@pytest.mark.django_db
def test_calculator_lead_create_normalizes_phone(client):
    from api.models import CalculatorLead

    r = client.post(
        "/api/leads/calculator/",
        data={
            "name": "Иван",
            "phone": "89991234567",
            "comment": "",
            "lengthM": 3,
            "widthM": 2,
            "materialId": "pvc",
            "materialLabel": "ПВХ",
            "options": [],
            "estimatedPriceRub": 10000,
        },
        content_type="application/json",
    )
    assert r.status_code == 201
    lead = CalculatorLead.objects.get(name="Иван")
    assert lead.phone == "+79991234567"


@pytest.mark.django_db
def test_cart_order_customer_honeypot_rejected(client):
    payload = {
        "customer": {
            "name": "Тест",
            "phone": "+79991234567",
            "email": "honeypot-lead@mail.ru",
            "website": "x",
        },
        "lines": [
            {
                "productId": "1",
                "slug": "x",
                "title": "Товар",
                "priceFrom": 1000,
                "qty": 1,
            }
        ],
        "totalApprox": 1000,
    }
    r = client.post("/api/leads/cart/", data=payload, content_type="application/json")
    assert r.status_code == 400


@pytest.mark.django_db
def test_home_content_public_merged(client):
    """Публичный /api/home-content/ отдаёт сохранённый payload (без полного merge с дефолтами)."""
    r = client.get("/api/home-content/")
    assert r.status_code == 200
    body = r.json()
    assert "home" in body
    home = body["home"]
    assert isinstance(home, dict)
    if home.get("meta"):
        assert isinstance(home["meta"], dict)
    if home.get("hero"):
        assert isinstance(home["hero"], dict)
    ps = home.get("problemSolution")
    if ps and isinstance(ps, dict) and "cards" in ps:
        assert isinstance(ps["cards"], list)


@pytest.mark.django_db
def test_register_and_me(client):
    r = client.post(
        "/api/auth/register/",
        data={
            "email": "buyer@example.com",
            "password": "secretpass1",
            "firstName": "Иван",
            "phone": "+79991112233",
        },
        content_type="application/json",
    )
    assert r.status_code == 201
    body = r.json()
    assert "access" in body and "refresh" in body
    token = body["access"]
    r2 = client.get("/api/auth/me/", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert r2.status_code == 200
    me = r2.json()
    assert me["email"] == "buyer@example.com"
    assert me["firstName"] == "Иван"
    assert me["phone"] == "+79991112233"
    assert me["isStaff"] is False
    assert me.get("passwordChangeDeadline") in (None, "")
    assert me.get("passwordChangeBlocking") is False


@patch(
    "api.services.customer_account_from_order.send_order_account_credentials_email",
    return_value=(True, None),
)
@pytest.mark.django_db
def test_cart_order_guest_with_email_creates_user_and_links_order(_mock_send, client):
    from django.contrib.auth import get_user_model

    from api.models import CartOrder
    email = "guest_order@yandex.ru"
    payload = {
        "customer": {"name": "Анна Покупатель", "phone": "+79997654321", "email": email},
        "lines": [
            {
                "productId": "1",
                "slug": "x",
                "title": "Товар",
                "priceFrom": 1000,
                "qty": 1,
            }
        ],
        "totalApprox": 1000,
    }
    r = client.post("/api/leads/cart/", data=payload, content_type="application/json")
    assert r.status_code == 201
    order_ref = r.json()["orderRef"]
    order = CartOrder.objects.get(order_ref=order_ref)
    assert order.user is not None
    assert order.user.username == email
    assert order.user.email == email
    prof = order.user.customer_profile
    assert prof.password_change_deadline is not None
    User = get_user_model()
    assert User.objects.filter(username__iexact=email).count() == 1
    _mock_send.assert_called_once()


@patch(
    "api.services.customer_account_from_order.send_order_account_credentials_email",
    return_value=(True, None),
)
@pytest.mark.django_db
def test_cart_order_second_guest_same_email_reuses_user(_mock_send, client):
    from django.contrib.auth import get_user_model
    email = "repeat_guest@mail.ru"
    base = {
        "customer": {"name": "Пётр", "phone": "+79997654321", "email": email},
        "lines": [
            {
                "productId": "1",
                "slug": "x",
                "title": "Товар",
                "priceFrom": 500,
                "qty": 1,
            }
        ],
        "totalApprox": 500,
    }
    r1 = client.post("/api/leads/cart/", data=base, content_type="application/json")
    assert r1.status_code == 201
    r2 = client.post("/api/leads/cart/", data=base, content_type="application/json")
    assert r2.status_code == 201
    User = get_user_model()
    assert User.objects.filter(username__iexact=email).count() == 1
    _mock_send.assert_called_once()


@pytest.mark.django_db
def test_cart_order_cdek_door_requires_address(client):
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.save(update_fields=["cdek_enabled"])

    payload = {
        "customer": {"name": "Курьер", "phone": "+79990002222", "email": "door@test.ru"},
        "lines": [{"productId": "1", "slug": "x", "title": "Товар", "priceFrom": 1000, "qty": 1}],
        "totalApprox": 1200,
        "deliveryMethod": "cdek",
        "paymentMethod": "cod_cdek",
        "delivery": {
            "city": "Москва",
            "cdek": {"mode": "door", "deliveryPriceRub": 200},
        },
    }
    r = client.post("/api/leads/cart/", data=payload, content_type="application/json")
    assert r.status_code == 400


@patch("api.services.cdek_order_create.sync_cdek_order_with_retry", return_value=(True, None))
@pytest.mark.django_db
def test_cart_order_cdek_triggers_cdek_order_creation(mock_cdek_create, client):
    from api.models import CartOrder, SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.save(update_fields=["cdek_enabled"])

    payload = {
        "customer": {"name": "СДЭК Клиент", "phone": "+79990001122", "email": "cdek@test.ru"},
        "lines": [{"productId": "1", "slug": "x", "title": "Товар", "priceFrom": 1000, "qty": 1}],
        "totalApprox": 1200,
        "deliveryMethod": "cdek",
        "paymentMethod": "cod_cdek",
        "delivery": {
            "city": "Москва",
            "cdek": {"mode": "office", "pvzCode": "MSK1", "deliveryPriceRub": 200, "tariffCode": 136},
        },
    }
    r = client.post("/api/leads/cart/", data=payload, content_type="application/json")
    assert r.status_code == 201
    order = CartOrder.objects.get(order_ref=r.json()["orderRef"])
    assert order.payment_status == CartOrder.PaymentStatus.PENDING
    mock_cdek_create.assert_called_once()


def _sync_side_effect_set_cdek_error(order):
    from api.models import CartOrder

    CartOrder.objects.filter(pk=order.pk).update(
        cdek_sync_status=CartOrder.CdekSyncStatus.ERROR,
        cdek_sync_error="HTTP 400: test",
    )
    return False, "HTTP 400: test"


@patch(
    "api.services.cdek_order_create.sync_cdek_order_with_retry",
    side_effect=_sync_side_effect_set_cdek_error,
)
@pytest.mark.django_db
def test_cart_order_cdek_response_includes_sync_error(mock_sync, client):
    from api.models import SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.save(update_fields=["cdek_enabled"])

    payload = {
        "customer": {"name": "СДЭК Клиент", "phone": "+79990003333", "email": "cdekerr@test.ru"},
        "lines": [{"productId": "1", "slug": "x", "title": "Товар", "priceFrom": 1000, "qty": 1}],
        "totalApprox": 1200,
        "deliveryMethod": "cdek",
        "paymentMethod": "cod_cdek",
        "delivery": {
            "city": "Москва",
            "cdek": {"mode": "office", "pvzCode": "MSK1", "deliveryPriceRub": 200, "tariffCode": 136},
        },
    }
    r = client.post("/api/leads/cart/", data=payload, content_type="application/json")
    assert r.status_code == 201
    data = r.json()
    assert data.get("cdekSync") is not None
    assert data["cdekSync"]["status"] == "error"
    assert "HTTP 400" in (data["cdekSync"].get("error") or "")
    mock_sync.assert_called_once()


@patch("api.services.cdek_order_create.sync_cdek_order_with_retry", return_value=(True, None))
@pytest.mark.django_db
def test_cart_order_cdek_total_includes_recipient_fee_when_configured(mock_cdek_create, client):
    from api.models import CartOrder, SiteSettings

    s = SiteSettings.get_solo()
    s.cdek_enabled = True
    s.cdek_recipient_delivery_fee_mode = SiteSettings.CdekRecipientDeliveryFeeMode.FIXED
    s.cdek_recipient_delivery_fee_fixed_rub = 120
    s.save(
        update_fields=[
            "cdek_enabled",
            "cdek_recipient_delivery_fee_mode",
            "cdek_recipient_delivery_fee_fixed_rub",
        ]
    )

    payload = {
        "customer": {"name": "СДЭК Клиент", "phone": "+79990001122", "email": "cdek2@test.ru"},
        "lines": [{"productId": "1", "slug": "x", "title": "Товар", "priceFrom": 1000, "qty": 1}],
        "totalApprox": 1320,
        "deliveryMethod": "cdek",
        "paymentMethod": "cod_cdek",
        "delivery": {
            "city": "Москва",
            "cdek": {"mode": "office", "pvzCode": "MSK1", "deliveryPriceRub": 200, "tariffCode": 136},
        },
    }
    r = client.post("/api/leads/cart/", data=payload, content_type="application/json")
    assert r.status_code == 201
    order = CartOrder.objects.get(order_ref=r.json()["orderRef"])
    assert order.total_approx == 1320
    assert isinstance(order.delivery_snapshot, dict)
    cdek = order.delivery_snapshot.get("cdek")
    assert isinstance(cdek, dict)
    assert cdek.get("recipientFeeRub") == 120
    mock_cdek_create.assert_called_once()


@patch("api.views_checkout.verify_notification_request_sign", return_value=True)
@patch("api.services.cdek_order_create.sync_cdek_order_with_retry", return_value=(True, None))
@pytest.mark.django_db
def test_ozon_webhook_completed_triggers_cdek_sync(mock_sync, _mock_sign, client):
    from api.models import CartOrder, SiteSettings

    s = SiteSettings.get_solo()
    s.ozon_pay_client_id = "ack"
    s.ozon_pay_webhook_secret = "sec"
    s.save(update_fields=["ozon_pay_client_id", "ozon_pay_webhook_secret"])

    co = CartOrder.objects.create(
        order_ref="ORD-WEBHOOK-1",
        customer_name="Онлайн Клиент",
        customer_phone="+79990001122",
        customer_email="ok@shop.ru",
        lines=[{"title": "x", "priceFrom": 1000, "qty": 1}],
        total_approx=1300,
        delivery_method=CartOrder.DeliveryMethod.CDEK,
        payment_method=CartOrder.PaymentMethod.CARD_ONLINE,
        payment_status=CartOrder.PaymentStatus.PENDING,
        fulfillment_status=CartOrder.FulfillmentStatus.AWAITING_PAYMENT,
        manager_letter="m",
        client_ack="c",
    )
    payload = {
        "requestSign": "ok",
        "extOrderID": co.order_ref,
        "status": "Completed",
        "orderID": "oz-123",
    }
    r = client.post("/api/webhooks/ozon-pay/", data=payload, content_type="application/json")
    assert r.status_code == 200
    co.refresh_from_db()
    assert co.payment_status == CartOrder.PaymentStatus.CAPTURED
    assert co.fulfillment_status == CartOrder.FulfillmentStatus.PAID
    mock_sync.assert_called_once()


@patch("api.views_checkout.verify_notification_request_sign", return_value=True)
@patch("api.services.cdek_order_create.sync_cdek_order_with_retry", return_value=(True, None))
@pytest.mark.django_db
def test_ozon_webhook_non_completed_does_not_trigger_cdek_sync(mock_sync, _mock_sign, client):
    from api.models import CartOrder, SiteSettings

    s = SiteSettings.get_solo()
    s.ozon_pay_client_id = "ack"
    s.ozon_pay_webhook_secret = "sec"
    s.save(update_fields=["ozon_pay_client_id", "ozon_pay_webhook_secret"])

    co = CartOrder.objects.create(
        order_ref="ORD-WEBHOOK-2",
        customer_name="Онлайн Клиент",
        customer_phone="+79990001122",
        customer_email="ok2@shop.ru",
        lines=[{"title": "x", "priceFrom": 1000, "qty": 1}],
        total_approx=1300,
        delivery_method=CartOrder.DeliveryMethod.CDEK,
        payment_method=CartOrder.PaymentMethod.CARD_ONLINE,
        payment_status=CartOrder.PaymentStatus.PENDING,
        fulfillment_status=CartOrder.FulfillmentStatus.AWAITING_PAYMENT,
        manager_letter="m",
        client_ack="c",
    )
    payload = {
        "requestSign": "ok",
        "extOrderID": co.order_ref,
        "status": "Authorized",
        "orderID": "oz-124",
    }
    r = client.post("/api/webhooks/ozon-pay/", data=payload, content_type="application/json")
    assert r.status_code == 200
    co.refresh_from_db()
    assert co.payment_status == CartOrder.PaymentStatus.AUTHORIZED
    mock_sync.assert_not_called()


@patch("api.services.notification_email.send_buyer_order_confirmation_email")
@patch("api.services.cdek_order_create.sync_cdek_order_with_retry", return_value=(True, None))
@patch("api.views_checkout.verify_notification_request_sign", return_value=True)
@pytest.mark.django_db
def test_ozon_webhook_completed_idempotent_on_repeat(
    _mock_sign, mock_sync, mock_send, client,
):
    from api.models import CartOrder, SiteSettings

    s = SiteSettings.get_solo()
    s.ozon_pay_client_id = "ack"
    s.ozon_pay_webhook_secret = "sec"
    s.save(update_fields=["ozon_pay_client_id", "ozon_pay_webhook_secret"])

    co = CartOrder.objects.create(
        order_ref="ORD-WEBHOOK-DUP",
        customer_name="Онлайн Клиент",
        customer_phone="+79990001122",
        customer_email="dup@shop.ru",
        lines=[{"title": "x", "priceFrom": 1000, "qty": 1}],
        total_approx=1300,
        delivery_method=CartOrder.DeliveryMethod.CDEK,
        payment_method=CartOrder.PaymentMethod.CARD_ONLINE,
        payment_status=CartOrder.PaymentStatus.PENDING,
        fulfillment_status=CartOrder.FulfillmentStatus.AWAITING_PAYMENT,
        manager_letter="m",
        client_ack="c",
    )
    payload = {
        "requestSign": "ok",
        "extOrderID": co.order_ref,
        "status": "Completed",
        "orderID": "oz-555",
    }
    assert client.post("/api/webhooks/ozon-pay/", data=payload, content_type="application/json").status_code == 200
    assert client.post("/api/webhooks/ozon-pay/", data=payload, content_type="application/json").status_code == 200
    mock_sync.assert_called_once()
    mock_send.assert_called_once()


@patch("api.views_checkout.verify_notification_request_sign", return_value=True)
@pytest.mark.django_db
def test_ozon_webhook_extorderid_alias(_mock_sign, client):
    from api.models import CartOrder, SiteSettings

    s = SiteSettings.get_solo()
    s.ozon_pay_client_id = "ack"
    s.ozon_pay_webhook_secret = "sec"
    s.save(update_fields=["ozon_pay_client_id", "ozon_pay_webhook_secret"])

    co = CartOrder.objects.create(
        order_ref="ORD-EXT-ORDER-ID",
        customer_name="A",
        customer_phone="+1",
        customer_email="a@a.ru",
        lines=[{"title": "x", "priceFrom": 100, "qty": 1}],
        total_approx=100,
        delivery_method=CartOrder.DeliveryMethod.PICKUP,
        payment_method=CartOrder.PaymentMethod.CARD_ONLINE,
        payment_status=CartOrder.PaymentStatus.PENDING,
        fulfillment_status=CartOrder.FulfillmentStatus.AWAITING_PAYMENT,
        manager_letter="m",
        client_ack="c",
    )
    r = client.post(
        "/api/webhooks/ozon-pay/",
        data={
            "requestSign": "ok",
            "extOrderId": co.order_ref,
            "status": "Completed",
            "orderID": "oz-999",
        },
        content_type="application/json",
    )
    assert r.status_code == 200
    co.refresh_from_db()
    assert co.payment_status == CartOrder.PaymentStatus.CAPTURED
    assert co.payment_external_id == "oz-999"


@pytest.mark.django_db
def test_password_deadline_overdue_blocks_orders_not_me_or_change_password(client):
    from datetime import timedelta

    from django.contrib.auth import get_user_model
    from django.utils import timezone
    from rest_framework_simplejwt.tokens import RefreshToken

    from api.models import CustomerProfile

    User = get_user_model()
    user = User.objects.create_user(username="late@example.com", email="late@example.com", password="oldpass12")
    prof = CustomerProfile.objects.create(
        user=user,
        password_change_deadline=timezone.now() - timedelta(days=1),
    )
    token = str(RefreshToken.for_user(user).access_token)
    auth = f"Bearer {token}"

    r_me = client.get("/api/auth/me/", HTTP_AUTHORIZATION=auth)
    assert r_me.status_code == 200
    assert r_me.json().get("passwordChangeBlocking") is True

    r_orders = client.get("/api/orders/", HTTP_AUTHORIZATION=auth)
    assert r_orders.status_code == 403

    r_cp = client.post(
        "/api/auth/change-password/",
        data={"oldPassword": "wrong", "newPassword": "newsecure1"},
        content_type="application/json",
        HTTP_AUTHORIZATION=auth,
    )
    assert r_cp.status_code == 400

    r_cp_ok = client.post(
        "/api/auth/change-password/",
        data={"oldPassword": "oldpass12", "newPassword": "newsecure1"},
        content_type="application/json",
        HTTP_AUTHORIZATION=auth,
    )
    assert r_cp_ok.status_code == 200
    prof.refresh_from_db()
    assert prof.password_change_deadline is None

    r_orders2 = client.get("/api/orders/", HTTP_AUTHORIZATION=auth)
    assert r_orders2.status_code == 200


@pytest.mark.django_db
def test_customer_order_list_includes_russian_status_labels(client):
    from django.contrib.auth import get_user_model

    from rest_framework_simplejwt.tokens import RefreshToken

    from api.models import CartOrder

    User = get_user_model()
    user = User.objects.create_user(
        username="buyerlabels@example.com",
        email="buyerlabels@example.com",
        password="pass12345",
    )
    CartOrder.objects.create(
        order_ref="TEST-LABEL-1",
        user=user,
        customer_name="Иван",
        customer_phone="+79990001122",
        lines=[],
        total_approx=0,
        fulfillment_status=CartOrder.FulfillmentStatus.PROCESSING,
        payment_status=CartOrder.PaymentStatus.NOT_REQUIRED,
    )
    token = str(RefreshToken.for_user(user).access_token)
    r = client.get("/api/orders/", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    row = data[0]
    assert row["fulfillmentStatusLabel"] == "В обработке"
    assert row["paymentStatusLabel"] == "Оплата не требовалась"


@patch("api.services.cdek_order_create.sync_cdek_order_with_retry", return_value=(True, None))
@pytest.mark.django_db
def test_retry_cdek_sync_command_includes_cod_cdek(mock_sync):
    from django.core.management import call_command

    from api.models import CartOrder

    CartOrder.objects.create(
        order_ref="RETRY-COD-1",
        customer_name="Тест",
        customer_phone="+79990004444",
        customer_email="retry_cod@test.ru",
        lines=[{"title": "Товар", "priceFrom": 500, "qty": 1}],
        total_approx=800,
        goods_subtotal_approx=500,
        delivery_method=CartOrder.DeliveryMethod.CDEK,
        payment_method=CartOrder.PaymentMethod.COD_CDEK,
        payment_status=CartOrder.PaymentStatus.PENDING,
        cdek_sync_status=CartOrder.CdekSyncStatus.ERROR,
    )
    call_command("retry_cdek_sync", limit=10)
    mock_sync.assert_called_once()
