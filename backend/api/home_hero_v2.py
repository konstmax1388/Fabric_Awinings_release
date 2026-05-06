"""
Hero (главный экран) v2: 6 слайдов, в каждом — полный набор полей (текст, CTA, попап) + image/video.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from django import forms
from django.utils.translation import gettext_lazy as _

from config.hero_block_fields import HERO_SLIDE_COUNT

# Импорт виджетов/хелперов — только внутри функции при необходимости, чтобы не тянуть циклы;
# here we duplicate краткие варианты, совместимые с home_page_admin_form.
_W = (
    "border border-base-200 rounded-default px-3 py-2 text-sm w-full max-w-4xl "
    "bg-white shadow-xs dark:border-base-700 dark:bg-base-900"
)

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

HERO_SLIDE_COUNT = 6


def _txt(label: str) -> forms.CharField:
    return forms.CharField(label=label, required=False, widget=forms.TextInput(attrs={"class": _W}))


def _area(label: str, rows: int = 3) -> forms.CharField:
    return forms.CharField(
        label=label,
        required=False,
        widget=forms.Textarea(attrs={"rows": rows, "class": _W}),
    )


class AdminImageUrlWidget(forms.URLInput):
    """Дубликат home_page_admin_form: шаблон с кнопкой/подсказкой (без циклического импорта)."""

    template_name = "unfold/widgets/admin_image_url_input.html"


def _check_box(label: str) -> forms.BooleanField:
    return forms.BooleanField(
        label=label,
        required=False,
        initial=True,
        widget=forms.CheckboxInput(
            attrs={
                "class": "rounded border border-base-200 text-primary-600 focus:ring-2 focus:ring-primary-600/40"
            }
        ),
    )


def _image_url(n: int) -> forms.CharField:
    return forms.CharField(
        label=_("Слайд %(n)s: внешний URL постера (картинки), если файл не загружен") % {"n": n},
        required=False,
        widget=AdminImageUrlWidget(
            attrs={
                "class": _W,
                "placeholder": "https://...",
                "data-admin-image-url-input": "1",
            }
        ),
    )


def default_hero_v2_slide() -> dict[str, Any]:
    return {
        "eyebrow": "Премиальные тентовые решения под ключ",
        "usp": "Производитель с фиксированными сроками и понятной сметой",
        "textTone": "light",
        "heightMode": "tall",
        "uspAccentVariant": "pulse",
        "title": "Тенты на заказ",
        "subtitle": (
            "Любая форма и размер: от навесов для техники до тентов для мероприятий. "
            "Своё производство — сроки и цена под контролем."
        ),
        "trustLine": "Нам доверяют бизнесы, частные заказчики и подрядчики по всей России",
        "trustItems": ["Договор и гарантия", "Монтаж под ключ", "Сервис после сдачи"],
        "stats": [
            {"value": "12+", "label": "лет опыта"},
            {"value": "4 000+", "label": "проектов"},
            {"value": "24ч", "label": "первый ответ"},
        ],
        "ctaPrimary": "Открыть конструктор",
        "ctaSecondary": "Смотреть каталог",
        "primaryAction": {"type": "link", "href": ""},
        "secondaryAction": {"type": "link", "href": ""},
        "callbackModal": {
            "title": "Обратный звонок",
            "nameLabel": "Имя",
            "phoneLabel": "Телефон",
            "submitButton": "Заказать звонок",
            "submitting": "Отправка…",
            "successMessage": "Спасибо! Мы перезвоним в рабочее время.",
        },
        "imageUrl": "",
        "videoUrl": "",
        "overlayStrength": 85,
        "enabled": True,
        "showEyebrow": True,
        "showTrustLine": True,
        "showTrustI0": True,
        "showTrustI1": True,
        "showTrustI2": True,
        "showStat0": True,
        "showStat1": True,
        "showStat2": True,
    }


HERO_V2_ROOT_KEYS: frozenset[str] = frozenset(
    {
        "schemaVersion",
        "slides",
        "autoplayIntervalMs",
        "showCarouselArrows",
        "showCarouselProgress",
    }
)


def default_hero_v2_block() -> dict[str, Any]:
    return {
        "schemaVersion": 2,
        "autoplayIntervalMs": 7000,
        "showCarouselArrows": True,
        "showCarouselProgress": True,
        "slides": [deepcopy(default_hero_v2_slide()) for _ in range(HERO_SLIDE_COUNT)],
    }


def _slide_looks_v2(s: Any) -> bool:
    return isinstance(s, dict) and "title" in s and "callbackModal" in s


def is_hero_probably_v1_or_mixed(hero: Any) -> bool:
    if not isinstance(hero, dict):
        return True
    if hero.get("schemaVersion") != 2:
        return True
    slides = hero.get("slides")
    if not isinstance(slides, list) or len(slides) < 1:
        return True
    if not _slide_looks_v2(slides[0]):
        return True
    if len(slides) != HERO_SLIDE_COUNT:
        return True
    return False


def _overlay_light_slide_onto(s: dict[str, Any], light: Any) -> None:
    if not isinstance(light, dict):
        return
    img = str(light.get("imageUrl", "") or "").strip()
    vid = str(light.get("videoUrl", "") or "").strip()
    s["imageUrl"] = img
    s["videoUrl"] = vid
    t = light.get("textTone")
    if t in ("light", "dark"):
        s["textTone"] = t


def _slide_template_from_merged_hero(hero: dict[str, Any]) -> dict[str, Any]:
    """Собрать «эталон слайда» из старого v1-мерджа: глобальные поля (eyebrow, title, …) + дефолты v2."""
    tpl = deepcopy(default_hero_v2_slide())
    for k, v in hero.items():
        if k in ("slides", "bgImageUrl", "schemaVersion"):
            continue
        if k in tpl and v is not None:
            tpl[k] = deepcopy(v)
    return tpl


def _merge_slide_to_full(d0: dict[str, Any], raw: Any) -> dict[str, Any]:
    """Слайд v2: поверх дефолта целиком подменяем значениями из raw (сохраняем вложенные ветки, если в raw пусто)."""
    s = deepcopy(d0)
    if not isinstance(raw, dict):
        return s
    for k, v in raw.items():
        if k not in s or v is None:
            continue
        s[k] = deepcopy(v)
    return s


def ensure_hero_v2(hero: Any) -> None:
    """In-place: приведение hero к schemaVersion=2, 6 слайдам (миграция v1 или нормализация)."""
    if not isinstance(hero, dict):
        return
    d0 = default_hero_v2_slide()
    if not is_hero_probably_v1_or_mixed(hero):
        slides = hero.get("slides")
        assert isinstance(slides, list)
        out_slides: list[dict[str, Any]] = []
        for i in range(HERO_SLIDE_COUNT):
            raw = slides[i] if i < len(slides) else None
            out_slides.append(_merge_slide_to_full(d0, raw if isinstance(raw, dict) else {}))
        hero["schemaVersion"] = 2
        hero["slides"] = out_slides
        for k in list(hero.keys()):
            if k not in HERO_V2_ROOT_KEYS:
                del hero[k]
        dblk = default_hero_v2_block()
        for key in ("autoplayIntervalMs", "showCarouselArrows", "showCarouselProgress"):
            if key not in hero:
                hero[key] = dblk[key]
        return

    old_slides = hero.get("slides")
    if not isinstance(old_slides, list):
        old_slides = []
    tpl = _slide_template_from_merged_hero(hero)
    new_slides: list[dict[str, Any]] = []
    for i in range(HERO_SLIDE_COUNT):
        s = deepcopy(tpl)
        if i < len(old_slides):
            _overlay_light_slide_onto(s, old_slides[i])
        new_slides.append(s)
    repl = default_hero_v2_block()
    repl["slides"] = new_slides
    hero.clear()
    hero.update(repl)


def iter_hero_slide_model_image_names() -> tuple[str, ...]:
    return tuple(f"hero_slide_{i}_image" for i in range(1, HERO_SLIDE_COUNT + 1))


def iter_hero_slide_model_video_names() -> tuple[str, ...]:
    return tuple(f"hero_slide_{i}_video" for i in range(1, HERO_SLIDE_COUNT + 1))


def _overlay_strength_0_100(cd: dict[str, Any], p: str) -> int:
    try:
        v = int(cd.get(f"{p}overlay_strength", 85))
    except (TypeError, ValueError):
        v = 85
    return max(0, min(100, v))


def _cd_bool(cd: dict[str, Any], key: str, default: bool = True) -> bool:
    v = cd.get(key)
    if v is None:
        return default
    return v is True


def build_hero_slide_from_cd(cd: dict[str, Any], n: int) -> dict[str, Any]:
    p = f"hero_s{n}_"
    return {
        "enabled": _cd_bool(cd, f"{p}enabled", True),
        "showEyebrow": _cd_bool(cd, f"{p}show_eyebrow", True),
        "showTrustLine": _cd_bool(cd, f"{p}show_trust_line", True),
        "showTrustI0": _cd_bool(cd, f"{p}show_trust_i0", True),
        "showTrustI1": _cd_bool(cd, f"{p}show_trust_i1", True),
        "showTrustI2": _cd_bool(cd, f"{p}show_trust_i2", True),
        "showStat0": _cd_bool(cd, f"{p}show_stat_0", True),
        "showStat1": _cd_bool(cd, f"{p}show_stat_1", True),
        "showStat2": _cd_bool(cd, f"{p}show_stat_2", True),
        "eyebrow": str(cd.get(f"{p}eyebrow", "") or "").strip(),
        "usp": str(cd.get(f"{p}usp", "") or "").strip(),
        "textTone": cd.get(f"{p}text_tone") if cd.get(f"{p}text_tone") in ("light", "dark") else "light",
        "heightMode": cd.get(f"{p}height_mode")
        if cd.get(f"{p}height_mode") in ("normal", "tall", "wow")
        else "tall",
        "overlayStrength": _overlay_strength_0_100(cd, p),
        "uspAccentVariant": cd.get(f"{p}usp_accent_variant")
        if cd.get(f"{p}usp_accent_variant") in ("pulse", "shimmer")
        else "pulse",
        "title": str(cd.get(f"{p}title", "") or "").strip(),
        "subtitle": str(cd.get(f"{p}subtitle", "") or "").strip(),
        "trustLine": str(cd.get(f"{p}trust_line", "") or "").strip(),
        "trustItems": [str(cd.get(f"{p}trust_i{i}", "") or "").strip() for i in range(3)],
        "stats": [
            {
                "value": str(cd.get(f"{p}stat_{i}_value", "") or "").strip(),
                "label": str(cd.get(f"{p}stat_{i}_label", "") or "").strip(),
            }
            for i in range(3)
        ],
        "ctaPrimary": str(cd.get(f"{p}cta_primary", "") or "").strip(),
        "ctaSecondary": str(cd.get(f"{p}cta_secondary", "") or "").strip(),
        "primaryAction": {
            "type": cd.get(f"{p}primary_action") if cd.get(f"{p}primary_action") in ("link", "callback") else "link",
            "href": str(cd.get(f"{p}primary_href", "") or "").strip(),
        },
        "secondaryAction": {
            "type": cd.get(f"{p}secondary_action") if cd.get(f"{p}secondary_action") in ("link", "callback") else "link",
            "href": str(cd.get(f"{p}secondary_href", "") or "").strip(),
        },
        "callbackModal": {
            "title": str(cd.get(f"{p}cb_title", "") or "").strip(),
            "nameLabel": str(cd.get(f"{p}cb_name_label", "") or "").strip(),
            "phoneLabel": str(cd.get(f"{p}cb_phone_label", "") or "").strip(),
            "submitButton": str(cd.get(f"{p}cb_submit", "") or "").strip(),
            "submitting": str(cd.get(f"{p}cb_submitting", "") or "").strip(),
            "successMessage": str(cd.get(f"{p}cb_success", "") or "").strip(),
        },
        "imageUrl": str(cd.get(f"{p}image_url", "") or "").strip(),
        "videoUrl": str(cd.get(f"{p}video_url", "") or "").strip(),
    }


def _s_bool(s: dict[str, Any], k: str, default: bool = True) -> bool:
    v = s.get(k)
    if v is None:
        return default
    return v is not False


def _apply_hero_v2_to_initial_line(initial: dict[str, Any], slide: dict[str, Any], n: int) -> None:
    s = slide if isinstance(slide, dict) else {}
    p = f"hero_s{n}_"
    d0 = default_hero_v2_slide()
    initial.setdefault(f"{p}enabled", _s_bool(s, "enabled", True))
    initial.setdefault(f"{p}show_eyebrow", _s_bool(s, "showEyebrow", True))
    initial.setdefault(f"{p}show_trust_line", _s_bool(s, "showTrustLine", True))
    initial.setdefault(f"{p}show_trust_i0", _s_bool(s, "showTrustI0", True))
    initial.setdefault(f"{p}show_trust_i1", _s_bool(s, "showTrustI1", True))
    initial.setdefault(f"{p}show_trust_i2", _s_bool(s, "showTrustI2", True))
    initial.setdefault(f"{p}show_stat_0", _s_bool(s, "showStat0", True))
    initial.setdefault(f"{p}show_stat_1", _s_bool(s, "showStat1", True))
    initial.setdefault(f"{p}show_stat_2", _s_bool(s, "showStat2", True))
    initial.setdefault(f"{p}eyebrow", s.get("eyebrow", d0.get("eyebrow", "")))
    initial.setdefault(f"{p}usp", s.get("usp", d0.get("usp", "")))
    t = s.get("textTone")
    initial.setdefault(f"{p}text_tone", t if t in ("light", "dark") else "light")
    h = s.get("heightMode")
    initial.setdefault(f"{p}height_mode", h if h in ("normal", "tall", "wow") else "tall")
    try:
        os0 = int(s.get("overlayStrength", 85))
    except (TypeError, ValueError):
        os0 = 85
    initial.setdefault(f"{p}overlay_strength", max(0, min(100, os0)))
    u = s.get("uspAccentVariant")
    initial.setdefault(f"{p}usp_accent_variant", u if u in ("pulse", "shimmer") else "pulse")
    initial.setdefault(f"{p}title", s.get("title", d0.get("title", "")))
    initial.setdefault(f"{p}subtitle", s.get("subtitle", d0.get("subtitle", "")))
    initial.setdefault(f"{p}trust_line", s.get("trustLine", ""))
    titems = s.get("trustItems") if isinstance(s.get("trustItems"), list) else []
    for i in range(3):
        item = titems[i] if i < len(titems) else ""
        initial.setdefault(f"{p}trust_i{i}", str(item or "").strip())
    st = s.get("stats") if isinstance(s.get("stats"), list) else []
    for i in range(3):
        sti = st[i] if i < len(st) and isinstance(st[i], dict) else {}
        initial.setdefault(f"{p}stat_{i}_value", str(sti.get("value", "") or "").strip())
        initial.setdefault(f"{p}stat_{i}_label", str(sti.get("label", "") or "").strip())
    initial.setdefault(f"{p}cta_primary", s.get("ctaPrimary", ""))
    initial.setdefault(f"{p}cta_secondary", s.get("ctaSecondary", ""))
    pa = s.get("primaryAction") if isinstance(s.get("primaryAction"), dict) else {}
    ptype = pa.get("type")
    initial.setdefault(f"{p}primary_action", ptype if ptype in ("link", "callback") else "link")
    initial.setdefault(f"{p}primary_href", (pa.get("href") or "").strip())
    sa = s.get("secondaryAction") if isinstance(s.get("secondaryAction"), dict) else {}
    stype = sa.get("type")
    initial.setdefault(f"{p}secondary_action", stype if stype in ("link", "callback") else "link")
    initial.setdefault(f"{p}secondary_href", (sa.get("href") or "").strip())
    cb = s.get("callbackModal") if isinstance(s.get("callbackModal"), dict) else {}
    initial.setdefault(f"{p}cb_title", cb.get("title", ""))
    initial.setdefault(f"{p}cb_name_label", cb.get("nameLabel", ""))
    initial.setdefault(f"{p}cb_phone_label", cb.get("phoneLabel", ""))
    initial.setdefault(f"{p}cb_submit", cb.get("submitButton", ""))
    initial.setdefault(f"{p}cb_submitting", cb.get("submitting", ""))
    initial.setdefault(f"{p}cb_success", cb.get("successMessage", ""))
    initial.setdefault(f"{p}image_url", str(s.get("imageUrl", "") or "").strip())
    initial.setdefault(f"{p}video_url", str(s.get("videoUrl", "") or "").strip())


def apply_hero_v2_initial(initial: dict[str, Any], hero: Any) -> None:
    if not isinstance(hero, dict):
        return
    h = deepcopy(hero)
    ensure_hero_v2(h)
    slides = h.get("slides") if isinstance(h.get("slides"), list) else []
    for n in range(1, HERO_SLIDE_COUNT + 1):
        s = slides[n - 1] if n - 1 < len(slides) and isinstance(slides[n - 1], dict) else None
        _apply_hero_v2_to_initial_line(initial, s or default_hero_v2_slide(), n)


def _one_slide_char_fields_impl(n: int) -> dict[str, forms.Field]:
    p = f"hero_s{n}_"
    d: dict[str, forms.Field] = {
        f"{p}enabled": _check_box(
            _("Слайд %(n)s: слайд включён (в карусели и на витрине)") % {"n": n}
        ),
        f"{p}show_eyebrow": _check_box(
            _("Слайд %(n)s: показывать верхний бейдж (короткая строка над заголовком)") % {"n": n}
        ),
        f"{p}eyebrow": _txt(_("Слайд %(n)s: верхний бейдж (короткая строка над заголовком)") % {"n": n}),
        f"{p}usp": _txt(_("Слайд %(n)s: УТП (ключевое обещание)") % {"n": n}),
        f"{p}text_tone": forms.ChoiceField(
            label=_("Слайд %(n)s: тон текста (если нет картинки/анимации — весь блок)") % {"n": n},
            required=False,
            choices=HERO_TEXT_TONE_CHOICES,
            initial="light",
            widget=forms.Select(attrs={"class": _W}),
        ),
        f"{p}height_mode": forms.ChoiceField(
            label=_("Слайд %(n)s: высота блока") % {"n": n},
            required=False,
            choices=HERO_HEIGHT_MODE_CHOICES,
            initial="tall",
            widget=forms.Select(attrs={"class": _W}),
        ),
        f"{p}overlay_strength": forms.IntegerField(
            label=_("Слайд %(n)s: затемнение фона (0–100, 0 = нет, ~85 как у шаблона)") % {"n": n},
            required=False,
            min_value=0,
            max_value=100,
            initial=85,
            help_text=_("Линейный градиент и мягкий тёплый блик; при 0 — только фото/видео, без вуали."),
            widget=forms.NumberInput(
                attrs={
                    "class": _W,
                    "min": 0,
                    "max": 100,
                    "inputmode": "numeric",
                }
            ),
        ),
        f"{p}usp_accent_variant": forms.ChoiceField(
            label=_("Слайд %(n)s: акцент на УТП") % {"n": n},
            required=False,
            choices=HERO_USP_ACCENT_VARIANT_CHOICES,
            initial="pulse",
            widget=forms.Select(attrs={"class": _W}),
        ),
        f"{p}title": _txt(_("Слайд %(n)s: заголовок") % {"n": n}),
        f"{p}subtitle": _area(_("Слайд %(n)s: подзаголовок") % {"n": n}, rows=3),
        f"{p}show_trust_line": _check_box(
            _("Слайд %(n)s: показывать строку доверия под кнопками") % {"n": n}
        ),
        f"{p}trust_line": _txt(_("Слайд %(n)s: строка доверия под кнопками") % {"n": n}),
        f"{p}show_trust_i0": _check_box(_("Слайд %(n)s: показывать «метка доверия 1»") % {"n": n}),
        f"{p}trust_i0": _txt(_("Слайд %(n)s: метка доверия 1") % {"n": n}),
        f"{p}show_trust_i1": _check_box(_("Слайд %(n)s: показывать «метка доверия 2»") % {"n": n}),
        f"{p}trust_i1": _txt(_("Слайд %(n)s: метка доверия 2") % {"n": n}),
        f"{p}show_trust_i2": _check_box(_("Слайд %(n)s: показывать «метка доверия 3»") % {"n": n}),
        f"{p}trust_i2": _txt(_("Слайд %(n)s: метка доверия 3") % {"n": n}),
        f"{p}show_stat_0": _check_box(_("Слайд %(n)s: показывать KPI 1 (значение и подпись)") % {"n": n}),
        f"{p}stat_0_value": _txt(_("Слайд %(n)s: KPI 1: значение") % {"n": n}),
        f"{p}stat_0_label": _txt(_("Слайд %(n)s: KPI 1: подпись") % {"n": n}),
        f"{p}show_stat_1": _check_box(_("Слайд %(n)s: показывать KPI 2 (значение и подпись)") % {"n": n}),
        f"{p}stat_1_value": _txt(_("Слайд %(n)s: KPI 2: значение") % {"n": n}),
        f"{p}stat_1_label": _txt(_("Слайд %(n)s: KPI 2: подпись") % {"n": n}),
        f"{p}show_stat_2": _check_box(_("Слайд %(n)s: показывать KPI 3 (значение и подпись)") % {"n": n}),
        f"{p}stat_2_value": _txt(_("Слайд %(n)s: KPI 3: значение") % {"n": n}),
        f"{p}stat_2_label": _txt(_("Слайд %(n)s: KPI 3: подпись") % {"n": n}),
        f"{p}cta_primary": _txt(_("Слайд %(n)s: кнопка основная (текст)") % {"n": n}),
        f"{p}primary_action": forms.ChoiceField(
            label=_("Слайд %(n)s: основная кнопка: действие") % {"n": n},
            required=False,
            choices=HERO_ACTION_CHOICES,
            initial="link",
            widget=forms.Select(attrs={"class": _W}),
        ),
        f"{p}primary_href": forms.CharField(
            label=_("Слайд %(n)s: основная кнопка: ссылка (для «По ссылке»)") % {"n": n},
            required=False,
            widget=forms.TextInput(
                attrs={
                    "class": _W,
                    "placeholder": "/catalog или https://…",
                }
            ),
        ),
        f"{p}cta_secondary": _txt(_("Слайд %(n)s: кнопка вторичная (текст)") % {"n": n}),
        f"{p}secondary_action": forms.ChoiceField(
            label=_("Слайд %(n)s: вторичная кнопка: действие") % {"n": n},
            required=False,
            choices=HERO_ACTION_CHOICES,
            initial="link",
            widget=forms.Select(attrs={"class": _W}),
        ),
        f"{p}secondary_href": forms.CharField(
            label=_("Слайд %(n)s: вторичная кнопка: ссылка (для «По ссылке»)") % {"n": n},
            required=False,
            widget=forms.TextInput(
                attrs={
                    "class": _W,
                    "placeholder": "/catalog или https://…",
                }
            ),
        ),
        f"{p}cb_title": _txt(_("Слайд %(n)s: попап: заголовок") % {"n": n}),
        f"{p}cb_name_label": _txt(_("Слайд %(n)s: попап: подпись «Имя»") % {"n": n}),
        f"{p}cb_phone_label": _txt(_("Слайд %(n)s: попап: подпись «Телефон»") % {"n": n}),
        f"{p}cb_submit": _txt(_("Слайд %(n)s: попап: кнопка отправки") % {"n": n}),
        f"{p}cb_submitting": _txt(_("Слайд %(n)s: попап: текст при отправке") % {"n": n}),
        f"{p}cb_success": _area(_("Слайд %(n)s: попап: сообщение после успеха") % {"n": n}, rows=2),
        f"{p}image_url": _image_url(n),
        f"{p}video_url": _txt(_("Слайд %(n)s: URL видео (mp4/webm, необязательно)") % {"n": n}),
    }
    return d


def collect_hero_v2_class_fields() -> dict[str, forms.Field]:
    m: dict[str, forms.Field] = {}
    for n in range(1, HERO_SLIDE_COUNT + 1):
        m.update(_one_slide_char_fields_impl(n))
    return m
