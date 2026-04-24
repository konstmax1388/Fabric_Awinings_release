"""Форма админки главной: поля по блокам вместо сырого JSON."""

from __future__ import annotations

import re
from collections import OrderedDict
from typing import Any

from django import forms
from django.utils.translation import gettext_lazy as _
from unfold.widgets import UnfoldAdminFileFieldWidget, UnfoldAdminImageFieldWidget

from .fa_icon_presets import FONTAWESOME_PRESET_CHOICES, PRESET_CLASS_SET
from .home_defaults import _calc_safe_id, default_home_payload, merged_home_payload
from .home_hero_v2 import apply_hero_v2_initial, build_hero_slide_from_cd, collect_hero_v2_class_fields
from .home_hero_v2 import iter_hero_slide_model_image_names
from .models import HomePageContent

HERO_ACTION_CHOICES = (
    ("link", _("Переход по ссылке")),
    ("callback", _("Форма обратного звонка (попап)")),
)

HERO_TEXT_TONE_CHOICES = (
    ("light", _("Светлый текст (для тёмных фото/видео)")),
    ("dark", _("Тёмный текст (для светлых фото/видео)")),
)

HERO_HEIGHT_MODE_CHOICES = (
    ("normal", _("Стандартная высота")),
    ("tall", _("Высокий Hero")),
    ("wow", _("Максимальный (wow)")),
)

HERO_USP_ACCENT_VARIANT_CHOICES = (
    ("pulse", _("Акцент с пульсирующей точкой")),
    ("shimmer", _("Акцент с эффектом shimmer")),
)

CALCULATOR_MODE_CHOICES = (
    ("calculator", _("Конструктор (калькулятор)")),
    ("request_form", _("Форма заявки на индивидуальный проект")),
)

CALC_PRICING_MODEL_CHOICES = (
    (
        "area_plus_options",
        _(
            "Площадь + опции: (м² × цена материала) + сумма опций "
            "(пример: 12 м² × 3 200 + 2 500 = 40 900 ₽)"
        ),
    ),
    (
        "area_only",
        _(
            "Только площадь: м² × цена материала "
            "(пример: 12 м² × 3 200 = 38 400 ₽)"
        ),
    ),
    (
        "options_only",
        _(
            "Только опции: сумма выбранных опций "
            "(пример: 1 200 + 2 500 = 3 700 ₽)"
        ),
    ),
)

CALC_ROUND_STEP_CHOICES = (
    (1, "1 ₽"),
    (10, "10 ₽"),
    (50, "50 ₽"),
    (100, "100 ₽"),
    (500, "500 ₽"),
    (1000, "1 000 ₽"),
)

_W = (
    "border border-base-200 rounded-default px-3 py-2 text-sm w-full max-w-4xl "
    "bg-white shadow-xs dark:border-base-700 dark:bg-base-900"
)


class AdminImageUrlWidget(forms.URLInput):
    template_name = "unfold/widgets/admin_image_url_input.html"


def _txt(label: str, **kw) -> forms.CharField:
    return forms.CharField(label=label, required=False, widget=forms.TextInput(attrs={"class": _W}), **kw)


def _req_txt(label: str, **kw) -> forms.CharField:
    return forms.CharField(label=label, required=True, widget=forms.TextInput(attrs={"class": _W}), **kw)


def _area(label: str, rows: int = 3) -> forms.CharField:
    return forms.CharField(
        label=label,
        required=False,
        widget=forms.Textarea(attrs={"rows": rows, "class": _W}),
    )


def _image_url(label: str, **kw) -> forms.CharField:
    return forms.CharField(
        label=label,
        required=False,
        widget=AdminImageUrlWidget(
            attrs={
                "class": _W,
                "placeholder": "https://...",
                "data-admin-image-url-input": "1",
            }
        ),
        **kw,
    )


def _int_val(label: str, initial: int = 0) -> forms.IntegerField:
    return forms.IntegerField(label=label, required=True, min_value=0, initial=initial)


PS_ICON_KIND_CHOICES = (
    ("emoji", _("Текст или эмодзи")),
    ("fontawesome", _("Иконка Font Awesome")),
    ("image", _("Загруженное изображение")),
)


def _resolved_fa_class(cd: dict[str, Any], i: int) -> str:
    preset = (cd.get(f"ps{i}_fa_preset") or "").strip()
    if preset:
        return preset
    return (cd.get(f"ps{i}_fontawesome") or "").strip()


def _ps_problem_solution_card(cd: dict[str, Any], i: int) -> dict[str, Any]:
    kind = cd.get(f"ps{i}_icon_kind") or "emoji"
    if kind not in ("emoji", "fontawesome", "image"):
        kind = "emoji"
    icon_text = (cd.get(f"ps{i}_icon") or "").strip() or "•"
    fa = _resolved_fa_class(cd, i)
    if kind == "fontawesome" and not fa:
        kind = "emoji"
    return {
        "problem": cd[f"ps{i}_problem"].strip(),
        "solution": cd[f"ps{i}_solution"].strip(),
        "iconKind": kind,
        "icon": icon_text,
        "fontawesomeClass": fa if kind == "fontawesome" else "",
        "iconImageUrl": "",
    }


_MODEL_IMAGE_FIELDS: tuple[str, ...] = (
    *iter_hero_slide_model_image_names(),
    "ps0_icon_image",
    "ps1_icon_image",
    "ps2_icon_image",
    "ps3_icon_image",
)


class _HeroV2FormFieldsMixin(forms.Form):
    pass


for _hn, _hf in collect_hero_v2_class_fields().items():
    setattr(_HeroV2FormFieldsMixin, _hn, _hf)


class HomePageContentAdminForm(_HeroV2FormFieldsMixin, forms.ModelForm):
    """Все поля блоков + скрытый payload (перезаписывается при сохранении)."""

    # --- meta (SEO, микроразметка) ---
    meta_title = _req_txt(_("Заголовок страницы (title)"))
    meta_description = _area(_("Описание (meta description)"), rows=3)
    meta_org_name = _req_txt(_("Название организации (schema.org)"))
    meta_org_description = _area(_("Описание организации (schema.org)"), rows=2)

    # --- hero: поля hero_s* в _HeroV2FormFieldsMixin (см. home_hero_v2) ---

    # --- problem / solution ---
    ps_heading = _req_txt(_("Заголовок секции"))
    ps_subheading = _area(_("Подзаголовок"), rows=2)
    ps0_problem = _req_txt(_("Карточка 1: вопрос"))
    ps0_solution = _area(_("Карточка 1: ответ"), rows=2)
    ps0_icon_kind = forms.ChoiceField(
        label=_("Карточка 1: тип значка"),
        choices=PS_ICON_KIND_CHOICES,
        widget=forms.Select(attrs={"class": _W}),
    )
    ps0_icon = _txt(
        _("Карточка 1: символ или эмодзи"),
        help_text=_("Используется, если тип значка — «Текст или эмодзи»."),
    )
    ps0_fa_preset = forms.ChoiceField(
        label=_("Карточка 1: иконка Font Awesome (из списка)"),
        choices=FONTAWESOME_PRESET_CHOICES,
        required=False,
        widget=forms.Select(attrs={"class": _W}),
    )
    ps0_fontawesome = forms.CharField(
        label=_("Карточка 1: класс Font Awesome вручную"),
        required=False,
        widget=forms.TextInput(attrs={"class": _W}),
        help_text=_(
            "Если не выбрали из списка: полные классы FA 6 Free, напр. fa-solid fa-coins. "
            "Каталог: https://fontawesome.com/search?o=r&m=free"
        ),
    )
    ps1_problem = _req_txt(_("Карточка 2: вопрос"))
    ps1_solution = _area(_("Карточка 2: ответ"), rows=2)
    ps1_icon_kind = forms.ChoiceField(
        label=_("Карточка 2: тип значка"),
        choices=PS_ICON_KIND_CHOICES,
        widget=forms.Select(attrs={"class": _W}),
    )
    ps1_icon = _txt(
        _("Карточка 2: символ или эмодзи"),
        help_text=_("Используется, если тип значка — «Текст или эмодзи»."),
    )
    ps1_fa_preset = forms.ChoiceField(
        label=_("Карточка 2: иконка Font Awesome (из списка)"),
        choices=FONTAWESOME_PRESET_CHOICES,
        required=False,
        widget=forms.Select(attrs={"class": _W}),
    )
    ps1_fontawesome = forms.CharField(
        label=_("Карточка 2: класс Font Awesome вручную"),
        required=False,
        widget=forms.TextInput(attrs={"class": _W}),
        help_text=_("См. подсказку у карточки 1."),
    )
    ps2_problem = _req_txt(_("Карточка 3: вопрос"))
    ps2_solution = _area(_("Карточка 3: ответ"), rows=2)
    ps2_icon_kind = forms.ChoiceField(
        label=_("Карточка 3: тип значка"),
        choices=PS_ICON_KIND_CHOICES,
        widget=forms.Select(attrs={"class": _W}),
    )
    ps2_icon = _txt(
        _("Карточка 3: символ или эмодзи"),
        help_text=_("Используется, если тип значка — «Текст или эмодзи»."),
    )
    ps2_fa_preset = forms.ChoiceField(
        label=_("Карточка 3: иконка Font Awesome (из списка)"),
        choices=FONTAWESOME_PRESET_CHOICES,
        required=False,
        widget=forms.Select(attrs={"class": _W}),
    )
    ps2_fontawesome = forms.CharField(
        label=_("Карточка 3: класс Font Awesome вручную"),
        required=False,
        widget=forms.TextInput(attrs={"class": _W}),
        help_text=_("См. подсказку у карточки 1."),
    )
    ps3_problem = _req_txt(_("Карточка 4: вопрос"))
    ps3_solution = _area(_("Карточка 4: ответ"), rows=2)
    ps3_icon_kind = forms.ChoiceField(
        label=_("Карточка 4: тип значка"),
        choices=PS_ICON_KIND_CHOICES,
        widget=forms.Select(attrs={"class": _W}),
    )
    ps3_icon = _txt(
        _("Карточка 4: символ или эмодзи"),
        help_text=_("Используется, если тип значка — «Текст или эмодзи»."),
    )
    ps3_fa_preset = forms.ChoiceField(
        label=_("Карточка 4: иконка Font Awesome (из списка)"),
        choices=FONTAWESOME_PRESET_CHOICES,
        required=False,
        widget=forms.Select(attrs={"class": _W}),
    )
    ps3_fontawesome = forms.CharField(
        label=_("Карточка 4: класс Font Awesome вручную"),
        required=False,
        widget=forms.TextInput(attrs={"class": _W}),
        help_text=_("См. подсказку у карточки 1."),
    )

    # --- process timeline ---
    proc_heading = _req_txt(_("Заголовок блока «От замера до монтажа»"))
    proc_subheading = _area(_("Подзаголовок блока"), rows=2)
    proc_s0_title = _req_txt(_("Этап 1: заголовок"))
    proc_s0_text = _area(_("Этап 1: текст"), rows=2)
    proc_s1_title = _req_txt(_("Этап 2: заголовок"))
    proc_s1_text = _area(_("Этап 2: текст"), rows=2)
    proc_s2_title = _req_txt(_("Этап 3: заголовок"))
    proc_s2_text = _area(_("Этап 3: текст"), rows=2)
    proc_s3_title = _req_txt(_("Этап 4: заголовок"))
    proc_s3_text = _area(_("Этап 4: текст"), rows=2)

    # --- purchase paths ---
    paths_eyebrow = _req_txt(_("Бейдж блока «Как оформить заказ»"))
    paths_heading = _req_txt(_("Заголовок блока"))
    paths_subheading = _area(_("Подзаголовок блока"), rows=3)
    paths_ready_title = _req_txt(_("Готовая продукция: название сценария"))
    paths_ready_subtitle = _req_txt(_("Готовая продукция: подзаголовок"))
    paths_ready_b0 = _req_txt(_("Готовая продукция: пункт 1"))
    paths_ready_b1 = _req_txt(_("Готовая продукция: пункт 2"))
    paths_ready_b2 = _req_txt(_("Готовая продукция: пункт 3"))
    paths_ready_cta = _req_txt(_("Готовая продукция: текст кнопки"))
    paths_ready_href = _req_txt(_("Готовая продукция: ссылка кнопки"))
    paths_custom_title = _req_txt(_("Индивидуальный проект: название сценария"))
    paths_custom_subtitle = _req_txt(_("Индивидуальный проект: подзаголовок"))
    paths_custom_b0 = _req_txt(_("Индивидуальный проект: пункт 1"))
    paths_custom_b1 = _req_txt(_("Индивидуальный проект: пункт 2"))
    paths_custom_b2 = _req_txt(_("Индивидуальный проект: пункт 3"))
    paths_custom_cta = _req_txt(_("Индивидуальный проект: текст кнопки"))
    paths_custom_href = _req_txt(_("Индивидуальный проект: ссылка кнопки"))

    # --- tent types ---
    tt_heading = _req_txt(_("Заголовок"))
    tt_subheading = _area(_("Подзаголовок"), rows=3)

    # --- featured ---
    feat_heading = _req_txt(_("Заголовок"))
    feat_subheading = _area(_("Подзаголовок"), rows=2)
    feat_catalog_cta = _req_txt(_("Текст кнопки «в каталог»"))

    # --- calculator ---
    calc_mode = forms.ChoiceField(
        label=_("Режим блока"),
        choices=CALCULATOR_MODE_CHOICES,
        widget=forms.Select(attrs={"class": _W}),
    )
    calc_heading = _req_txt(_("Заголовок"))
    calc_subheading = _area(_("Подзаголовок"), rows=3)
    calc_length_label = _req_txt(_("Подпись: длина"))
    calc_width_label = _req_txt(_("Подпись: ширина"))
    calc_material_label = _req_txt(_("Подпись: материал"))
    calc_options_label = _req_txt(_("Подпись: опции"))
    calc_estimate_label = _req_txt(_("Подпись: ориентировочная стоимость"))
    calc_estimate_note = _area(_("Текст под суммой"), rows=2)
    calc_name_label = _req_txt(_("Подпись: имя"))
    calc_phone_label = _req_txt(_("Подпись: телефон"))
    calc_comment_label = _req_txt(_("Подпись: комментарий"))
    calc_name_placeholder = _txt(_("Плейсхолдер: имя"))
    calc_phone_placeholder = _txt(_("Плейсхолдер: телефон"))
    calc_comment_placeholder = _txt(_("Плейсхолдер: комментарий"))
    calc_submit_button = _req_txt(_("Кнопка отправки"))
    calc_submitting = _req_txt(_("Текст при отправке"))
    calc_success_message = _area(_("Сообщение после успешной отправки"), rows=2)
    calc_request_title = _req_txt(_("Форма заявки: заголовок"))
    calc_request_subtitle = _area(_("Форма заявки: подзаголовок"), rows=3)
    calc_request_benefit_1 = _req_txt(_("Форма заявки: преимущество 1"))
    calc_request_benefit_2 = _req_txt(_("Форма заявки: преимущество 2"))
    calc_request_benefit_3 = _req_txt(_("Форма заявки: преимущество 3"))
    calc_step_1_title = _req_txt(_("Калькулятор: заголовок шага 1"))
    calc_step_2_title = _req_txt(_("Калькулятор: заголовок шага 2"))
    calc_virtual_ruler_title = _req_txt(_("Калькулятор: подпись виртуальной рулетки"))
    calc_request_badge = _req_txt(_("Форма заявки: бейдж"))
    calc_error_phone_incomplete = _req_txt(_("Калькулятор: ошибка неполного телефона"))
    calc_error_comment_too_long = _req_txt(_("Калькулятор: ошибка длинного комментария ({max})"))
    calc_error_submit_failed = _req_txt(_("Калькулятор: ошибка «не удалось отправить»"))
    calc_error_network = _req_txt(_("Калькулятор: ошибка сети"))
    calc_consent_prefix = _req_txt(_("Калькулятор: согласие — текст до ссылки 1"))
    calc_consent_privacy_link = _req_txt(_("Калькулятор: согласие — ссылка 1"))
    calc_consent_and = _req_txt(_("Калькулятор: согласие — связка между ссылками"))
    calc_consent_offer_link = _req_txt(_("Калькулятор: согласие — ссылка 2"))
    calc_step_1_title = _req_txt(_("Калькулятор: заголовок шага 1"))
    calc_step_2_title = _req_txt(_("Калькулятор: заголовок шага 2"))
    calc_virtual_ruler_title = _req_txt(_("Калькулятор: заголовок «виртуальная рулетка»"))
    calc_request_badge = _req_txt(_("Форма заявки: бейдж сверху"))
    calc_error_phone_incomplete = _req_txt(_("Калькулятор: ошибка неполного телефона"))
    calc_error_comment_too_long = _req_txt(_("Калькулятор: ошибка длинного комментария ({max})"))
    calc_error_submit_failed = _req_txt(_("Калькулятор: ошибка «не удалось отправить»"))
    calc_error_network = _req_txt(_("Калькулятор: ошибка сети"))
    calc_consent_prefix = _req_txt(_("Калькулятор: текст согласия до ссылки 1"))
    calc_consent_privacy_link = _req_txt(_("Калькулятор: ссылка 1 (политика)"))
    calc_consent_and = _req_txt(_("Калькулятор: связка между ссылками"))
    calc_consent_offer_link = _req_txt(_("Калькулятор: ссылка 2 (оферта)"))

    calc_pricing_model = forms.ChoiceField(
        label=_("Модель расчёта"),
        choices=CALC_PRICING_MODEL_CHOICES,
        initial="area_plus_options",
        widget=forms.Select(attrs={"class": _W}),
        help_text=_(
            "Выберите формулу: площадь+опции / только площадь / только опции. "
            "После расчёта для любой модели применяется округление до шага и нижняя граница «Минимальная сумма»."
        ),
    )
    calc_range_len_min = forms.FloatField(
        label=_("Длина: минимум (м)"),
        required=True,
        min_value=0.1,
        max_value=500.0,
        initial=1.0,
        widget=forms.NumberInput(attrs={"class": _W, "step": "0.1"}),
    )
    calc_range_len_max = forms.FloatField(
        label=_("Длина: максимум (м)"),
        required=True,
        min_value=0.1,
        max_value=500.0,
        initial=30.0,
        widget=forms.NumberInput(attrs={"class": _W, "step": "0.1"}),
    )
    calc_range_wid_min = forms.FloatField(
        label=_("Ширина: минимум (м)"),
        required=True,
        min_value=0.1,
        max_value=500.0,
        initial=1.0,
        widget=forms.NumberInput(attrs={"class": _W, "step": "0.1"}),
    )
    calc_range_wid_max = forms.FloatField(
        label=_("Ширина: максимум (м)"),
        required=True,
        min_value=0.1,
        max_value=500.0,
        initial=20.0,
        widget=forms.NumberInput(attrs={"class": _W, "step": "0.1"}),
    )
    calc_min_total_rub = forms.IntegerField(
        label=_("Минимальная сумма (₽), не ниже"),
        required=True,
        min_value=0,
        initial=0,
        widget=forms.NumberInput(attrs={"class": _W}),
    )
    calc_round_step = forms.TypedChoiceField(
        label=_("Округление итоговой суммы до"),
        coerce=int,
        choices=CALC_ROUND_STEP_CHOICES,
        initial=1,
        widget=forms.Select(attrs={"class": _W}),
    )

    calc_m0_id = _txt(_("Материал 1: id (латиница, опционально)"))
    calc_m0_label = _txt(_("Материал 1: подпись"))
    calc_m0_price_m2 = forms.IntegerField(
        label=_("Материал 1: цена ₽/м²"),
        required=False,
        min_value=0,
        initial=3200,
        widget=forms.NumberInput(attrs={"class": _W}),
    )
    calc_m1_id = _txt(_("Материал 2: id"))
    calc_m1_label = _txt(_("Материал 2: подпись"))
    calc_m1_price_m2 = forms.IntegerField(
        label=_("Материал 2: цена ₽/м²"),
        required=False,
        min_value=0,
        initial=4100,
        widget=forms.NumberInput(attrs={"class": _W}),
    )
    calc_m2_id = _txt(_("Материал 3: id"))
    calc_m2_label = _txt(_("Материал 3: подпись"))
    calc_m2_price_m2 = forms.IntegerField(
        label=_("Материал 3: цена ₽/м²"),
        required=False,
        min_value=0,
        initial=2800,
        widget=forms.NumberInput(attrs={"class": _W}),
    )
    calc_m3_id = _txt(_("Материал 4: id"))
    calc_m3_label = _txt(_("Материал 4: подпись"))
    calc_m3_price_m2 = forms.IntegerField(
        label=_("Материал 4: цена ₽/м²"),
        required=False,
        min_value=0,
        initial=0,
        widget=forms.NumberInput(attrs={"class": _W}),
    )
    calc_m4_id = _txt(_("Материал 5: id"))
    calc_m4_label = _txt(_("Материал 5: подпись"))
    calc_m4_price_m2 = forms.IntegerField(
        label=_("Материал 5: цена ₽/м²"),
        required=False,
        min_value=0,
        initial=0,
        widget=forms.NumberInput(attrs={"class": _W}),
    )

    calc_o0_id = _txt(_("Опция 1: id"))
    calc_o0_label = _txt(_("Опция 1: подпись"))
    calc_o0_price = forms.IntegerField(
        label=_("Опция 1: надбавка ₽"),
        required=False,
        min_value=0,
        initial=1200,
        widget=forms.NumberInput(attrs={"class": _W}),
    )
    calc_o1_id = _txt(_("Опция 2: id"))
    calc_o1_label = _txt(_("Опция 2: подпись"))
    calc_o1_price = forms.IntegerField(
        label=_("Опция 2: надбавка ₽"),
        required=False,
        min_value=0,
        initial=2500,
        widget=forms.NumberInput(attrs={"class": _W}),
    )
    calc_o2_id = _txt(_("Опция 3: id"))
    calc_o2_label = _txt(_("Опция 3: подпись"))
    calc_o2_price = forms.IntegerField(
        label=_("Опция 3: надбавка ₽"),
        required=False,
        min_value=0,
        initial=1800,
        widget=forms.NumberInput(attrs={"class": _W}),
    )
    calc_o3_id = _txt(_("Опция 4: id"))
    calc_o3_label = _txt(_("Опция 4: подпись"))
    calc_o3_price = forms.IntegerField(
        label=_("Опция 4: надбавка ₽"),
        required=False,
        min_value=0,
        initial=0,
        widget=forms.NumberInput(attrs={"class": _W}),
    )
    calc_o4_id = _txt(_("Опция 5: id"))
    calc_o4_label = _txt(_("Опция 5: подпись"))
    calc_o4_price = forms.IntegerField(
        label=_("Опция 5: надбавка ₽"),
        required=False,
        min_value=0,
        initial=0,
        widget=forms.NumberInput(attrs={"class": _W}),
    )
    calc_o5_id = _txt(_("Опция 6: id"))
    calc_o5_label = _txt(_("Опция 6: подпись"))
    calc_o5_price = forms.IntegerField(
        label=_("Опция 6: надбавка ₽"),
        required=False,
        min_value=0,
        initial=0,
        widget=forms.NumberInput(attrs={"class": _W}),
    )

    # --- portfolio ---
    port_heading = _req_txt(_("Заголовок"))
    port_subheading = _area(_("Подзаголовок"), rows=2)
    port_page_heading = _req_txt(_("Страница портфолио: заголовок"))
    port_page_subheading = _area(_("Страница портфолио: подзаголовок"), rows=2)
    port_filters = forms.CharField(
        label=_("Фильтры (через запятую)"),
        required=True,
        help_text=_("Например: Все, Транспорт, Склады, Террасы. Первая кнопка обычно «Все» — показ всех проектов."),
        widget=forms.TextInput(attrs={"class": _W}),
    )
    port_loading = _req_txt(_("Текст «загрузка»"))
    port_empty = _req_txt(_("Текст если пусто"))
    port_all_cta = _req_txt(_("Кнопка «все проекты»"))

    # --- why us ---
    why_heading = _req_txt(_("Заголовок"))
    why_subheading = _area(_("Подзаголовок"), rows=2)
    why_s0_value = _int_val(_("Счётчик 1: число"), 500)
    why_s0_suffix = _req_txt(_("Счётчик 1: суффикс (например +)"))
    why_s0_label = _req_txt(_("Счётчик 1: подпись"))
    why_s1_value = _int_val(_("Счётчик 2: число"), 12)
    why_s1_suffix = _req_txt(_("Счётчик 2: суффикс"))
    why_s1_label = _req_txt(_("Счётчик 2: подпись"))
    why_s2_value = _int_val(_("Счётчик 3: число"), 50)
    why_s2_suffix = _req_txt(_("Счётчик 3: суффикс"))
    why_s2_label = _req_txt(_("Счётчик 3: подпись"))
    why_c0_title = _req_txt(_("Колонка 1: заголовок"))
    why_c0_text = _area(_("Колонка 1: текст"), rows=2)
    why_c0_icon = _txt(_("Колонка 1: значок"))
    why_c1_title = _req_txt(_("Колонка 2: заголовок"))
    why_c1_text = _area(_("Колонка 2: текст"), rows=2)
    why_c1_icon = _txt(_("Колонка 2: значок"))
    why_c2_title = _req_txt(_("Колонка 3: заголовок"))
    why_c2_text = _area(_("Колонка 3: текст"), rows=2)
    why_c2_icon = _txt(_("Колонка 3: значок"))
    why_c3_title = _req_txt(_("Колонка 4: заголовок"))
    why_c3_text = _area(_("Колонка 4: текст"), rows=2)
    why_c3_icon = _txt(_("Колонка 4: значок"))

    # --- reviews ---
    rev_heading = _req_txt(_("Заголовок"))
    rev_subheading = _area(_("Подзаголовок"), rows=2)
    rev_loading = _req_txt(_("Текст «загрузка»"))
    rev_video_caption = _req_txt(_("Подпись к видеоотзыву"))
    rev_read_more_label = _req_txt(_("Кнопка длинного отзыва: «читать весь»"))
    rev_collapse_label = _req_txt(_("Кнопка длинного отзыва: «свернуть»"))
    rev_form_heading = _req_txt(_("Форма отзыва: заголовок"))
    rev_form_subheading = _area(_("Форма отзыва: подзаголовок"), rows=2)
    rev_name_placeholder = _req_txt(_("Форма отзыва: плейсхолдер имени"))
    rev_city_placeholder = _req_txt(_("Форма отзыва: плейсхолдер города"))
    rev_text_placeholder = _req_txt(_("Форма отзыва: плейсхолдер текста"))
    rev_consent_prefix = _req_txt(_("Форма отзыва: текст согласия до ссылки"))
    rev_consent_link_label = _req_txt(_("Форма отзыва: текст ссылки согласия"))
    rev_submit_button = _req_txt(_("Форма отзыва: кнопка отправки"))
    rev_submitting = _req_txt(_("Форма отзыва: текст при отправке"))
    rev_success_message = _area(_("Форма отзыва: сообщение после успеха"), rows=2)
    rev_error_message = _area(_("Форма отзыва: сообщение при ошибке"), rows=2)

    # --- blog ---
    blog_heading = _req_txt(_("Заголовок"))
    blog_subheading = _area(_("Подзаголовок"), rows=2)
    blog_all_link = _req_txt(_("Ссылка «все статьи»"))
    blog_read_more = _req_txt(_("Ссылка «читать далее»"))
    blog_loading = _req_txt(_("Текст «загрузка»"))

    # --- map + form ---
    map_heading = _req_txt(_("Заголовок блока"))
    map_subheading = _area(_("Подзаголовок"), rows=2)
    map_iframe_src = forms.CharField(
        label=_("URL встраивания карты (iframe src)"),
        required=True,
        help_text=_(
            "Яндекс: URL iframe (map-widget) или целиком тег <script> конструктора "
            "(api-maps.yandex.ru/services/constructor/… — как в «Поделиться»). "
            "Для iframe: в ll/pt долгота,широта, запятая как %2C."
        ),
        widget=forms.Textarea(attrs={"rows": 2, "class": _W}),
    )
    map_title = _req_txt(_("Title у iframe (доступность)"))
    map_form_name_label = _req_txt(_("Форма: подпись «имя»"))
    map_form_phone_label = _req_txt(_("Форма: подпись «телефон»"))
    map_form_comment_label = _req_txt(_("Форма: подпись «комментарий»"))
    map_name_placeholder = _txt(_("Плейсхолдер: имя"))
    map_phone_placeholder = _txt(_("Плейсхолдер: телефон"))
    map_comment_placeholder = _txt(_("Плейсхолдер: комментарий"))
    map_submit_button = _req_txt(_("Текст кнопки отправки"))

    # --- ui (шапка и подборка) ---
    ui_loading_featured = _req_txt(_("Текст загрузки подборки на главной"))
    ui_buy_marketplaces = _req_txt(_("Подпись маркетплейсов (десктоп)"))
    ui_buy_marketplaces_mobile = _req_txt(_("Подпись маркетплейсов (мобильная)"))
    ui_nav_home = _req_txt(_("Навигация: «Главная»"))
    ui_nav_catalog = _req_txt(_("Навигация: «Каталог»"))
    ui_nav_portfolio = _req_txt(_("Навигация: «Портфолио»"))
    ui_nav_contacts = _req_txt(_("Навигация: «Контакты»"))
    ui_nav_blog = _req_txt(_("Навигация: «Блог»"))
    ui_nav_cart = _req_txt(_("Навигация: «Корзина»"))
    ui_nav_account = _req_txt(_("Навигация: «Личный кабинет»"))
    ui_nav_menu_title = _req_txt(_("Мобильное меню: заголовок"))
    ui_nav_menu_subtitle = _req_txt(_("Мобильное меню: подзаголовок"))
    ui_mobile_bar_profile = _req_txt(_("Нижняя навигация (моб.): «Профиль»"))
    ui_footer_nav_title = _req_txt(_("Подвал: заголовок «Навигация»"))
    ui_footer_marketplaces_title = _req_txt(_("Подвал: заголовок «Маркетплейсы»"))
    ui_footer_social_title = _req_txt(_("Подвал: заголовок «Соцсети»"))
    ui_footer_contacts_title = _req_txt(_("Подвал: заголовок «Контакты»"))
    ui_footer_payment_title = _req_txt(_("Подвал: заголовок «Оплата»"))
    ui_footer_delivery_title = _req_txt(_("Подвал: заголовок «Доставка»"))
    ui_footer_staff_login = _req_txt(_("Подвал: ссылка «Вход для сотрудников»"))
    ui_footer_privacy_link = _req_txt(_("Подвал: ссылка «Политика конфиденциальности»"))
    ui_footer_offer_link = _req_txt(_("Подвал: ссылка «Публичная оферта»"))
    ui_footer_copyright_suffix = _req_txt(_("Подвал: текст после названия компании в копирайте"))
    ui_header_main_menu_aria = _req_txt(_("Шапка (десктоп): aria-label меню"))
    ui_header_theme_to_light_aria = _req_txt(_("Шапка: aria-label кнопки «светлая тема»"))
    ui_header_theme_to_dark_aria = _req_txt(_("Шапка: aria-label кнопки «тёмная тема»"))
    ui_header_theme_light_title = _req_txt(_("Шапка: title кнопки «светлая тема»"))
    ui_header_theme_dark_title = _req_txt(_("Шапка: title кнопки «тёмная тема»"))
    ui_header_menu_open_aria = _req_txt(_("Шапка (моб.): aria-label кнопки «открыть меню»"))
    ui_header_menu_close_aria = _req_txt(_("Шапка (моб.): aria-label кнопки «закрыть меню»"))
    ui_header_mobile_menu_aria = _req_txt(_("Шапка (моб.): aria-label контейнера меню"))
    ui_header_bottom_nav_aria = _req_txt(_("Шапка (моб.): aria-label нижней навигации"))
    ui_staff_modal_close_overlay_aria = _req_txt(_("Модалка входа: aria-label фона закрытия"))
    ui_staff_modal_close_button_aria = _req_txt(_("Модалка входа: aria-label кнопки закрытия"))
    ui_staff_modal_title = _req_txt(_("Модалка входа: заголовок"))
    ui_staff_modal_subtitle = _req_txt(_("Модалка входа: подзаголовок"))
    ui_staff_modal_manager_label = _req_txt(_("Модалка входа: карточка «Панель менеджера»"))
    ui_staff_modal_manager_hint = _req_txt(_("Модалка входа: подпись к панели менеджера"))
    ui_staff_modal_admin_label = _req_txt(_("Модалка входа: карточка «Настройки сайта»"))
    ui_staff_modal_admin_hint = _req_txt(_("Модалка входа: подпись к настройкам сайта"))
    ui_intro_aria_label = _req_txt(_("Splash: aria-label экрана"))
    ui_intro_tag_1 = _req_txt(_("Splash: верхний тег 1"))
    ui_intro_tag_2 = _req_txt(_("Splash: верхний тег 2"))
    ui_intro_tag_3 = _req_txt(_("Splash: верхний тег 3"))
    ui_intro_title = _req_txt(_("Splash: заголовок"))
    ui_intro_subtitle = _req_txt(_("Splash: подзаголовок"))
    ui_intro_stage_1 = _req_txt(_("Splash: этап 1"))
    ui_intro_stage_2 = _req_txt(_("Splash: этап 2"))
    ui_intro_stage_3 = _req_txt(_("Splash: этап 3"))
    ui_intro_skip_button = _req_txt(_("Splash: кнопка пропуска"))
    ui_product_no_photo = _req_txt(_("Товар: текст при отсутствии фото"))
    ui_product_price_prefix = _req_txt(_("Товар: префикс цены"))
    ui_product_add_to_cart = _req_txt(_("Товар: кнопка «в корзину»"))
    ui_product_added_title = _req_txt(_("Товар: заголовок «добавлено в корзину»"))
    ui_product_continue_shopping = _req_txt(_("Товар: кнопка «продолжить покупки»"))
    ui_product_go_to_cart = _req_txt(_("Товар: кнопка «перейти в корзину»"))
    ui_product_marketplaces_title = _req_txt(_("Товар: заголовок маркетплейсов"))
    ui_product_badge_in_stock = _req_txt(_("Товар: автобейдж «в наличии»"))
    ui_product_badge_seasonal = _req_txt(_("Товар: автобейдж «сезонное»"))
    ui_cart_page_title = _req_txt(_("Корзина: заголовок страницы"))
    ui_cart_page_intro = _area(_("Корзина: подзаголовок страницы"), rows=3)
    ui_cart_empty_title = _req_txt(_("Корзина: пусто — заголовок"))
    ui_cart_empty_text = _area(_("Корзина: пусто — текст"), rows=3)
    ui_cart_empty_cta = _req_txt(_("Корзина: пусто — кнопка"))
    ui_cart_items_title = _req_txt(_("Корзина: заголовок списка товаров"))
    ui_cart_no_photo = _req_txt(_("Корзина: текст при отсутствии фото"))
    ui_cart_price_per_unit_prefix = _req_txt(_("Корзина: префикс «цена за единицу»"))
    ui_cart_price_per_unit_suffix = _req_txt(_("Корзина: суффикс «цена за единицу»"))
    ui_cart_qty_label = _req_txt(_("Корзина: подпись количества"))
    ui_cart_remove_or_decrease_aria = _req_txt(_("Корзина: aria кнопки минус/удалить"))
    ui_cart_increase_aria = _req_txt(_("Корзина: aria кнопки плюс"))
    ui_cart_remove_line = _req_txt(_("Корзина: кнопка «убрать»"))
    ui_cart_add_more_cta = _req_txt(_("Корзина: ссылка «добавить ещё»"))
    ui_cart_summary_title = _req_txt(_("Корзина: заголовок итога"))
    ui_cart_summary_items_label = _req_txt(_("Корзина: метка «позиций в заказе»"))
    ui_cart_summary_approx_label = _req_txt(_("Корзина: метка «ориентировочно»"))
    ui_cart_summary_delivery_note = _req_txt(_("Корзина: пояснение по доставке"))
    ui_cart_checkout_button = _req_txt(_("Корзина: кнопка оформления"))
    ui_cart_checkout_footnote = _req_txt(_("Корзина: примечание под кнопкой"))
    ui_cart_terms_prefix = _req_txt(_("Корзина: префикс перед ссылками оферты/политики"))
    ui_product_not_found_title = _req_txt(_("Карточка товара: заголовок «не найдено»"))
    ui_product_not_found_text = _req_txt(_("Карточка товара: текст «не найдено»"))
    ui_product_back_to_catalog = _req_txt(_("Карточка товара: кнопка «в каталог»"))
    ui_product_breadcrumb_aria = _req_txt(_("Карточка товара: aria хлебных крошек"))
    ui_product_breadcrumb_home = _req_txt(_("Карточка товара: крошка «главная»"))
    ui_product_breadcrumb_catalog = _req_txt(_("Карточка товара: крошка «каталог»"))
    ui_product_price_label = _req_txt(_("Карточка товара: подпись цены"))
    ui_product_variant_label = _req_txt(_("Карточка товара: подпись варианта"))
    ui_product_details_button = _req_txt(_("Карточка товара: кнопка деталей"))
    ui_product_marketplaces_card_title = _req_txt(_("Карточка товара: заголовок блока маркетплейсов"))
    ui_product_marketplaces_card_hint = _req_txt(_("Карточка товара: подпись блока маркетплейсов"))
    ui_product_custom_order_cta = _req_txt(_("Карточка товара: CTA индивидуального заказа"))
    ui_product_related_title = _req_txt(_("Карточка товара: заголовок похожих"))
    ui_product_related_subtitle_prefix = _req_txt(_("Карточка товара: префикс подзаголовка похожих"))
    ui_product_material_map_subtitle_fallback = _req_txt(_("Карточка товара: fallback подписи карты материалов"))

    class Meta:
        model = HomePageContent
        fields = (
            "payload",
            *iter_hero_slide_model_image_names(),
            "ps0_icon_image",
            "ps1_icon_image",
            "ps2_icon_image",
            "ps3_icon_image",
        )
        widgets = {
            "hero_slide_1_image": UnfoldAdminFileFieldWidget(
                attrs={"accept": "image/*,video/mp4,video/webm,video/ogg,.mp4,.webm,.mov,.m4v"}
            ),
            "hero_slide_2_image": UnfoldAdminFileFieldWidget(
                attrs={"accept": "image/*,video/mp4,video/webm,video/ogg,.mp4,.webm,.mov,.m4v"}
            ),
            "hero_slide_3_image": UnfoldAdminFileFieldWidget(
                attrs={"accept": "image/*,video/mp4,video/webm,video/ogg,.mp4,.webm,.mov,.m4v"}
            ),
            "hero_slide_4_image": UnfoldAdminFileFieldWidget(
                attrs={"accept": "image/*,video/mp4,video/webm,video/ogg,.mp4,.webm,.mov,.m4v"}
            ),
            "hero_slide_5_image": UnfoldAdminFileFieldWidget(
                attrs={"accept": "image/*,video/mp4,video/webm,video/ogg,.mp4,.webm,.mov,.m4v"}
            ),
            "hero_slide_6_image": UnfoldAdminFileFieldWidget(
                attrs={"accept": "image/*,video/mp4,video/webm,video/ogg,.mp4,.webm,.mov,.m4v"}
            ),
            "ps0_icon_image": UnfoldAdminImageFieldWidget(attrs={"accept": "image/*"}),
            "ps1_icon_image": UnfoldAdminImageFieldWidget(attrs={"accept": "image/*"}),
            "ps2_icon_image": UnfoldAdminImageFieldWidget(attrs={"accept": "image/*"}),
            "ps3_icon_image": UnfoldAdminImageFieldWidget(attrs={"accept": "image/*"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # JSON в БД собирается в save(); сырое поле payload не показываем.
        self.fields.pop("payload", None)
        self._reorder_fields_for_homepage_editor()
        merged = merged_home_payload(self.instance.payload if self.instance.pk else None)
        self._apply_initial(merged)

    def _reorder_fields_for_homepage_editor(self) -> None:
        """Витринный порядок по блокам/слайдам, а не file-first (см. homepage_full_form_field_order)."""
        if not self.fields:
            return
        from config.homepage_nav import homepage_full_form_field_order

        desired = homepage_full_form_field_order()
        out: OrderedDict[str, forms.Field] = OrderedDict()
        for name in desired:
            if name in self.fields:
                out[name] = self.fields[name]
        for name, f in self.fields.items():
            if name not in out:
                out[name] = f
        self.fields = out

    def _apply_initial(self, m: dict[str, Any]) -> None:
        meta = m.get("meta") or {}
        self.initial.setdefault("meta_title", meta.get("title", ""))
        self.initial.setdefault("meta_description", meta.get("description", ""))
        self.initial.setdefault("meta_org_name", meta.get("orgName", ""))
        self.initial.setdefault("meta_org_description", meta.get("orgDescription", ""))

        hero = m.get("hero") or {}
        apply_hero_v2_initial(self.initial, hero)

        ps = m.get("problemSolution") or {}
        self.initial.setdefault("ps_heading", ps.get("heading", ""))
        self.initial.setdefault("ps_subheading", ps.get("subheading", ""))
        cards = ps.get("cards") if isinstance(ps.get("cards"), list) else []
        for i in range(4):
            c = cards[i] if i < len(cards) and isinstance(cards[i], dict) else {}
            self.initial.setdefault(f"ps{i}_problem", c.get("problem", ""))
            self.initial.setdefault(f"ps{i}_solution", c.get("solution", ""))
            kind = c.get("iconKind")
            if kind not in ("emoji", "fontawesome", "image"):
                kind = "emoji"
            self.initial.setdefault(f"ps{i}_icon_kind", kind)
            self.initial.setdefault(f"ps{i}_icon", c.get("icon", ""))
            fa_cls = (c.get("fontawesomeClass") or "").strip()
            if fa_cls in PRESET_CLASS_SET:
                self.initial.setdefault(f"ps{i}_fa_preset", fa_cls)
                self.initial.setdefault(f"ps{i}_fontawesome", "")
            else:
                self.initial.setdefault(f"ps{i}_fa_preset", "")
                self.initial.setdefault(f"ps{i}_fontawesome", fa_cls)

        tt = m.get("tentTypes") or {}
        proc = m.get("processTimeline") or {}
        self.initial.setdefault("proc_heading", proc.get("heading", ""))
        self.initial.setdefault("proc_subheading", proc.get("subheading", ""))
        steps = proc.get("steps") if isinstance(proc.get("steps"), list) else []
        for i in range(4):
            s = steps[i] if i < len(steps) and isinstance(steps[i], dict) else {}
            self.initial.setdefault(f"proc_s{i}_title", s.get("title", ""))
            self.initial.setdefault(f"proc_s{i}_text", s.get("text", ""))

        paths = m.get("purchasePaths") or {}
        self.initial.setdefault("paths_eyebrow", paths.get("eyebrow", ""))
        self.initial.setdefault("paths_heading", paths.get("heading", ""))
        self.initial.setdefault("paths_subheading", paths.get("subheading", ""))
        self.initial.setdefault("paths_ready_title", paths.get("readyTitle", ""))
        self.initial.setdefault("paths_ready_subtitle", paths.get("readySubtitle", ""))
        ready_bullets = paths.get("readyBullets") if isinstance(paths.get("readyBullets"), list) else []
        for i in range(3):
            bullet = ready_bullets[i] if i < len(ready_bullets) else ""
            self.initial.setdefault(f"paths_ready_b{i}", str(bullet or "").strip())
        self.initial.setdefault("paths_ready_cta", paths.get("readyCta", ""))
        self.initial.setdefault("paths_ready_href", paths.get("readyHref", ""))
        self.initial.setdefault("paths_custom_title", paths.get("customTitle", ""))
        self.initial.setdefault("paths_custom_subtitle", paths.get("customSubtitle", ""))
        custom_bullets = paths.get("customBullets") if isinstance(paths.get("customBullets"), list) else []
        for i in range(3):
            bullet = custom_bullets[i] if i < len(custom_bullets) else ""
            self.initial.setdefault(f"paths_custom_b{i}", str(bullet or "").strip())
        self.initial.setdefault("paths_custom_cta", paths.get("customCta", ""))
        self.initial.setdefault("paths_custom_href", paths.get("customHref", ""))

        self.initial.setdefault("tt_heading", tt.get("heading", ""))
        self.initial.setdefault("tt_subheading", tt.get("subheading", ""))

        feat = m.get("featured") or {}
        self.initial.setdefault("feat_heading", feat.get("heading", ""))
        self.initial.setdefault("feat_subheading", feat.get("subheading", ""))
        self.initial.setdefault("feat_catalog_cta", feat.get("catalogCta", ""))

        calc = m.get("calculator") or {}
        mode = calc.get("mode")
        self.initial.setdefault("calc_mode", mode if mode in ("calculator", "request_form") else "calculator")
        for key, suffix in (
            ("heading", "calc_heading"),
            ("subheading", "calc_subheading"),
            ("lengthLabel", "calc_length_label"),
            ("widthLabel", "calc_width_label"),
            ("materialLabel", "calc_material_label"),
            ("optionsLabel", "calc_options_label"),
            ("estimateLabel", "calc_estimate_label"),
            ("estimateNote", "calc_estimate_note"),
            ("nameLabel", "calc_name_label"),
            ("phoneLabel", "calc_phone_label"),
            ("commentLabel", "calc_comment_label"),
            ("namePlaceholder", "calc_name_placeholder"),
            ("phonePlaceholder", "calc_phone_placeholder"),
            ("commentPlaceholder", "calc_comment_placeholder"),
            ("submitButton", "calc_submit_button"),
            ("submitting", "calc_submitting"),
            ("successMessage", "calc_success_message"),
            ("requestFormTitle", "calc_request_title"),
            ("requestFormSubtitle", "calc_request_subtitle"),
            ("requestFormBenefit1", "calc_request_benefit_1"),
            ("requestFormBenefit2", "calc_request_benefit_2"),
            ("requestFormBenefit3", "calc_request_benefit_3"),
            ("step1Title", "calc_step_1_title"),
            ("step2Title", "calc_step_2_title"),
            ("virtualRulerTitle", "calc_virtual_ruler_title"),
            ("requestBadge", "calc_request_badge"),
            ("errorPhoneIncomplete", "calc_error_phone_incomplete"),
            ("errorCommentTooLong", "calc_error_comment_too_long"),
            ("errorSubmitFailed", "calc_error_submit_failed"),
            ("errorNetwork", "calc_error_network"),
            ("consentPrefix", "calc_consent_prefix"),
            ("consentPrivacyLinkLabel", "calc_consent_privacy_link"),
            ("consentAndLabel", "calc_consent_and"),
            ("consentOfferLinkLabel", "calc_consent_offer_link"),
        ):
            self.initial.setdefault(suffix, calc.get(key, ""))

        pm = calc.get("pricingModel")
        self.initial.setdefault(
            "calc_pricing_model",
            pm if pm in ("area_plus_options", "area_only", "options_only") else "area_plus_options",
        )
        try:
            self.initial.setdefault("calc_range_len_min", float(calc.get("lengthMinM", 1)))
        except (TypeError, ValueError):
            self.initial.setdefault("calc_range_len_min", 1.0)
        try:
            self.initial.setdefault("calc_range_len_max", float(calc.get("lengthMaxM", 30)))
        except (TypeError, ValueError):
            self.initial.setdefault("calc_range_len_max", 30.0)
        try:
            self.initial.setdefault("calc_range_wid_min", float(calc.get("widthMinM", 1)))
        except (TypeError, ValueError):
            self.initial.setdefault("calc_range_wid_min", 1.0)
        try:
            self.initial.setdefault("calc_range_wid_max", float(calc.get("widthMaxM", 20)))
        except (TypeError, ValueError):
            self.initial.setdefault("calc_range_wid_max", 20.0)
        try:
            self.initial.setdefault("calc_min_total_rub", int(calc.get("minimumTotalRub", 0)))
        except (TypeError, ValueError):
            self.initial.setdefault("calc_min_total_rub", 0)
        try:
            rs = int(calc.get("roundingStep", 1))
        except (TypeError, ValueError):
            rs = 1
        self.initial.setdefault("calc_round_step", rs if rs in (1, 10, 50, 100, 500, 1000) else 1)
        mats = calc.get("materials") if isinstance(calc.get("materials"), list) else []
        for i in range(5):
            row = mats[i] if i < len(mats) and isinstance(mats[i], dict) else {}
            self.initial.setdefault(f"calc_m{i}_id", str(row.get("id", "") or "").strip())
            self.initial.setdefault(f"calc_m{i}_label", str(row.get("label", "") or "").strip())
            try:
                self.initial.setdefault(f"calc_m{i}_price_m2", int(row.get("pricePerM2", 0)))
            except (TypeError, ValueError):
                self.initial.setdefault(f"calc_m{i}_price_m2", 0)
        opts = calc.get("options") if isinstance(calc.get("options"), list) else []
        for i in range(6):
            row = opts[i] if i < len(opts) and isinstance(opts[i], dict) else {}
            self.initial.setdefault(f"calc_o{i}_id", str(row.get("id", "") or "").strip())
            self.initial.setdefault(f"calc_o{i}_label", str(row.get("label", "") or "").strip())
            try:
                self.initial.setdefault(f"calc_o{i}_price", int(row.get("price", 0)))
            except (TypeError, ValueError):
                self.initial.setdefault(f"calc_o{i}_price", 0)

        port = m.get("portfolio") or {}
        self.initial.setdefault("port_heading", port.get("heading", ""))
        self.initial.setdefault("port_subheading", port.get("subheading", ""))
        self.initial.setdefault("port_page_heading", port.get("pageHeading", ""))
        self.initial.setdefault("port_page_subheading", port.get("pageSubheading", ""))
        flt = port.get("filters")
        if isinstance(flt, list):
            self.initial.setdefault("port_filters", ", ".join(str(x) for x in flt))
        else:
            self.initial.setdefault("port_filters", "")
        self.initial.setdefault("port_loading", port.get("loading", ""))
        self.initial.setdefault("port_empty", port.get("empty", ""))
        self.initial.setdefault("port_all_cta", port.get("allProjectsCta", ""))

        why = m.get("whyUs") or {}
        self.initial.setdefault("why_heading", why.get("heading", ""))
        self.initial.setdefault("why_subheading", why.get("subheading", ""))
        stats = why.get("stats") if isinstance(why.get("stats"), list) else []
        for i in range(3):
            s = stats[i] if i < len(stats) and isinstance(stats[i], dict) else {}
            raw_v = s.get("value", 0)
            try:
                iv = int(raw_v)
            except (TypeError, ValueError):
                iv = 0
            self.initial.setdefault(f"why_s{i}_value", iv)
            self.initial.setdefault(f"why_s{i}_suffix", s.get("suffix", ""))
            self.initial.setdefault(f"why_s{i}_label", s.get("label", ""))
        cols = why.get("columns") if isinstance(why.get("columns"), list) else []
        for i in range(4):
            c = cols[i] if i < len(cols) and isinstance(cols[i], dict) else {}
            self.initial.setdefault(f"why_c{i}_title", c.get("title", ""))
            self.initial.setdefault(f"why_c{i}_text", c.get("text", ""))
            self.initial.setdefault(f"why_c{i}_icon", c.get("icon", ""))

        rev = m.get("reviews") or {}
        self.initial.setdefault("rev_heading", rev.get("heading", ""))
        self.initial.setdefault("rev_subheading", rev.get("subheading", ""))
        self.initial.setdefault("rev_loading", rev.get("loading", ""))
        self.initial.setdefault("rev_video_caption", rev.get("videoCaption", ""))
        self.initial.setdefault("rev_read_more_label", rev.get("readMoreLabel", ""))
        self.initial.setdefault("rev_collapse_label", rev.get("collapseLabel", ""))
        self.initial.setdefault("rev_form_heading", rev.get("formHeading", ""))
        self.initial.setdefault("rev_form_subheading", rev.get("formSubheading", ""))
        self.initial.setdefault("rev_name_placeholder", rev.get("namePlaceholder", ""))
        self.initial.setdefault("rev_city_placeholder", rev.get("cityPlaceholder", ""))
        self.initial.setdefault("rev_text_placeholder", rev.get("textPlaceholder", ""))
        self.initial.setdefault("rev_consent_prefix", rev.get("consentPrefix", ""))
        self.initial.setdefault("rev_consent_link_label", rev.get("consentLinkLabel", ""))
        self.initial.setdefault("rev_submit_button", rev.get("submitButton", ""))
        self.initial.setdefault("rev_submitting", rev.get("submitting", ""))
        self.initial.setdefault("rev_success_message", rev.get("successMessage", ""))
        self.initial.setdefault("rev_error_message", rev.get("errorMessage", ""))

        blog = m.get("blog") or {}
        self.initial.setdefault("blog_heading", blog.get("heading", ""))
        self.initial.setdefault("blog_subheading", blog.get("subheading", ""))
        self.initial.setdefault("blog_all_link", blog.get("allLink", ""))
        self.initial.setdefault("blog_read_more", blog.get("readMore", ""))
        self.initial.setdefault("blog_loading", blog.get("loading", ""))

        mf = m.get("mapForm") or {}
        self.initial.setdefault("map_heading", mf.get("heading", ""))
        self.initial.setdefault("map_subheading", mf.get("subheading", ""))
        self.initial.setdefault("map_iframe_src", mf.get("mapIframeSrc", ""))
        self.initial.setdefault("map_title", mf.get("mapTitle", ""))
        self.initial.setdefault("map_form_name_label", mf.get("formNameLabel", ""))
        self.initial.setdefault("map_form_phone_label", mf.get("formPhoneLabel", ""))
        self.initial.setdefault("map_form_comment_label", mf.get("formCommentLabel", ""))
        self.initial.setdefault("map_name_placeholder", mf.get("namePlaceholder", ""))
        self.initial.setdefault("map_phone_placeholder", mf.get("phonePlaceholder", ""))
        self.initial.setdefault("map_comment_placeholder", mf.get("commentPlaceholder", ""))
        self.initial.setdefault("map_submit_button", mf.get("submitButton", ""))

        ui = m.get("ui") or {}
        self.initial.setdefault("ui_loading_featured", ui.get("loadingFeatured", ""))
        self.initial.setdefault("ui_buy_marketplaces", ui.get("buyOnMarketplaces", ""))
        self.initial.setdefault("ui_buy_marketplaces_mobile", ui.get("buyOnMarketplacesMobile", ""))
        self.initial.setdefault("ui_nav_home", ui.get("navHome", ""))
        self.initial.setdefault("ui_nav_catalog", ui.get("navCatalog", ""))
        self.initial.setdefault("ui_nav_portfolio", ui.get("navPortfolio", ""))
        self.initial.setdefault("ui_nav_contacts", ui.get("navContacts", ""))
        self.initial.setdefault("ui_nav_blog", ui.get("navBlog", ""))
        self.initial.setdefault("ui_nav_cart", ui.get("navCart", ""))
        self.initial.setdefault("ui_nav_account", ui.get("navAccount", ""))
        self.initial.setdefault("ui_nav_menu_title", ui.get("navMenuTitle", ""))
        self.initial.setdefault("ui_nav_menu_subtitle", ui.get("navMenuSubtitle", ""))
        self.initial.setdefault("ui_mobile_bar_profile", ui.get("mobileBarProfile", ""))
        self.initial.setdefault("ui_footer_nav_title", ui.get("footerNavTitle", ""))
        self.initial.setdefault("ui_footer_marketplaces_title", ui.get("footerMarketplacesTitle", ""))
        self.initial.setdefault("ui_footer_social_title", ui.get("footerSocialTitle", ""))
        self.initial.setdefault("ui_footer_contacts_title", ui.get("footerContactsTitle", ""))
        self.initial.setdefault("ui_footer_payment_title", ui.get("footerPaymentTitle", ""))
        self.initial.setdefault("ui_footer_delivery_title", ui.get("footerDeliveryTitle", ""))
        self.initial.setdefault("ui_footer_staff_login", ui.get("footerStaffLogin", ""))
        self.initial.setdefault("ui_footer_privacy_link", ui.get("footerPrivacyLink", ""))
        self.initial.setdefault("ui_footer_offer_link", ui.get("footerOfferLink", ""))
        self.initial.setdefault("ui_footer_copyright_suffix", ui.get("footerCopyrightSuffix", ""))
        self.initial.setdefault("ui_header_main_menu_aria", ui.get("headerMainMenuAria", ""))
        self.initial.setdefault("ui_header_theme_to_light_aria", ui.get("headerThemeToLightAria", ""))
        self.initial.setdefault("ui_header_theme_to_dark_aria", ui.get("headerThemeToDarkAria", ""))
        self.initial.setdefault("ui_header_theme_light_title", ui.get("headerThemeLightTitle", ""))
        self.initial.setdefault("ui_header_theme_dark_title", ui.get("headerThemeDarkTitle", ""))
        self.initial.setdefault("ui_header_menu_open_aria", ui.get("headerMenuOpenAria", ""))
        self.initial.setdefault("ui_header_menu_close_aria", ui.get("headerMenuCloseAria", ""))
        self.initial.setdefault("ui_header_mobile_menu_aria", ui.get("headerMobileMenuAria", ""))
        self.initial.setdefault("ui_header_bottom_nav_aria", ui.get("headerBottomNavAria", ""))
        self.initial.setdefault("ui_staff_modal_close_overlay_aria", ui.get("staffModalCloseOverlayAria", ""))
        self.initial.setdefault("ui_staff_modal_close_button_aria", ui.get("staffModalCloseButtonAria", ""))
        self.initial.setdefault("ui_staff_modal_title", ui.get("staffModalTitle", ""))
        self.initial.setdefault("ui_staff_modal_subtitle", ui.get("staffModalSubtitle", ""))
        self.initial.setdefault("ui_staff_modal_manager_label", ui.get("staffModalManagerLabel", ""))
        self.initial.setdefault("ui_staff_modal_manager_hint", ui.get("staffModalManagerHint", ""))
        self.initial.setdefault("ui_staff_modal_admin_label", ui.get("staffModalAdminLabel", ""))
        self.initial.setdefault("ui_staff_modal_admin_hint", ui.get("staffModalAdminHint", ""))
        self.initial.setdefault("ui_intro_aria_label", ui.get("introAriaLabel", ""))
        self.initial.setdefault("ui_intro_tag_1", ui.get("introTag1", ""))
        self.initial.setdefault("ui_intro_tag_2", ui.get("introTag2", ""))
        self.initial.setdefault("ui_intro_tag_3", ui.get("introTag3", ""))
        self.initial.setdefault("ui_intro_title", ui.get("introTitle", ""))
        self.initial.setdefault("ui_intro_subtitle", ui.get("introSubtitle", ""))
        self.initial.setdefault("ui_intro_stage_1", ui.get("introStage1", ""))
        self.initial.setdefault("ui_intro_stage_2", ui.get("introStage2", ""))
        self.initial.setdefault("ui_intro_stage_3", ui.get("introStage3", ""))
        self.initial.setdefault("ui_intro_skip_button", ui.get("introSkipButton", ""))
        self.initial.setdefault("ui_product_no_photo", ui.get("productNoPhoto", ""))
        self.initial.setdefault("ui_product_price_prefix", ui.get("productPricePrefix", ""))
        self.initial.setdefault("ui_product_add_to_cart", ui.get("productAddToCart", ""))
        self.initial.setdefault("ui_product_added_title", ui.get("productAddedTitle", ""))
        self.initial.setdefault("ui_product_continue_shopping", ui.get("productContinueShopping", ""))
        self.initial.setdefault("ui_product_go_to_cart", ui.get("productGoToCart", ""))
        self.initial.setdefault("ui_product_marketplaces_title", ui.get("productMarketplacesTitle", ""))
        self.initial.setdefault("ui_product_badge_in_stock", ui.get("productBadgeInStock", ""))
        self.initial.setdefault("ui_product_badge_seasonal", ui.get("productBadgeSeasonal", ""))
        self.initial.setdefault("ui_cart_page_title", ui.get("cartPageTitle", ""))
        self.initial.setdefault("ui_cart_page_intro", ui.get("cartPageIntro", ""))
        self.initial.setdefault("ui_cart_empty_title", ui.get("cartEmptyTitle", ""))
        self.initial.setdefault("ui_cart_empty_text", ui.get("cartEmptyText", ""))
        self.initial.setdefault("ui_cart_empty_cta", ui.get("cartEmptyCta", ""))
        self.initial.setdefault("ui_cart_items_title", ui.get("cartItemsTitle", ""))
        self.initial.setdefault("ui_cart_no_photo", ui.get("cartNoPhoto", ""))
        self.initial.setdefault("ui_cart_price_per_unit_prefix", ui.get("cartPricePerUnitPrefix", ""))
        self.initial.setdefault("ui_cart_price_per_unit_suffix", ui.get("cartPricePerUnitSuffix", ""))
        self.initial.setdefault("ui_cart_qty_label", ui.get("cartQtyLabel", ""))
        self.initial.setdefault("ui_cart_remove_or_decrease_aria", ui.get("cartRemoveOrDecreaseAria", ""))
        self.initial.setdefault("ui_cart_increase_aria", ui.get("cartIncreaseAria", ""))
        self.initial.setdefault("ui_cart_remove_line", ui.get("cartRemoveLine", ""))
        self.initial.setdefault("ui_cart_add_more_cta", ui.get("cartAddMoreCta", ""))
        self.initial.setdefault("ui_cart_summary_title", ui.get("cartSummaryTitle", ""))
        self.initial.setdefault("ui_cart_summary_items_label", ui.get("cartSummaryItemsLabel", ""))
        self.initial.setdefault("ui_cart_summary_approx_label", ui.get("cartSummaryApproxLabel", ""))
        self.initial.setdefault("ui_cart_summary_delivery_note", ui.get("cartSummaryDeliveryNote", ""))
        self.initial.setdefault("ui_cart_checkout_button", ui.get("cartCheckoutButton", ""))
        self.initial.setdefault("ui_cart_checkout_footnote", ui.get("cartCheckoutFootnote", ""))
        self.initial.setdefault("ui_cart_terms_prefix", ui.get("cartTermsPrefix", ""))
        self.initial.setdefault("ui_product_not_found_title", ui.get("productNotFoundTitle", ""))
        self.initial.setdefault("ui_product_not_found_text", ui.get("productNotFoundText", ""))
        self.initial.setdefault("ui_product_back_to_catalog", ui.get("productBackToCatalog", ""))
        self.initial.setdefault("ui_product_breadcrumb_aria", ui.get("productBreadcrumbAria", ""))
        self.initial.setdefault("ui_product_breadcrumb_home", ui.get("productBreadcrumbHome", ""))
        self.initial.setdefault("ui_product_breadcrumb_catalog", ui.get("productBreadcrumbCatalog", ""))
        self.initial.setdefault("ui_product_price_label", ui.get("productPriceLabel", ""))
        self.initial.setdefault("ui_product_variant_label", ui.get("productVariantLabel", ""))
        self.initial.setdefault("ui_product_details_button", ui.get("productDetailsButton", ""))
        self.initial.setdefault("ui_product_marketplaces_card_title", ui.get("productMarketplacesCardTitle", ""))
        self.initial.setdefault("ui_product_marketplaces_card_hint", ui.get("productMarketplacesCardHint", ""))
        self.initial.setdefault("ui_product_custom_order_cta", ui.get("productCustomOrderCta", ""))
        self.initial.setdefault("ui_product_related_title", ui.get("productRelatedTitle", ""))
        self.initial.setdefault("ui_product_related_subtitle_prefix", ui.get("productRelatedSubtitlePrefix", ""))
        self.initial.setdefault("ui_product_material_map_subtitle_fallback", ui.get("productMaterialMapSubtitleFallback", ""))

    def _build_payload(self, cd: dict[str, Any]) -> dict[str, Any]:
        base = default_home_payload()
        base["meta"] = {
            "title": cd["meta_title"].strip(),
            "description": cd["meta_description"].strip(),
            "orgName": cd["meta_org_name"].strip(),
            "orgDescription": cd["meta_org_description"].strip(),
        }
        base["hero"] = {
            "schemaVersion": 2,
            "slides": [build_hero_slide_from_cd(cd, n) for n in range(1, 7)],
        }
        base["problemSolution"] = {
            "heading": cd["ps_heading"].strip(),
            "subheading": cd["ps_subheading"].strip(),
            "cards": [_ps_problem_solution_card(cd, i) for i in range(4)],
        }
        base["tentTypes"] = {
            "heading": cd["tt_heading"].strip(),
            "subheading": cd["tt_subheading"].strip(),
        }
        base["processTimeline"] = {
            "heading": cd["proc_heading"].strip(),
            "subheading": cd["proc_subheading"].strip(),
            "steps": [
                {
                    "title": cd[f"proc_s{i}_title"].strip(),
                    "text": cd[f"proc_s{i}_text"].strip(),
                }
                for i in range(4)
            ],
        }
        base["purchasePaths"] = {
            "eyebrow": cd["paths_eyebrow"].strip(),
            "heading": cd["paths_heading"].strip(),
            "subheading": cd["paths_subheading"].strip(),
            "readyTitle": cd["paths_ready_title"].strip(),
            "readySubtitle": cd["paths_ready_subtitle"].strip(),
            "readyBullets": [cd[f"paths_ready_b{i}"].strip() for i in range(3)],
            "readyCta": cd["paths_ready_cta"].strip(),
            "readyHref": cd["paths_ready_href"].strip(),
            "customTitle": cd["paths_custom_title"].strip(),
            "customSubtitle": cd["paths_custom_subtitle"].strip(),
            "customBullets": [cd[f"paths_custom_b{i}"].strip() for i in range(3)],
            "customCta": cd["paths_custom_cta"].strip(),
            "customHref": cd["paths_custom_href"].strip(),
        }
        base["featured"] = {
            "heading": cd["feat_heading"].strip(),
            "subheading": cd["feat_subheading"].strip(),
            "catalogCta": cd["feat_catalog_cta"].strip(),
        }
        calc_materials: list[dict[str, Any]] = []
        for i in range(5):
            label = str(cd.get(f"calc_m{i}_label") or "").strip()
            if not label:
                continue
            try:
                ppm = int(cd.get(f"calc_m{i}_price_m2") or 0)
            except (TypeError, ValueError):
                ppm = 0
            if ppm <= 0:
                continue
            raw_id = str(cd.get(f"calc_m{i}_id") or "").strip()
            mid = _calc_safe_id(raw_id, f"mat{i}")
            calc_materials.append({"id": mid, "label": label, "pricePerM2": ppm})
        calc_options: list[dict[str, Any]] = []
        for i in range(6):
            label = str(cd.get(f"calc_o{i}_label") or "").strip()
            if not label:
                continue
            try:
                pr = int(cd.get(f"calc_o{i}_price") or 0)
            except (TypeError, ValueError):
                pr = 0
            if pr < 0:
                continue
            raw_id = str(cd.get(f"calc_o{i}_id") or "").strip()
            oid = _calc_safe_id(raw_id, f"opt{i}")
            calc_options.append({"id": oid, "label": label, "price": pr})
        base["calculator"] = {
            "mode": cd["calc_mode"],
            "heading": cd["calc_heading"].strip(),
            "subheading": cd["calc_subheading"].strip(),
            "lengthLabel": cd["calc_length_label"].strip(),
            "widthLabel": cd["calc_width_label"].strip(),
            "materialLabel": cd["calc_material_label"].strip(),
            "optionsLabel": cd["calc_options_label"].strip(),
            "estimateLabel": cd["calc_estimate_label"].strip(),
            "estimateNote": cd["calc_estimate_note"].strip(),
            "nameLabel": cd["calc_name_label"].strip(),
            "phoneLabel": cd["calc_phone_label"].strip(),
            "commentLabel": cd["calc_comment_label"].strip(),
            "namePlaceholder": cd["calc_name_placeholder"].strip(),
            "phonePlaceholder": cd["calc_phone_placeholder"].strip(),
            "commentPlaceholder": cd["calc_comment_placeholder"].strip(),
            "submitButton": cd["calc_submit_button"].strip(),
            "submitting": cd["calc_submitting"].strip(),
            "successMessage": cd["calc_success_message"].strip(),
            "requestFormTitle": cd["calc_request_title"].strip(),
            "requestFormSubtitle": cd["calc_request_subtitle"].strip(),
            "requestFormBenefit1": cd["calc_request_benefit_1"].strip(),
            "requestFormBenefit2": cd["calc_request_benefit_2"].strip(),
            "requestFormBenefit3": cd["calc_request_benefit_3"].strip(),
            "step1Title": cd["calc_step_1_title"].strip(),
            "step2Title": cd["calc_step_2_title"].strip(),
            "virtualRulerTitle": cd["calc_virtual_ruler_title"].strip(),
            "requestBadge": cd["calc_request_badge"].strip(),
            "errorPhoneIncomplete": cd["calc_error_phone_incomplete"].strip(),
            "errorCommentTooLong": cd["calc_error_comment_too_long"].strip(),
            "errorSubmitFailed": cd["calc_error_submit_failed"].strip(),
            "errorNetwork": cd["calc_error_network"].strip(),
            "consentPrefix": cd["calc_consent_prefix"].strip(),
            "consentPrivacyLinkLabel": cd["calc_consent_privacy_link"].strip(),
            "consentAndLabel": cd["calc_consent_and"].strip(),
            "consentOfferLinkLabel": cd["calc_consent_offer_link"].strip(),
            "pricingModel": cd["calc_pricing_model"],
            "lengthMinM": float(cd["calc_range_len_min"]),
            "lengthMaxM": float(cd["calc_range_len_max"]),
            "widthMinM": float(cd["calc_range_wid_min"]),
            "widthMaxM": float(cd["calc_range_wid_max"]),
            "minimumTotalRub": int(cd["calc_min_total_rub"]),
            "roundingStep": int(cd["calc_round_step"]),
            "materials": calc_materials,
            "options": calc_options,
        }
        raw_filters = [x.strip() for x in cd["port_filters"].split(",") if x.strip()]
        base["portfolio"] = {
            "heading": cd["port_heading"].strip(),
            "subheading": cd["port_subheading"].strip(),
            "pageHeading": cd["port_page_heading"].strip(),
            "pageSubheading": cd["port_page_subheading"].strip(),
            "filters": raw_filters or default_home_payload()["portfolio"]["filters"],
            "loading": cd["port_loading"].strip(),
            "empty": cd["port_empty"].strip(),
            "allProjectsCta": cd["port_all_cta"].strip(),
        }
        base["whyUs"] = {
            "heading": cd["why_heading"].strip(),
            "subheading": cd["why_subheading"].strip(),
            "stats": [
                {
                    "value": int(cd[f"why_s{i}_value"]),
                    "suffix": cd[f"why_s{i}_suffix"].strip(),
                    "label": cd[f"why_s{i}_label"].strip(),
                }
                for i in range(3)
            ],
            "columns": [
                {
                    "title": cd[f"why_c{i}_title"].strip(),
                    "text": cd[f"why_c{i}_text"].strip(),
                    "icon": cd[f"why_c{i}_icon"].strip() or "•",
                }
                for i in range(4)
            ],
        }
        base["reviews"] = {
            "heading": cd["rev_heading"].strip(),
            "subheading": cd["rev_subheading"].strip(),
            "loading": cd["rev_loading"].strip(),
            "videoCaption": cd["rev_video_caption"].strip(),
            "readMoreLabel": cd["rev_read_more_label"].strip(),
            "collapseLabel": cd["rev_collapse_label"].strip(),
            "formHeading": cd["rev_form_heading"].strip(),
            "formSubheading": cd["rev_form_subheading"].strip(),
            "namePlaceholder": cd["rev_name_placeholder"].strip(),
            "cityPlaceholder": cd["rev_city_placeholder"].strip(),
            "textPlaceholder": cd["rev_text_placeholder"].strip(),
            "consentPrefix": cd["rev_consent_prefix"].strip(),
            "consentLinkLabel": cd["rev_consent_link_label"].strip(),
            "submitButton": cd["rev_submit_button"].strip(),
            "submitting": cd["rev_submitting"].strip(),
            "successMessage": cd["rev_success_message"].strip(),
            "errorMessage": cd["rev_error_message"].strip(),
        }
        base["blog"] = {
            "heading": cd["blog_heading"].strip(),
            "subheading": cd["blog_subheading"].strip(),
            "allLink": cd["blog_all_link"].strip(),
            "readMore": cd["blog_read_more"].strip(),
            "loading": cd["blog_loading"].strip(),
        }
        base["mapForm"] = {
            "heading": cd["map_heading"].strip(),
            "subheading": cd["map_subheading"].strip(),
            "mapIframeSrc": cd["map_iframe_src"].strip(),
            "mapTitle": cd["map_title"].strip(),
            "formNameLabel": cd["map_form_name_label"].strip(),
            "formPhoneLabel": cd["map_form_phone_label"].strip(),
            "formCommentLabel": cd["map_form_comment_label"].strip(),
            "namePlaceholder": cd["map_name_placeholder"].strip(),
            "phonePlaceholder": cd["map_phone_placeholder"].strip(),
            "commentPlaceholder": cd["map_comment_placeholder"].strip(),
            "submitButton": cd["map_submit_button"].strip(),
        }
        base["ui"] = {
            "loadingFeatured": cd["ui_loading_featured"].strip(),
            "buyOnMarketplaces": cd["ui_buy_marketplaces"].strip(),
            "buyOnMarketplacesMobile": cd["ui_buy_marketplaces_mobile"].strip(),
            "navHome": cd["ui_nav_home"].strip(),
            "navCatalog": cd["ui_nav_catalog"].strip(),
            "navPortfolio": cd["ui_nav_portfolio"].strip(),
            "navContacts": cd["ui_nav_contacts"].strip(),
            "navBlog": cd["ui_nav_blog"].strip(),
            "navCart": cd["ui_nav_cart"].strip(),
            "navAccount": cd["ui_nav_account"].strip(),
            "navMenuTitle": cd["ui_nav_menu_title"].strip(),
            "navMenuSubtitle": cd["ui_nav_menu_subtitle"].strip(),
            "mobileBarProfile": cd["ui_mobile_bar_profile"].strip(),
            "footerNavTitle": cd["ui_footer_nav_title"].strip(),
            "footerMarketplacesTitle": cd["ui_footer_marketplaces_title"].strip(),
            "footerSocialTitle": cd["ui_footer_social_title"].strip(),
            "footerContactsTitle": cd["ui_footer_contacts_title"].strip(),
            "footerPaymentTitle": cd["ui_footer_payment_title"].strip(),
            "footerDeliveryTitle": cd["ui_footer_delivery_title"].strip(),
            "footerStaffLogin": cd["ui_footer_staff_login"].strip(),
            "footerPrivacyLink": cd["ui_footer_privacy_link"].strip(),
            "footerOfferLink": cd["ui_footer_offer_link"].strip(),
            "footerCopyrightSuffix": cd["ui_footer_copyright_suffix"].strip(),
            "headerMainMenuAria": cd["ui_header_main_menu_aria"].strip(),
            "headerThemeToLightAria": cd["ui_header_theme_to_light_aria"].strip(),
            "headerThemeToDarkAria": cd["ui_header_theme_to_dark_aria"].strip(),
            "headerThemeLightTitle": cd["ui_header_theme_light_title"].strip(),
            "headerThemeDarkTitle": cd["ui_header_theme_dark_title"].strip(),
            "headerMenuOpenAria": cd["ui_header_menu_open_aria"].strip(),
            "headerMenuCloseAria": cd["ui_header_menu_close_aria"].strip(),
            "headerMobileMenuAria": cd["ui_header_mobile_menu_aria"].strip(),
            "headerBottomNavAria": cd["ui_header_bottom_nav_aria"].strip(),
            "staffModalCloseOverlayAria": cd["ui_staff_modal_close_overlay_aria"].strip(),
            "staffModalCloseButtonAria": cd["ui_staff_modal_close_button_aria"].strip(),
            "staffModalTitle": cd["ui_staff_modal_title"].strip(),
            "staffModalSubtitle": cd["ui_staff_modal_subtitle"].strip(),
            "staffModalManagerLabel": cd["ui_staff_modal_manager_label"].strip(),
            "staffModalManagerHint": cd["ui_staff_modal_manager_hint"].strip(),
            "staffModalAdminLabel": cd["ui_staff_modal_admin_label"].strip(),
            "staffModalAdminHint": cd["ui_staff_modal_admin_hint"].strip(),
            "introAriaLabel": cd["ui_intro_aria_label"].strip(),
            "introTag1": cd["ui_intro_tag_1"].strip(),
            "introTag2": cd["ui_intro_tag_2"].strip(),
            "introTag3": cd["ui_intro_tag_3"].strip(),
            "introTitle": cd["ui_intro_title"].strip(),
            "introSubtitle": cd["ui_intro_subtitle"].strip(),
            "introStage1": cd["ui_intro_stage_1"].strip(),
            "introStage2": cd["ui_intro_stage_2"].strip(),
            "introStage3": cd["ui_intro_stage_3"].strip(),
            "introSkipButton": cd["ui_intro_skip_button"].strip(),
            "productNoPhoto": cd["ui_product_no_photo"].strip(),
            "productPricePrefix": cd["ui_product_price_prefix"].strip(),
            "productAddToCart": cd["ui_product_add_to_cart"].strip(),
            "productAddedTitle": cd["ui_product_added_title"].strip(),
            "productContinueShopping": cd["ui_product_continue_shopping"].strip(),
            "productGoToCart": cd["ui_product_go_to_cart"].strip(),
            "productMarketplacesTitle": cd["ui_product_marketplaces_title"].strip(),
            "productBadgeInStock": cd["ui_product_badge_in_stock"].strip(),
            "productBadgeSeasonal": cd["ui_product_badge_seasonal"].strip(),
            "cartPageTitle": cd["ui_cart_page_title"].strip(),
            "cartPageIntro": cd["ui_cart_page_intro"].strip(),
            "cartEmptyTitle": cd["ui_cart_empty_title"].strip(),
            "cartEmptyText": cd["ui_cart_empty_text"].strip(),
            "cartEmptyCta": cd["ui_cart_empty_cta"].strip(),
            "cartItemsTitle": cd["ui_cart_items_title"].strip(),
            "cartNoPhoto": cd["ui_cart_no_photo"].strip(),
            "cartPricePerUnitPrefix": cd["ui_cart_price_per_unit_prefix"].strip(),
            "cartPricePerUnitSuffix": cd["ui_cart_price_per_unit_suffix"].strip(),
            "cartQtyLabel": cd["ui_cart_qty_label"].strip(),
            "cartRemoveOrDecreaseAria": cd["ui_cart_remove_or_decrease_aria"].strip(),
            "cartIncreaseAria": cd["ui_cart_increase_aria"].strip(),
            "cartRemoveLine": cd["ui_cart_remove_line"].strip(),
            "cartAddMoreCta": cd["ui_cart_add_more_cta"].strip(),
            "cartSummaryTitle": cd["ui_cart_summary_title"].strip(),
            "cartSummaryItemsLabel": cd["ui_cart_summary_items_label"].strip(),
            "cartSummaryApproxLabel": cd["ui_cart_summary_approx_label"].strip(),
            "cartSummaryDeliveryNote": cd["ui_cart_summary_delivery_note"].strip(),
            "cartCheckoutButton": cd["ui_cart_checkout_button"].strip(),
            "cartCheckoutFootnote": cd["ui_cart_checkout_footnote"].strip(),
            "cartTermsPrefix": cd["ui_cart_terms_prefix"].strip(),
            "productNotFoundTitle": cd["ui_product_not_found_title"].strip(),
            "productNotFoundText": cd["ui_product_not_found_text"].strip(),
            "productBackToCatalog": cd["ui_product_back_to_catalog"].strip(),
            "productBreadcrumbAria": cd["ui_product_breadcrumb_aria"].strip(),
            "productBreadcrumbHome": cd["ui_product_breadcrumb_home"].strip(),
            "productBreadcrumbCatalog": cd["ui_product_breadcrumb_catalog"].strip(),
            "productPriceLabel": cd["ui_product_price_label"].strip(),
            "productVariantLabel": cd["ui_product_variant_label"].strip(),
            "productDetailsButton": cd["ui_product_details_button"].strip(),
            "productMarketplacesCardTitle": cd["ui_product_marketplaces_card_title"].strip(),
            "productMarketplacesCardHint": cd["ui_product_marketplaces_card_hint"].strip(),
            "productCustomOrderCta": cd["ui_product_custom_order_cta"].strip(),
            "productRelatedTitle": cd["ui_product_related_title"].strip(),
            "productRelatedSubtitlePrefix": cd["ui_product_related_subtitle_prefix"].strip(),
            "productMaterialMapSubtitleFallback": cd["ui_product_material_map_subtitle_fallback"].strip(),
        }
        return base

    def clean(self):
        cleaned = super().clean()
        if "calc_range_len_min" not in self.fields:
            return cleaned
        lmin, lmax = cleaned.get("calc_range_len_min"), cleaned.get("calc_range_len_max")
        wmin, wmax = cleaned.get("calc_range_wid_min"), cleaned.get("calc_range_wid_max")
        try:
            if lmin is not None and lmax is not None and float(lmin) >= float(lmax):
                self.add_error(
                    "calc_range_len_max",
                    _("Максимум длины должен быть больше минимума."),
                )
        except (TypeError, ValueError):
            pass
        try:
            if wmin is not None and wmax is not None and float(wmin) >= float(wmax):
                self.add_error(
                    "calc_range_wid_max",
                    _("Максимум ширины должен быть больше минимума."),
                )
        except (TypeError, ValueError):
            pass
        mat_ids: dict[str, str] = {}
        mat_valid = 0
        for i in range(5):
            label = str(cleaned.get(f"calc_m{i}_label") or "").strip()
            raw_p = cleaned.get(f"calc_m{i}_price_m2")
            try:
                ppm = int(raw_p) if raw_p is not None and raw_p != "" else 0
            except (TypeError, ValueError):
                ppm = 0
            if not label or ppm <= 0:
                continue
            mat_valid += 1
            raw_id = str(cleaned.get(f"calc_m{i}_id") or "").strip()
            mid = _calc_safe_id(raw_id, f"mat{i}")
            prev = mat_ids.get(mid)
            if prev is not None:
                self.add_error(
                    f"calc_m{i}_id",
                    _("Повторяющийся id «%(id)s» (уже задан в %(field)s).")
                    % {"id": mid, "field": prev},
                )
            else:
                mat_ids[mid] = f"calc_m{i}_id"
        if mat_valid == 0:
            self.add_error(
                "calc_m0_label",
                _("Нужен хотя бы один материал с подписью и ценой ₽/м² больше 0."),
            )
        opt_ids: dict[str, str] = {}
        for i in range(6):
            label = str(cleaned.get(f"calc_o{i}_label") or "").strip()
            raw_p = cleaned.get(f"calc_o{i}_price")
            try:
                pr = int(raw_p) if raw_p is not None and raw_p != "" else 0
            except (TypeError, ValueError):
                pr = 0
            if not label:
                continue
            if pr < 0:
                self.add_error(f"calc_o{i}_price", _("Цена опции не может быть отрицательной."))
                continue
            raw_id = str(cleaned.get(f"calc_o{i}_id") or "").strip()
            oid = _calc_safe_id(raw_id, f"opt{i}")
            prev = opt_ids.get(oid)
            if prev is not None:
                self.add_error(
                    f"calc_o{i}_id",
                    _("Повторяющийся id «%(id)s» (уже задан в %(field)s).")
                    % {"id": oid, "field": prev},
                )
            else:
                opt_ids[oid] = f"calc_o{i}_id"
        return cleaned

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.payload = self._build_payload(self.cleaned_data)
        if commit:
            instance.save()
        return instance


def full_cleaned_dict_for_home_payload(instance: HomePageContent) -> dict[str, Any]:
    """Снимок всех виртуальных полей главной для сборки payload (без файлов модели)."""
    form = HomePageContentAdminForm(instance=instance)
    data: dict[str, Any] = {}
    for name, field in form.fields.items():
        if name in _MODEL_IMAGE_FIELDS:
            continue
        if name in form.initial:
            data[name] = form.initial[name]
            continue
        init = getattr(field, "initial", None)
        if isinstance(field, forms.IntegerField):
            data[name] = 0 if init is None else init
        elif isinstance(field, forms.FloatField):
            data[name] = float(init) if init is not None else 0.0
        elif isinstance(field, forms.TypedChoiceField):
            if init is not None:
                data[name] = init
            else:
                data[name] = field.choices[0][0]
        elif isinstance(field, forms.ChoiceField):
            if init is not None:
                data[name] = init
            else:
                data[name] = field.choices[0][0]
        elif isinstance(field, forms.BooleanField):
            if init is not None:
                data[name] = bool(init)
            else:
                data[name] = bool(getattr(field, "initial", False))
        else:
            data[name] = "" if init is None else init
    return data


def _apply_image_field(instance: HomePageContent, cleaned_data: dict[str, Any], field_name: str) -> None:
    if field_name not in cleaned_data:
        return
    val = cleaned_data[field_name]
    file_field = getattr(instance, field_name)
    if val is False:
        if file_field:
            file_field.delete(save=False)
        setattr(instance, field_name, None)
    elif val not in (None, ""):
        setattr(instance, field_name, val)


def apply_homepage_section_save(instance: HomePageContent, cleaned_data: dict[str, Any]) -> None:
    """Обновить payload и при необходимости файлы модели после сохранения блока."""
    full_cd = full_cleaned_dict_for_home_payload(instance)
    payload_keys = {k: v for k, v in cleaned_data.items() if k not in _MODEL_IMAGE_FIELDS}
    full_cd.update(payload_keys)
    ghost = HomePageContentAdminForm()
    instance.payload = ghost._build_payload(full_cd)
    for fname in _MODEL_IMAGE_FIELDS:
        _apply_image_field(instance, cleaned_data, fname)
    instance.save()


class HomePageSectionForm(HomePageContentAdminForm):
    """Один блок главной (подмножество полей)."""

    def __init__(self, *args, section_slug: str, **kwargs):
        self.section_slug = section_slug
        super().__init__(*args, **kwargs)
        from config.homepage_nav import SECTION_FIELDS

        allowed = set(SECTION_FIELDS[section_slug])
        for name in list(self.fields.keys()):
            if name not in allowed:
                del self.fields[name]
