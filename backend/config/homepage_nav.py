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
    "proc": {
        "title": _("Блок «От замера до монтажа»"),
        "nav": _("От замера до монтажа"),
        "icon": "timeline",
    },
    "paths": {
        "title": _("Блок «Как оформить заказ» (2 сценария)"),
        "nav": _("Как оформить заказ"),
        "icon": "call_split",
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
        "hero_eyebrow",
        "hero_usp",
        "hero_text_tone",
        "hero_height_mode",
        "hero_title",
        "hero_subtitle",
        "hero_trust_line",
        "hero_trust_i0",
        "hero_trust_i1",
        "hero_trust_i2",
        "hero_stat_0_value",
        "hero_stat_0_label",
        "hero_stat_1_value",
        "hero_stat_1_label",
        "hero_stat_2_value",
        "hero_stat_2_label",
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
        "hero_slide_1_image_url",
        "hero_slide_1_video_url",
        "hero_slide_1_text_tone",
        "hero_slide_2_image_url",
        "hero_slide_2_video_url",
        "hero_slide_2_text_tone",
        "hero_slide_3_image_url",
        "hero_slide_3_video_url",
        "hero_slide_3_text_tone",
        "hero_slide_4_image_url",
        "hero_slide_4_video_url",
        "hero_slide_4_text_tone",
        "hero_slide_5_image_url",
        "hero_slide_5_video_url",
        "hero_slide_5_text_tone",
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
    "proc": (
        "proc_heading",
        "proc_subheading",
        "proc_s0_title",
        "proc_s0_text",
        "proc_s1_title",
        "proc_s1_text",
        "proc_s2_title",
        "proc_s2_text",
        "proc_s3_title",
        "proc_s3_text",
    ),
    "paths": (
        "paths_eyebrow",
        "paths_heading",
        "paths_subheading",
        "paths_ready_title",
        "paths_ready_subtitle",
        "paths_ready_b0",
        "paths_ready_b1",
        "paths_ready_b2",
        "paths_ready_cta",
        "paths_ready_href",
        "paths_custom_title",
        "paths_custom_subtitle",
        "paths_custom_b0",
        "paths_custom_b1",
        "paths_custom_b2",
        "paths_custom_cta",
        "paths_custom_href",
    ),
    "tent": ("tt_heading", "tt_subheading"),
    "feat": ("feat_heading", "feat_subheading", "feat_catalog_cta"),
    "calc": (
        "calc_mode",
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
        "calc_request_title",
        "calc_request_subtitle",
        "calc_request_benefit_1",
        "calc_request_benefit_2",
        "calc_request_benefit_3",
        "calc_pricing_model",
        "calc_range_len_min",
        "calc_range_len_max",
        "calc_range_wid_min",
        "calc_range_wid_max",
        "calc_min_total_rub",
        "calc_round_step",
        "calc_m0_id",
        "calc_m0_label",
        "calc_m0_price_m2",
        "calc_m1_id",
        "calc_m1_label",
        "calc_m1_price_m2",
        "calc_m2_id",
        "calc_m2_label",
        "calc_m2_price_m2",
        "calc_m3_id",
        "calc_m3_label",
        "calc_m3_price_m2",
        "calc_m4_id",
        "calc_m4_label",
        "calc_m4_price_m2",
        "calc_o0_id",
        "calc_o0_label",
        "calc_o0_price",
        "calc_o1_id",
        "calc_o1_label",
        "calc_o1_price",
        "calc_o2_id",
        "calc_o2_label",
        "calc_o2_price",
        "calc_o3_id",
        "calc_o3_label",
        "calc_o3_price",
        "calc_o4_id",
        "calc_o4_label",
        "calc_o4_price",
        "calc_o5_id",
        "calc_o5_label",
        "calc_o5_price",
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
