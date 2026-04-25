from __future__ import annotations

import re

import bleach

ALLOWED_TAGS = [
    "a",
    "abbr",
    "b",
    "blockquote",
    "br",
    "code",
    "div",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "span",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
]

ALLOWED_ATTRS = {
    "*": ["title"],
    "a": ["href", "target", "rel"],
    "img": ["src", "alt", "width", "height", "loading", "decoding"],
    "th": ["colspan", "rowspan", "scope"],
    "td": ["colspan", "rowspan"],
}

ALLOWED_PROTOCOLS = ["http", "https", "mailto", "tel"]


def _yandex_embed_host_ok(url: str) -> bool:
    u = (url or "").strip().lower()
    if not u.startswith("https://") and not u.startswith("http://"):
        return False
    for h in (
        "yandex.ru",
        "yandex.com",
        "yastatic.net",
        "yandex.net",
        "ymaps.ru",
        "webvisor.com",
    ):
        if h in u:
            return True
    return False


def sanitize_reviews_embed_html(value: str) -> str:
    """Виджет отзывов Яндекса: iframe/script только с доверенных хостов."""
    raw = (value or "").strip()
    if not raw:
        return ""
    tags = list(ALLOWED_TAGS) + ["iframe", "script", "div"]
    attrs = {
        **ALLOWED_ATTRS,
        "iframe": [
            "src",
            "width",
            "height",
            "title",
            "loading",
            "class",
            "frameborder",
            "allow",
            "allowfullscreen",
            "style",
        ],
        "script": ["src", "async", "defer", "type", "charset", "id"],
    }
    cleaned = bleach.clean(
        raw,
        tags=tags,
        attributes=attrs,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
    )
    if re.search(r"<script(?![^>]*\bsrc=)", cleaned, re.I):
        return ""
    for m in re.finditer(r"<iframe[^>]+src=[\"']([^\"']+)[\"']", cleaned, re.I):
        if not _yandex_embed_host_ok(m.group(1)):
            return ""
    for m in re.finditer(r"<script[^>]+src=[\"']([^\"']+)[\"']", cleaned, re.I):
        if not _yandex_embed_host_ok(m.group(1)):
            return ""
    return cleaned


def sanitize_html_fragment(value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    cleaned = bleach.clean(
        raw,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=ALLOWED_PROTOCOLS,
        strip=True,
    )
    return bleach.linkify(
        cleaned,
        callbacks=[bleach.callbacks.nofollow, bleach.callbacks.target_blank],
        skip_tags=["pre", "code"],
    )
