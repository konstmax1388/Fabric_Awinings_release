"""
Блоки формы «Настройки сайта» в админке: стабильные slug для якорей и бокового меню.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _

# Порядок = порядок fieldsets и пунктов в сайдбаре.
SECTIONS: dict[str, dict[str, Any]] = {
    "logo": {"title": _("Логотип и фавикон"), "icon": "imagesmode"},
    "branding": {"title": _("Название сайта и тексты подвала"), "icon": "title"},
    "contacts": {"title": _("Контакты на витрине"), "icon": "call"},
    "smtp": {"title": _("Почта: заявки с сайта (SMTP)"), "icon": "mail"},
    "crm_astrum": {
        "title": _("Битрикс24: заявки с сайта (Astrum)"),
        "icon": "sync_alt",
    },
    "crm_bitrix_catalog": {
        "title": _("Битрикс24: REST каталог (синхронизация ID)"),
        "icon": "inventory_2",
    },
    "social": {"title": _("Подвал: соцсети"), "icon": "share"},
    "contacts_page": {"title": _("Страница «Контакты» (/contacts)"), "icon": "contact_page"},
    "calculator": {"title": _("Калькулятор на главной"), "icon": "calculate"},
    "catalog": {"title": _("Каталог (/catalog)"), "icon": "storefront"},
    "mp_show": {"title": _("Маркетплейсы: что показывать"), "icon": "shopping_bag"},
    "mp_urls": {"title": _("Маркетплейсы: общие ссылки на витрины"), "icon": "link"},
}

SECTION_ORDER: tuple[str, ...] = tuple(SECTIONS.keys())

# Поля модели SiteSettings на блок (отдельная страница админки, не якорь).
SECTION_FIELDS: dict[str, tuple[str, ...]] = {
    "logo": ("logo", "favicon"),
    "branding": ("site_name", "site_tagline", "footer_note"),
    "contacts": ("phone_display", "phone_href", "email", "address", "legal"),
    "smtp": (
        "notification_recipients",
        "smtp_enabled",
        "smtp_host",
        "smtp_port",
        "smtp_use_tls",
        "smtp_use_ssl",
        "smtp_user",
        "smtp_password",
        "email_outbound_from",
    ),
    "crm_astrum": (
        "astrum_crm_enabled",
        "astrum_crm_api_key",
        "astrum_crm_assigned_default",
        "astrum_crm_api_url",
        "astrum_crm_contact_behavior",
        "astrum_crm_entity_behavior",
        "astrum_crm_deal_title_prefix",
        "astrum_crm_timeout_seconds",
    ),
    "crm_bitrix_catalog": (
        "bitrix24_webhook_base",
        "bitrix24_catalog_product_iblock_id",
        "bitrix24_catalog_offer_iblock_id",
    ),
    "social": ("show_social_links", "footer_vk_url", "footer_telegram_url"),
    "contacts_page": (
        "contacts_page_title",
        "contacts_intro",
        "contacts_hours",
        "contacts_meta_description",
        "contacts_back_link_label",
    ),
    "calculator": ("show_calculator",),
    "catalog": ("catalog_intro", "product_photo_aspect"),
    "mp_show": (
        "show_marketplace_wb",
        "show_marketplace_ozon",
        "show_marketplace_ym",
        "show_marketplace_avito",
    ),
    "mp_urls": ("global_url_wb", "global_url_ozon", "global_url_ym", "global_url_avito"),
}


def ss_fieldset(slug: str, fieldset_options: dict[str, Any]) -> tuple[Any, dict[str, Any]]:
    """Fieldset для SiteSettingsAdmin: добавляет класс fs-id-<slug> для якоря."""
    if slug not in SECTIONS:
        raise KeyError(f"Unknown site settings section slug: {slug}")
    opts = {**fieldset_options}
    classes: Sequence[str] | str = opts.get("classes") or ()
    if isinstance(classes, str):
        classes = (classes,)
    opts["classes"] = tuple(classes) + (f"fs-id-{slug}",)
    return (SECTIONS[slug]["title"], opts)


def site_settings_sidebar_block_items() -> list[dict[str, Any]]:
    """Пункты меню «Настройки сайта» → отдельная страница блока.

    Ссылки через reverse_lazy (не callable), иначе Unfold помечает active до resolve
    ссылки и подсветка/раскрытие группы не работают.
    """
    items: list[dict[str, Any]] = []
    for slug in SECTION_ORDER:
        meta = SECTIONS[slug]
        items.append(
            {
                "title": meta["title"],
                "icon": meta["icon"],
                "link": reverse_lazy(
                    "admin:api_sitesettings_section", kwargs={"slug": slug}
                ),
            }
        )
    return items
