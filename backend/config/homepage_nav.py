"""
Блоки формы «Главная страница (контент)»: якоря и пункты сайдбара.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _

# slug → заголовок fieldset в админке, короткий заголовок в меню, иконка Material Symbols.
SECTIONS: dict[str, dict[str, Any]] = {
    "meta": {
        "title": _("SEO и микроразметка (главная)"),
        "nav": _("SEO и микроразметка"),
        "icon": "travel_explore",
    },
    "hero": {
        "title": _("Блок «Hero» (первый экран)"),
        "nav": _("Hero (первый экран)"),
        "icon": "imagesmode",
    },
    "ps": {
        "title": _("Блок «Проблема — решение» (4 карточки)"),
        "nav": _("Проблема — решение"),
        "icon": "quiz",
    },
    "tent": {
        "title": _("Блок «Виды тентов»"),
        "nav": _("Виды тентов"),
        "icon": "category",
    },
    "feat": {
        "title": _("Блок «Подборка на главной»"),
        "nav": _("Подборка на главной"),
        "icon": "star",
    },
    "calc": {
        "title": _("Блок «Калькулятор»"),
        "nav": _("Калькулятор"),
        "icon": "calculate",
    },
    "port": {
        "title": _("Блок «Портфолио»"),
        "nav": _("Портфолио"),
        "icon": "photo_camera",
    },
    "why": {
        "title": _("Блок «Почему мы» (счётчики и 4 колонки)"),
        "nav": _("Почему мы"),
        "icon": "bolt",
    },
    "rev": {
        "title": _("Блок «Отзывы»"),
        "nav": _("Отзывы"),
        "icon": "reviews",
    },
    "blog": {
        "title": _("Блок «Блог» (превью на главной)"),
        "nav": _("Блог (превью)"),
        "icon": "article",
    },
    "map": {
        "title": _("Блок «Карта и форма» (главная и /contacts)"),
        "nav": _("Карта и форма"),
        "icon": "map",
    },
    "ui": {
        "title": _("Интерфейс (шапка и подборка)"),
        "nav": _("Интерфейс витрины"),
        "icon": "tune",
    },
}

SECTION_ORDER: tuple[str, ...] = tuple(SECTIONS.keys())

# Виртуальные поля формы главной (+ hero_background модели) по блокам.
SECTION_FIELDS: dict[str, tuple[str, ...]] = {
    "meta": ("meta_title", "meta_description", "meta_org_name", "meta_org_description"),
    "hero": (
        "hero_title",
        "hero_subtitle",
        "hero_cta_primary",
        "hero_primary_action",
        "hero_primary_href",
        "hero_cta_secondary",
        "hero_secondary_action",
        "hero_secondary_href",
        "hero_cb_title",
        "hero_cb_name_label",
        "hero_cb_phone_label",
        "hero_cb_submit",
        "hero_cb_submitting",
        "hero_cb_success",
        "hero_background",
    ),
    "ps": (
        "ps_heading",
        "ps_subheading",
        "ps0_problem",
        "ps0_solution",
        "ps0_icon_kind",
        "ps0_icon",
        "ps0_fa_preset",
        "ps0_fontawesome",
        "ps0_icon_image",
        "ps1_problem",
        "ps1_solution",
        "ps1_icon_kind",
        "ps1_icon",
        "ps1_fa_preset",
        "ps1_fontawesome",
        "ps1_icon_image",
        "ps2_problem",
        "ps2_solution",
        "ps2_icon_kind",
        "ps2_icon",
        "ps2_fa_preset",
        "ps2_fontawesome",
        "ps2_icon_image",
        "ps3_problem",
        "ps3_solution",
        "ps3_icon_kind",
        "ps3_icon",
        "ps3_fa_preset",
        "ps3_fontawesome",
        "ps3_icon_image",
    ),
    "tent": ("tt_heading", "tt_subheading"),
    "feat": ("feat_heading", "feat_subheading", "feat_catalog_cta"),
    "calc": (
        "calc_heading",
        "calc_subheading",
        "calc_length_label",
        "calc_width_label",
        "calc_material_label",
        "calc_options_label",
        "calc_estimate_label",
        "calc_estimate_note",
        "calc_name_label",
        "calc_phone_label",
        "calc_comment_label",
        "calc_name_placeholder",
        "calc_phone_placeholder",
        "calc_comment_placeholder",
        "calc_submit_button",
        "calc_submitting",
        "calc_success_message",
    ),
    "port": (
        "port_heading",
        "port_subheading",
        "port_filters",
        "port_loading",
        "port_empty",
        "port_all_cta",
    ),
    "why": (
        "why_heading",
        "why_subheading",
        "why_s0_value",
        "why_s0_suffix",
        "why_s0_label",
        "why_s1_value",
        "why_s1_suffix",
        "why_s1_label",
        "why_s2_value",
        "why_s2_suffix",
        "why_s2_label",
        "why_c0_title",
        "why_c0_text",
        "why_c0_icon",
        "why_c1_title",
        "why_c1_text",
        "why_c1_icon",
        "why_c2_title",
        "why_c2_text",
        "why_c2_icon",
        "why_c3_title",
        "why_c3_text",
        "why_c3_icon",
    ),
    "rev": ("rev_heading", "rev_subheading", "rev_loading", "rev_video_caption"),
    "blog": (
        "blog_heading",
        "blog_subheading",
        "blog_all_link",
        "blog_read_more",
        "blog_loading",
    ),
    "map": (
        "map_heading",
        "map_subheading",
        "map_iframe_src",
        "map_title",
        "map_form_name_label",
        "map_form_phone_label",
        "map_form_comment_label",
        "map_name_placeholder",
        "map_phone_placeholder",
        "map_comment_placeholder",
        "map_submit_button",
    ),
    "ui": (
        "ui_loading_featured",
        "ui_buy_marketplaces",
        "ui_buy_marketplaces_mobile",
    ),
}


def hp_fieldset(slug: str, fieldset_options: dict[str, Any]) -> tuple[Any, dict[str, Any]]:
    """Fieldset для HomePageContentAdmin: класс fs-id-<slug> (для совместимости)."""
    if slug not in SECTIONS:
        raise KeyError(f"Unknown homepage section slug: {slug}")
    opts = {**fieldset_options}
    classes: Sequence[str] | str = opts.get("classes") or ()
    if isinstance(classes, str):
        classes = (classes,)
    opts["classes"] = tuple(classes) + (f"fs-id-{slug}",)
    return (SECTIONS[slug]["title"], opts)


def homepage_sidebar_block_items() -> list[dict[str, Any]]:
    """Подпункты меню «Главная страница» → отдельная страница блока.

    reverse_lazy — см. site_settings_sidebar_block_items (Unfold + active).
    """
    items: list[dict[str, Any]] = []
    for slug in SECTION_ORDER:
        meta = SECTIONS[slug]
        items.append(
            {
                "title": meta["nav"],
                "icon": meta["icon"],
                "link": reverse_lazy(
                    "admin:api_homepagecontent_section", kwargs={"slug": slug}
                ),
            }
        )
    return items
