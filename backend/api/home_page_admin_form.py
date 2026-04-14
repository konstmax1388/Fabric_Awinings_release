"""Форма админки главной: поля по блокам вместо сырого JSON."""

from __future__ import annotations

from typing import Any

from django import forms
from django.utils.translation import gettext_lazy as _
from unfold.widgets import UnfoldAdminImageFieldWidget

from .fa_icon_presets import FONTAWESOME_PRESET_CHOICES, PRESET_CLASS_SET
from .home_defaults import default_home_payload, merged_home_payload
from .models import HomePageContent

HERO_ACTION_CHOICES = (
    ("link", _("Переход по ссылке")),
    ("callback", _("Форма обратного звонка (попап)")),
)

_W = (
    "border border-base-200 rounded-default px-3 py-2 text-sm w-full max-w-4xl "
    "bg-white shadow-xs dark:border-base-700 dark:bg-base-900"
)
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


_MODEL_IMAGE_FIELDS = (
    "hero_background",
    "ps0_icon_image",
    "ps1_icon_image",
    "ps2_icon_image",
    "ps3_icon_image",
)


class HomePageContentAdminForm(forms.ModelForm):
    """Все поля блоков + скрытый payload (перезаписывается при сохранении)."""

    # --- meta (SEO, микроразметка) ---
    meta_title = _req_txt(_("Заголовок страницы (title)"))
    meta_description = _area(_("Описание (meta description)"), rows=3)
    meta_org_name = _req_txt(_("Название организации (schema.org)"))
    meta_org_description = _area(_("Описание организации (schema.org)"), rows=2)

    # --- hero ---
    hero_title = _req_txt(_("Заголовок"))
    hero_subtitle = _area(_("Подзаголовок"), rows=3)
    hero_cta_primary = _req_txt(_("Кнопка: основная (текст)"))
    hero_primary_action = forms.ChoiceField(
        label=_("Основная кнопка: действие"),
        choices=HERO_ACTION_CHOICES,
        widget=forms.Select(attrs={"class": _W}),
    )
    hero_primary_href = forms.CharField(
        label=_("Основная кнопка: URL (только для «По ссылке»)"),
        required=False,
        widget=forms.TextInput(attrs={"class": _W}),
        help_text=_("Путь на сайте или полный https://… Пусто — как раньше (калькулятор при включённом блоке, иначе каталог)."),
    )
    hero_cta_secondary = _req_txt(_("Кнопка: вторичная (текст)"))
    hero_secondary_action = forms.ChoiceField(
        label=_("Вторичная кнопка: действие"),
        choices=HERO_ACTION_CHOICES,
        widget=forms.Select(attrs={"class": _W}),
    )
    hero_secondary_href = forms.CharField(
        label=_("Вторичная кнопка: URL (только для «По ссылке»)"),
        required=False,
        widget=forms.TextInput(attrs={"class": _W}),
        help_text=_("Пусто — ссылка на каталог, как раньше."),
    )
    hero_cb_title = _req_txt(_("Попап обратного звонка: заголовок"))
    hero_cb_name_label = _req_txt(_("Попап: подпись поля «Имя»"))
    hero_cb_phone_label = _req_txt(_("Попап: подпись поля «Телефон»"))
    hero_cb_submit = _req_txt(_("Попап: текст кнопки отправки"))
    hero_cb_submitting = _req_txt(_("Попап: текст при отправке"))
    hero_cb_success = _area(_("Попап: сообщение после успеха"), rows=2)

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

    # --- tent types ---
    tt_heading = _req_txt(_("Заголовок"))
    tt_subheading = _area(_("Подзаголовок"), rows=3)

    # --- featured ---
    feat_heading = _req_txt(_("Заголовок"))
    feat_subheading = _area(_("Подзаголовок"), rows=2)
    feat_catalog_cta = _req_txt(_("Текст кнопки «в каталог»"))

    # --- calculator ---
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

    # --- portfolio ---
    port_heading = _req_txt(_("Заголовок"))
    port_subheading = _area(_("Подзаголовок"), rows=2)
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

    class Meta:
        model = HomePageContent
        fields = (
            "payload",
            "hero_background",
            "ps0_icon_image",
            "ps1_icon_image",
            "ps2_icon_image",
            "ps3_icon_image",
        )
        widgets = {
            "hero_background": UnfoldAdminImageFieldWidget(attrs={"accept": "image/*"}),
            "ps0_icon_image": UnfoldAdminImageFieldWidget(attrs={"accept": "image/*"}),
            "ps1_icon_image": UnfoldAdminImageFieldWidget(attrs={"accept": "image/*"}),
            "ps2_icon_image": UnfoldAdminImageFieldWidget(attrs={"accept": "image/*"}),
            "ps3_icon_image": UnfoldAdminImageFieldWidget(attrs={"accept": "image/*"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # JSON в БД собирается в save(); сырое поле payload не показываем.
        self.fields.pop("payload", None)
        merged = merged_home_payload(self.instance.payload if self.instance.pk else None)
        self._apply_initial(merged)

    def _apply_initial(self, m: dict[str, Any]) -> None:
        meta = m.get("meta") or {}
        self.initial.setdefault("meta_title", meta.get("title", ""))
        self.initial.setdefault("meta_description", meta.get("description", ""))
        self.initial.setdefault("meta_org_name", meta.get("orgName", ""))
        self.initial.setdefault("meta_org_description", meta.get("orgDescription", ""))

        hero = m.get("hero") or {}
        self.initial.setdefault("hero_title", hero.get("title", ""))
        self.initial.setdefault("hero_subtitle", hero.get("subtitle", ""))
        self.initial.setdefault("hero_cta_primary", hero.get("ctaPrimary", ""))
        self.initial.setdefault("hero_cta_secondary", hero.get("ctaSecondary", ""))
        pa = hero.get("primaryAction") if isinstance(hero.get("primaryAction"), dict) else {}
        ptype = pa.get("type")
        self.initial.setdefault(
            "hero_primary_action",
            ptype if ptype in ("link", "callback") else "link",
        )
        self.initial.setdefault("hero_primary_href", (pa.get("href") or "").strip())
        sa = hero.get("secondaryAction") if isinstance(hero.get("secondaryAction"), dict) else {}
        stype = sa.get("type")
        self.initial.setdefault(
            "hero_secondary_action",
            stype if stype in ("link", "callback") else "link",
        )
        self.initial.setdefault("hero_secondary_href", (sa.get("href") or "").strip())
        cb = hero.get("callbackModal") if isinstance(hero.get("callbackModal"), dict) else {}
        self.initial.setdefault("hero_cb_title", cb.get("title", ""))
        self.initial.setdefault("hero_cb_name_label", cb.get("nameLabel", ""))
        self.initial.setdefault("hero_cb_phone_label", cb.get("phoneLabel", ""))
        self.initial.setdefault("hero_cb_submit", cb.get("submitButton", ""))
        self.initial.setdefault("hero_cb_submitting", cb.get("submitting", ""))
        self.initial.setdefault("hero_cb_success", cb.get("successMessage", ""))

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
        self.initial.setdefault("tt_heading", tt.get("heading", ""))
        self.initial.setdefault("tt_subheading", tt.get("subheading", ""))

        feat = m.get("featured") or {}
        self.initial.setdefault("feat_heading", feat.get("heading", ""))
        self.initial.setdefault("feat_subheading", feat.get("subheading", ""))
        self.initial.setdefault("feat_catalog_cta", feat.get("catalogCta", ""))

        calc = m.get("calculator") or {}
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
        ):
            self.initial.setdefault(suffix, calc.get(key, ""))

        port = m.get("portfolio") or {}
        self.initial.setdefault("port_heading", port.get("heading", ""))
        self.initial.setdefault("port_subheading", port.get("subheading", ""))
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

    def _build_payload(self, cd: dict[str, Any]) -> dict[str, Any]:
        base = default_home_payload()
        base["meta"] = {
            "title": cd["meta_title"].strip(),
            "description": cd["meta_description"].strip(),
            "orgName": cd["meta_org_name"].strip(),
            "orgDescription": cd["meta_org_description"].strip(),
        }
        base["hero"] = {
            "title": cd["hero_title"].strip(),
            "subtitle": cd["hero_subtitle"].strip(),
            "ctaPrimary": cd["hero_cta_primary"].strip(),
            "ctaSecondary": cd["hero_cta_secondary"].strip(),
            "primaryAction": {
                "type": cd["hero_primary_action"],
                "href": cd["hero_primary_href"].strip(),
            },
            "secondaryAction": {
                "type": cd["hero_secondary_action"],
                "href": cd["hero_secondary_href"].strip(),
            },
            "callbackModal": {
                "title": cd["hero_cb_title"].strip(),
                "nameLabel": cd["hero_cb_name_label"].strip(),
                "phoneLabel": cd["hero_cb_phone_label"].strip(),
                "submitButton": cd["hero_cb_submit"].strip(),
                "submitting": cd["hero_cb_submitting"].strip(),
                "successMessage": cd["hero_cb_success"].strip(),
            },
            "bgImageUrl": "",
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
        base["featured"] = {
            "heading": cd["feat_heading"].strip(),
            "subheading": cd["feat_subheading"].strip(),
            "catalogCta": cd["feat_catalog_cta"].strip(),
        }
        base["calculator"] = {
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
        }
        raw_filters = [x.strip() for x in cd["port_filters"].split(",") if x.strip()]
        base["portfolio"] = {
            "heading": cd["port_heading"].strip(),
            "subheading": cd["port_subheading"].strip(),
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
        }
        return base

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
