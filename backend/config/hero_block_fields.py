"""Имена полей hero v2 (по слайдам) — без импорта api, для homepage_nav и форм."""

from __future__ import annotations

HERO_SLIDE_COUNT = 6


def hero_section_virtual_field_names(n: int) -> tuple[str, ...]:
    p = f"hero_s{n}_"
    return (
        f"{p}enabled",
        f"{p}show_eyebrow",
        f"{p}eyebrow",
        f"{p}usp",
        f"{p}text_tone",
        f"{p}height_mode",
        f"{p}overlay_strength",
        f"{p}usp_accent_variant",
        f"{p}title",
        f"{p}subtitle",
        f"{p}show_trust_line",
        f"{p}trust_line",
        f"{p}show_trust_i0",
        f"{p}trust_i0",
        f"{p}show_trust_i1",
        f"{p}trust_i1",
        f"{p}show_trust_i2",
        f"{p}trust_i2",
        f"{p}show_stat_0",
        f"{p}stat_0_value",
        f"{p}stat_0_label",
        f"{p}show_stat_1",
        f"{p}stat_1_value",
        f"{p}stat_1_label",
        f"{p}show_stat_2",
        f"{p}stat_2_value",
        f"{p}stat_2_label",
        f"{p}cta_primary",
        f"{p}primary_action",
        f"{p}primary_href",
        f"{p}cta_secondary",
        f"{p}secondary_action",
        f"{p}secondary_href",
        f"{p}cb_title",
        f"{p}cb_name_label",
        f"{p}cb_phone_label",
        f"{p}cb_submit",
        f"{p}cb_submitting",
        f"{p}cb_success",
        f"{p}image_url",
        f"{p}video_url",
    )


def hero_section_all_field_names(n: int) -> tuple[str, ...]:
    return (
        *hero_section_virtual_field_names(n),
        f"hero_slide_{n}_image",
        f"hero_slide_{n}_video",
        f"hero_slide_{n}_mobile_image",
        f"hero_slide_{n}_mobile_video",
    )


def hero_section_slide_content_field_names(n: int) -> tuple[str, ...]:
    """Поля слайда без «слайд включён» — чекбокс выводится в отдельном верхнем блоке формы Hero."""
    en = f"hero_s{n}_enabled"
    return tuple(name for name in hero_section_all_field_names(n) if name != en)


def hero_carousel_field_names() -> tuple[str, ...]:
    """Поля уровня всего hero (карусель), не слайда — в начале раздела «Hero» в админке."""
    return (
        "hero_carousel_interval_sec",
        "hero_carousel_show_arrows",
        "hero_carousel_show_progress",
    )


def all_hero_section_field_names() -> tuple[str, ...]:
    return (
        *hero_carousel_field_names(),
        *(
            name
            for n in range(1, HERO_SLIDE_COUNT + 1)
            for name in hero_section_all_field_names(n)
        ),
    )
