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
        "customer": {"name": "Пётр", "phone": "+79997654321"},
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


@patch("api.services.notification_email.send_buyer_order_confirmation_email")
@pytest.mark.django_db
def test_cart_order_with_email_triggers_buyer_confirmation(mock_send, client):
    payload = {
        "customer": {
            "name": "Пётр",
            "phone": "+79997654321",
            "email": "buyer_confirm_test@example.com",
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
        "showSocialLinks",
        "productPhotoAspect",
        "catalogIntro",
    ):
        assert key in body
    assert body["productPhotoAspect"] in ("portrait_3_4", "square")


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
    r = client.get("/api/home-content/")
    assert r.status_code == 200
    body = r.json()
    assert "home" in body
    home = body["home"]
    assert home.get("meta", {}).get("title")
    assert home.get("hero", {}).get("title")
    assert isinstance(home.get("problemSolution", {}).get("cards"), list)


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
    email = "guest_order@example.com"
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


@patch(
    "api.services.customer_account_from_order.send_order_account_credentials_email",
    return_value=(True, None),
)
@pytest.mark.django_db
def test_cart_order_second_guest_same_email_reuses_user(_mock_send, client):
    from django.contrib.auth import get_user_model
    email = "repeat@example.com"
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
