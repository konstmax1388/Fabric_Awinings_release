import pytest


@pytest.mark.django_db
def test_log_consent_creates_row(client):
    from api.models import ConsentLog

    payload = {
        "consent": True,
        "timestamp": "2026-04-22T12:00:00Z",
        "policy_version": "2026-04-22",
        "url": "https://fabrika-tentov.ru/catalog",
    }
    resp = client.post(
        "/api/log-consent/",
        data=payload,
        content_type="application/json",
        HTTP_X_REQUESTED_WITH="XMLHttpRequest",
        HTTP_X_FORWARDED_FOR="203.0.113.15, 127.0.0.1",
        HTTP_USER_AGENT="pytest-agent",
    )
    assert resp.status_code == 201
    row = ConsentLog.objects.get()
    assert row.consent_value is True
    assert row.policy_version == "2026-04-22"
    assert row.ip_address == "203.0.113.15"
    assert row.user_agent == "pytest-agent"


@pytest.mark.django_db
def test_current_policy_version_endpoint(client, settings):
    settings.CURRENT_POLICY_VERSION = "2026-04-30"
    resp = client.get("/api/current-policy-version/")
    assert resp.status_code == 200
    assert resp.json()["version"] == "2026-04-30"
