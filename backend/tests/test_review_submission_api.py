import pytest


@pytest.mark.django_db
def test_public_review_submission_creates_unpublished_moderation_item(client):
    payload = {
        "name": "Иван Петров",
        "city": "Краснодар",
        "reviewedOn": "2026-04-10",
        "text": "Сделали тент быстро, аккуратно и в обещанные сроки. Результатом полностью доволен.",
        "publicationConsent": True,
        "website": "",
    }
    r = client.post("/api/leads/review/", data=payload, content_type="application/json")
    assert r.status_code == 201, r.content

    from api.models import Review

    rv = Review.objects.get()
    assert rv.name == "Иван Петров"
    assert rv.city == "Краснодар"
    assert rv.publication_consent is True
    assert rv.submitted_from_site is True
    assert rv.is_moderated is False
    assert rv.is_published is False


@pytest.mark.django_db
def test_public_review_submission_requires_consent(client):
    payload = {
        "name": "Иван Петров",
        "city": "Краснодар",
        "reviewedOn": "2026-04-10",
        "text": "Сделали тент быстро, аккуратно и в обещанные сроки. Результатом полностью доволен.",
        "publicationConsent": False,
        "website": "",
    }
    r = client.post("/api/leads/review/", data=payload, content_type="application/json")
    assert r.status_code == 400
    body = r.json()
    assert "publicationConsent" in body
