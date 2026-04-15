"""Загрузка шаблонов писем из БД и подстановка плейсхолдеров."""

from __future__ import annotations

import logging

from api.email_template_defaults import DEFAULT_EMAIL_TEMPLATES

logger = logging.getLogger(__name__)


def fill_placeholders(template: str, **kwargs: str) -> str:
    """Подставляет {ключ} из kwargs; неизвестные фрагменты {…} оставляет как есть."""
    if not template:
        return ""
    out = template
    for k, v in kwargs.items():
        out = out.replace("{" + k + "}", str(v))
    return out


def effective_subject_body(key: str) -> tuple[str, str]:
    """Тема и текст из SiteEmailTemplate или дефолты из email_template_defaults."""
    from api.models import SiteEmailTemplate

    d = DEFAULT_EMAIL_TEMPLATES[key]
    try:
        row = SiteEmailTemplate.objects.get(key=key)
    except SiteEmailTemplate.DoesNotExist:
        logger.warning("SiteEmailTemplate %s отсутствует, используются встроенные дефолты", key)
        return d["subject"], d["body"]
    subj = (row.subject or "").strip() or d["subject"]
    body = (row.body or "").strip() or d["body"]
    return subj, body
