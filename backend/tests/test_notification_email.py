from email.header import decode_header
from email.utils import parseaddr

import pytest


def _decode_mime_phrase(s: str) -> str:
    parts = decode_header(s)
    chunks: list[str] = []
    for chunk, enc in parts:
        if isinstance(chunk, bytes):
            chunks.append(chunk.decode(enc or "utf-8"))
        else:
            chunks.append(chunk)
    return "".join(chunks)


@pytest.mark.django_db
def test_outbound_from_plain_email():
    from api.models import SiteSettings
    from api.services.notification_email import outbound_from_address

    s = SiteSettings.get_solo()
    s.email = "contact@example.com"
    s.email_outbound_from = "send@fabrika-tent.ru"
    s.save()
    assert outbound_from_address(s) == "send@fabrika-tent.ru"


@pytest.mark.django_db
def test_outbound_from_display_name_only_combines_with_contact_email():
    from api.models import SiteSettings
    from api.services.notification_email import outbound_from_address

    s = SiteSettings.get_solo()
    s.email = "sale@fabrika-tent.ru"
    # Unicode escapes — стабильно при любой кодировке исходника теста на диске
    s.email_outbound_from = "\u0424\u0430\u0431\u0440\u0438\u043a\u0430 \u0422\u0435\u043d\u0442\u043e\u0432"
    s.save()
    out = outbound_from_address(s)
    name, addr = parseaddr(out)
    assert addr == "sale@fabrika-tent.ru"
    assert _decode_mime_phrase(name) == s.email_outbound_from


@pytest.mark.django_db
def test_outbound_from_empty_uses_contact_email():
    from api.models import SiteSettings
    from api.services.notification_email import outbound_from_address

    s = SiteSettings.get_solo()
    s.email = "hello@example.com"
    s.email_outbound_from = ""
    s.save()
    assert outbound_from_address(s) == "hello@example.com"


@pytest.mark.django_db
def test_outbound_from_display_only_without_contact_email_returns_empty():
    from api.models import SiteSettings
    from api.services.notification_email import outbound_from_address

    s = SiteSettings.get_solo()
    s.email = ""
    s.email_outbound_from = "Только название"
    s.save()
    assert outbound_from_address(s) == ""


@pytest.mark.django_db
def test_email_template_fill_and_effective_defaults():
    from api.models import SiteEmailTemplate
    from api.services.email_templates import effective_subject_body, fill_placeholders

    subj, body = effective_subject_body("smtp_test")
    assert "{site_name}" in subj
    out = fill_placeholders(subj, site_name="Мой сайт")
    assert "Мой сайт" in out
    assert "{site_name}" not in out

    row = SiteEmailTemplate.objects.get(key="smtp_test")
    row.subject = "Привет, {site_name}!"
    row.save()
    subj2, _ = effective_subject_body("smtp_test")
    assert fill_placeholders(subj2, site_name="X") == "Привет, X!"


@pytest.mark.django_db
def test_outbound_from_rfc_angle_brackets():
    from api.models import SiteSettings
    from api.services.notification_email import outbound_from_address

    s = SiteSettings.get_solo()
    s.email = "other@example.com"
    s.email_outbound_from = '"Фабрика Тентов" <send@fabrika-tent.ru>'
    s.save()
    out = outbound_from_address(s)
    assert "send@fabrika-tent.ru" in out
