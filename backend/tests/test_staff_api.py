"""Тесты Staff API (/api/staff/v1/)."""

import pytest
from django.contrib.auth import get_user_model


@pytest.mark.django_db
def test_staff_token_rejects_non_staff(client):
    User = get_user_model()
    User.objects.create_user(username="u1", email="u1@example.com", password="pass12345", is_staff=False)
    r = client.post(
        "/api/staff/v1/auth/token/",
        data={"username": "u1", "password": "pass12345"},
        content_type="application/json",
    )
    assert r.status_code == 400
    body = r.json()
    assert "detail" in body or "non_field_errors" in body


@pytest.mark.django_db
def test_staff_token_ok_for_staff(client):
    User = get_user_model()
    User.objects.create_user(
        username="staff1",
        email="staff1@example.com",
        password="staffpass12",
        is_staff=True,
    )
    r = client.post(
        "/api/staff/v1/auth/token/",
        data={"username": "staff1", "password": "staffpass12"},
        content_type="application/json",
    )
    assert r.status_code == 200
    data = r.json()
    assert "access" in data and "refresh" in data


@pytest.mark.django_db
def test_staff_callback_leads_requires_auth(client):
    r = client.get("/api/staff/v1/leads/callback/")
    assert r.status_code == 401


@pytest.mark.django_db
def test_staff_metrics_requires_staff_user(client):
    from rest_framework_simplejwt.tokens import RefreshToken

    User = get_user_model()
    user = User.objects.create_user(
        username="buyer2",
        email="buyer2@example.com",
        password="pass12345",
        is_staff=False,
    )
    token = str(RefreshToken.for_user(user).access_token)
    r = client.get("/api/staff/v1/metrics/overview/", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert r.status_code == 403


@pytest.mark.django_db
def test_staff_callback_leads_list_and_metrics(client):
    from api.models import CallbackLead
    from rest_framework_simplejwt.tokens import RefreshToken

    CallbackLead.objects.create(name="Тест", phone="+79990001122", comment="", source=CallbackLead.Source.HERO)

    User = get_user_model()
    staff = User.objects.create_user(
        username="staff2",
        email="staff2@example.com",
        password="staffpass12",
        is_staff=True,
    )
    token = str(RefreshToken.for_user(staff).access_token)

    r = client.get("/api/staff/v1/metrics/overview/", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert r.status_code == 200
    m = r.json()
    assert m["callbackLeads"]["total"] >= 1
    assert "orders" in m

    r2 = client.get("/api/staff/v1/leads/callback/", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert r2.status_code == 200
    body = r2.json()
    assert "results" in body and "count" in body
    assert len(body["results"]) >= 1
    row = body["results"][0]
    assert row["name"] == "Тест"
    assert "createdAt" in row
    assert row["id"]

    rid = row["id"]
    r3 = client.get(f"/api/staff/v1/leads/callback/{rid}/", HTTP_AUTHORIZATION=f"Bearer {token}")
    assert r3.status_code == 200
    assert r3.json()["phone"] == "+79990001122"


@pytest.mark.django_db
def test_staff_pagination_params(client):
    from rest_framework_simplejwt.tokens import RefreshToken

    User = get_user_model()
    staff = User.objects.create_user(
        username="staff3",
        email="staff3@example.com",
        password="staffpass12",
        is_staff=True,
    )
    token = str(RefreshToken.for_user(staff).access_token)
    r = client.get(
        "/api/staff/v1/leads/callback/?page=1&pageSize=10",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert r.status_code == 200


@pytest.mark.django_db
def test_staff_cart_orders_list(client):
    """Список заказов для панели /staff (GET /api/staff/v1/orders/)."""
    from api.models import CartOrder
    from rest_framework_simplejwt.tokens import RefreshToken

    CartOrder.objects.create(
        order_ref="STAFF-LIST-1",
        customer_name="Иван",
        customer_phone="+79990001133",
        customer_email="ivan@example.com",
        lines=[{"title": "Тент", "qty": 1, "priceFrom": 1000}],
        total_approx=1000,
        fulfillment_status=CartOrder.FulfillmentStatus.RECEIVED,
        payment_status=CartOrder.PaymentStatus.NOT_REQUIRED,
        delivery_method=CartOrder.DeliveryMethod.PICKUP,
        payment_method=CartOrder.PaymentMethod.CASH_PICKUP,
    )

    User = get_user_model()
    staff = User.objects.create_user(
        username="staff_orders",
        email="staff_orders@example.com",
        password="staffpass12",
        is_staff=True,
    )
    token = str(RefreshToken.for_user(staff).access_token)
    r = client.get(
        "/api/staff/v1/orders/?page=1&pageSize=25&ordering=-created_at",
        HTTP_AUTHORIZATION=f"Bearer {token}",
    )
    assert r.status_code == 200, r.content[:500]
    body = r.json()
    assert "results" in body and "count" in body
    assert body["count"] >= 1
    row = next(x for x in body["results"] if x.get("orderRef") == "STAFF-LIST-1")
    assert row["customerPhone"] == "+79990001133"
    assert row["fulfillmentStatus"] == "received"
