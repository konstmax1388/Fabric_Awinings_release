import pytest


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
    from api.models import Product

    Product.objects.create(
        slug="test-item",
        title="Test",
        excerpt="",
        description="",
        category="truck",
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
