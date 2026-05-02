"""
Виртуальные поля админки для макета «О нас» (StaticPage.about_payload, version 1).
Сохраняется только для страницы со слагом o-nas; для остальных слагов about_payload не меняется.
"""

from __future__ import annotations

from typing import Any

from django import forms
from django.utils.translation import gettext_lazy as _

_W = (
    "border border-base-200 rounded-default px-3 py-2 text-sm w-full max-w-4xl "
    "bg-white shadow-xs dark:border-base-700 dark:bg-base-900"
)


def _txt(label: str, **kw: Any) -> forms.CharField:
    return forms.CharField(label=label, required=False, widget=forms.TextInput(attrs={"class": _W}), **kw)


def _area(label: str, rows: int = 3) -> forms.CharField:
    return forms.CharField(
        label=label,
        required=False,
        widget=forms.Textarea(attrs={"rows": rows, "class": _W}),
    )


def _int_pct(label: str) -> forms.IntegerField:
    return forms.IntegerField(
        label=label,
        required=False,
        min_value=0,
        max_value=100,
        widget=forms.NumberInput(attrs={"class": _W}),
    )


class StaticPageAboutLayoutFields(forms.Form):
    """Поля макета v1 (добавляются к ModelForm StaticPage)."""

    ab_enable_v1_layout = forms.BooleanField(
        label=_("Включить макет v1 на витрине"),
        required=False,
        help_text=_(
            "Если выключено — на сайте выводится только HTML из поля «Содержимое» ниже. "
            "Включайте после заполнения нужных блоков."
        ),
    )

    ab_intro_title = _txt(_("Вступление: заголовок (часть 1)"))
    ab_intro_title_accent = _txt(_("Вступление: заголовок (часть 2, акцент)"))
    ab_intro_p0 = _area(_("Вступление: абзац 1"), rows=3)
    ab_intro_p1 = _area(_("Вступление: абзац 2"), rows=3)
    ab_intro_p2 = _area(_("Вступление: абзац 3"), rows=3)
    ab_intro_p3 = _area(_("Вступление: абзац 4 (необязательно)"), rows=2)
    ab_intro_image_url = _txt(_("Вступление: URL картинки (справа)"))
    ab_intro_image_alt = _txt(_("Вступление: подпись к картинке (alt)"))
    ab_intro_video_url = _txt(_("Вступление: внешняя ссылка на видео (если нет файла)"))
    ab_intro_video_cta = _txt(_("Вступление: текст кнопки «Видео» на фото"))
    ab_intro_video_sub = _txt(_("Вступление: подпись под кнопкой видео"))

    ab_fb0 = _txt(_("Преимущества: пункт 1"))
    ab_fb1 = _txt(_("Преимущества: пункт 2"))
    ab_fb2 = _txt(_("Преимущества: пункт 3"))
    ab_fb3 = _txt(_("Преимущества: пункт 4"))
    ab_fb4 = _txt(_("Преимущества: пункт 5"))
    ab_fb5 = _txt(_("Преимущества: пункт 6"))

    ab_mnf_image_url = _txt(_("Производитель: URL фото"))
    ab_mnf_image_alt = _txt(_("Производитель: подпись к фото"))
    ab_mnf_video_url = _txt(_("Производитель: ссылка на видео"))
    ab_mnf_video_cta = _txt(_("Производитель: текст кнопки «Видео»"))
    ab_mnf_video_sub = _txt(_("Производитель: подпись под кнопкой"))
    ab_mnf_heading = _txt(_("Производитель: заголовок"))
    ab_mnf_lead = _area(_("Производитель: вводный текст"), rows=3)
    ab_mnf_legal = _area(_("Производитель: реквизиты и контакты"), rows=5)

    ab_met0_label = _txt(_("Метрика 1: подпись"))
    ab_met0_value = _int_pct(_("Метрика 1: % (бейдж)"))
    ab_met0_bar = _int_pct(_("Метрика 1: % ширины полосы"))
    ab_met1_label = _txt(_("Метрика 2: подпись"))
    ab_met1_value = _int_pct(_("Метрика 2: % (бейдж)"))
    ab_met1_bar = _int_pct(_("Метрика 2: % ширины полосы"))
    ab_met2_label = _txt(_("Метрика 3: подпись"))
    ab_met2_value = _int_pct(_("Метрика 3: % (бейдж)"))
    ab_met2_bar = _int_pct(_("Метрика 3: % ширины полосы"))

    ab_facts_bg = _txt(_("Факты: URL фона"))
    ab_facts_badge = _txt(_("Факты: бейдж (плашка над цифрами)"))
    ab_facts_subtitle = _area(_("Факты: подзаголовок"), rows=2)
    ab_f0_val = _txt(_("Факты: ячейка 1 — число"))
    ab_f0_lbl = _txt(_("Факты: ячейка 1 — подпись"))
    ab_f1_val = _txt(_("Факты: ячейка 2 — число"))
    ab_f1_lbl = _txt(_("Факты: ячейка 2 — подпись"))
    ab_f2_val = _txt(_("Факты: ячейка 3 — число"))
    ab_f2_lbl = _txt(_("Факты: ячейка 3 — подпись"))
    ab_f3_val = _txt(_("Факты: ячейка 4 — число"))
    ab_f3_lbl = _txt(_("Факты: ячейка 4 — подпись"))


def _s(cleaned: dict[str, Any], key: str) -> str:
    v = cleaned.get(key)
    if v is None:
        return ""
    return str(v).strip()


def apply_about_layout_initial(form: forms.BaseForm, payload: dict[str, Any] | None) -> None:
    p = payload if isinstance(payload, dict) else {}
    form.fields["ab_enable_v1_layout"].initial = p.get("version") == 1
    intro = p.get("intro") if isinstance(p.get("intro"), dict) else {}
    form.fields["ab_intro_title"].initial = (intro or {}).get("title") or ""
    form.fields["ab_intro_title_accent"].initial = (intro or {}).get("titleAccent") or ""
    paras: list[Any] = intro.get("paragraphs") if isinstance(intro, dict) else None
    if not isinstance(paras, list):
        paras = []
    for i in range(4):
        v = str(paras[i]).strip() if i < len(paras) and paras[i] is not None else ""
        form.fields[f"ab_intro_p{i}"].initial = v
    form.fields["ab_intro_image_url"].initial = (intro or {}).get("imageUrl") or ""
    form.fields["ab_intro_image_alt"].initial = (intro or {}).get("imageAlt") or ""
    form.fields["ab_intro_video_url"].initial = (intro or {}).get("videoUrl") or ""
    form.fields["ab_intro_video_cta"].initial = (intro or {}).get("videoCta") or ""
    form.fields["ab_intro_video_sub"].initial = (intro or {}).get("videoSub") or ""

    fbs: list[Any] = p.get("featureBullets") if isinstance(p.get("featureBullets"), list) else []
    for i in range(6):
        v = str(fbs[i]).strip() if i < len(fbs) and fbs[i] is not None else ""
        form.fields[f"ab_fb{i}"].initial = v

    m = p.get("manufacturer") if isinstance(p.get("manufacturer"), dict) else {}
    form.fields["ab_mnf_image_url"].initial = m.get("imageUrl") or ""
    form.fields["ab_mnf_image_alt"].initial = m.get("imageAlt") or ""
    form.fields["ab_mnf_video_url"].initial = m.get("videoUrl") or ""
    form.fields["ab_mnf_video_cta"].initial = m.get("videoCta") or ""
    form.fields["ab_mnf_video_sub"].initial = m.get("videoSub") or ""
    form.fields["ab_mnf_heading"].initial = m.get("heading") or ""
    form.fields["ab_mnf_lead"].initial = m.get("lead") or ""
    form.fields["ab_mnf_legal"].initial = m.get("legalText") or ""

    metrics = p.get("metrics")
    for i in range(3):
        d: dict[str, Any] = {}
        if isinstance(metrics, list) and i < len(metrics) and isinstance(metrics[i], dict):
            d = metrics[i]
        form.fields[f"ab_met{i}_label"].initial = d.get("label") or ""
        vp, bp = d.get("valuePercent"), d.get("barPercent")
        form.fields[f"ab_met{i}_value"].initial = vp if isinstance(vp, (int, float)) else None
        form.fields[f"ab_met{i}_bar"].initial = bp if isinstance(bp, (int, float)) else None

    facts = p.get("facts") if isinstance(p.get("facts"), dict) else {}
    form.fields["ab_facts_bg"].initial = (facts or {}).get("backgroundUrl") or ""
    form.fields["ab_facts_badge"].initial = (facts or {}).get("badge") or ""
    form.fields["ab_facts_subtitle"].initial = (facts or {}).get("subtitle") or ""
    items = (facts or {}).get("items")
    for i in range(4):
        d = {}
        if isinstance(items, list) and i < len(items) and isinstance(items[i], dict):
            d = items[i]
        form.fields[f"ab_f{i}_val"].initial = d.get("value") or ""
        form.fields[f"ab_f{i}_lbl"].initial = d.get("label") or ""


def _merge_about_manufacturer_files(core: dict[str, Any], instance: Any) -> dict[str, Any]:
    """Подставляет URL из загруженных на модель файлов в блок manufacturer (приоритет над полями URL)."""
    img = getattr(instance, "about_manufacturer_image", None)
    vid = getattr(instance, "about_manufacturer_video", None)
    has_img = bool(img and getattr(img, "name", ""))
    has_vid = bool(vid and getattr(vid, "name", ""))
    if not has_img and not has_vid:
        return core
    m: dict[str, Any] = core.get("manufacturer") if isinstance(core.get("manufacturer"), dict) else {}
    m = {**m}
    if has_img:
        m["imageUrl"] = img.url
    if has_vid:
        m["videoUrl"] = vid.url
    if m:
        core = {**core, "manufacturer": m}
    return core


def _merge_about_intro_files(core: dict[str, Any], instance: Any) -> dict[str, Any]:
    """Подставляет URL из файлов в блок intro (приоритет над полями URL в макете)."""
    img = getattr(instance, "about_intro_image", None)
    vid = getattr(instance, "about_intro_video", None)
    has_img = bool(img and getattr(img, "name", ""))
    has_vid = bool(vid and getattr(vid, "name", ""))
    if not has_img and not has_vid:
        return core
    intro: dict[str, Any] = core.get("intro") if isinstance(core.get("intro"), dict) else {}
    intro = {**intro}
    if has_img:
        intro["imageUrl"] = img.url
    if has_vid:
        intro["videoUrl"] = vid.url
    if intro:
        core = {**core, "intro": intro}
    return core


def _build_about_payload_core(cleaned: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {"version": 1}
    intro: dict[str, Any] = {}
    if _s(cleaned, "ab_intro_title"):
        intro["title"] = _s(cleaned, "ab_intro_title")
    if _s(cleaned, "ab_intro_title_accent"):
        intro["titleAccent"] = _s(cleaned, "ab_intro_title_accent")
    paras: list[str] = []
    for i in range(4):
        line = _s(cleaned, f"ab_intro_p{i}")
        if line:
            paras.append(line)
    if paras:
        intro["paragraphs"] = paras
    if _s(cleaned, "ab_intro_image_url"):
        intro["imageUrl"] = _s(cleaned, "ab_intro_image_url")
    if _s(cleaned, "ab_intro_image_alt"):
        intro["imageAlt"] = _s(cleaned, "ab_intro_image_alt")
    for jk, fk in (
        ("videoUrl", "ab_intro_video_url"),
        ("videoCta", "ab_intro_video_cta"),
        ("videoSub", "ab_intro_video_sub"),
    ):
        t = _s(cleaned, fk)
        if t:
            intro[jk] = t
    if intro:
        out["intro"] = intro
    fbs: list[str] = [_s(cleaned, f"ab_fb{i}") for i in range(6)]
    fbs = [x for x in fbs if x]
    if fbs:
        out["featureBullets"] = fbs
    m: dict[str, Any] = {}
    for jk, fk in (
        ("imageUrl", "ab_mnf_image_url"),
        ("imageAlt", "ab_mnf_image_alt"),
        ("videoUrl", "ab_mnf_video_url"),
        ("videoCta", "ab_mnf_video_cta"),
        ("videoSub", "ab_mnf_video_sub"),
        ("heading", "ab_mnf_heading"),
    ):
        t = _s(cleaned, fk)
        if t:
            m[jk] = t
    if _s(cleaned, "ab_mnf_lead"):
        m["lead"] = _s(cleaned, "ab_mnf_lead")
    if _s(cleaned, "ab_mnf_legal"):
        m["legalText"] = _s(cleaned, "ab_mnf_legal")
    if m:
        out["manufacturer"] = m
    metrics: list[dict[str, Any]] = []
    for i in range(3):
        lab = _s(cleaned, f"ab_met{i}_label")
        v, b = cleaned.get(f"ab_met{i}_value"), cleaned.get(f"ab_met{i}_bar")
        if not lab and v in (None, "") and b in (None, ""):
            continue
        row: dict[str, Any] = {"label": lab or ""}
        if v is not None and v != "":
            try:
                row["valuePercent"] = int(v)
            except (TypeError, ValueError):
                pass
        if b is not None and b != "":
            try:
                row["barPercent"] = int(b)
            except (TypeError, ValueError):
                pass
        metrics.append(row)
    if metrics:
        out["metrics"] = metrics
    facts: dict[str, Any] = {}
    if _s(cleaned, "ab_facts_bg"):
        facts["backgroundUrl"] = _s(cleaned, "ab_facts_bg")
    if _s(cleaned, "ab_facts_badge"):
        facts["badge"] = _s(cleaned, "ab_facts_badge")
    if _s(cleaned, "ab_facts_subtitle"):
        facts["subtitle"] = _s(cleaned, "ab_facts_subtitle")
    fitems: list[dict[str, str]] = []
    for i in range(4):
        v, lbl = _s(cleaned, f"ab_f{i}_val"), _s(cleaned, f"ab_f{i}_lbl")
        if v or lbl:
            it: dict[str, str] = {}
            if v:
                it["value"] = v
            if lbl:
                it["label"] = lbl
            fitems.append(it)
    if fitems:
        facts["items"] = fitems
    if facts:
        out["facts"] = facts
    return out


def _spotlight_gallery_from_inline_rows(instance: Any) -> list[dict[str, str]] | None:
    if not instance or not getattr(instance, "pk", None):
        return None
    try:
        q = instance.about_spotlight_items.all().order_by("sort_order", "id")
    except Exception:
        return None
    rows: list[dict[str, str]] = []
    for it in q:
        img = getattr(it, "image", None)
        if img and getattr(img, "name", ""):
            rows.append(
                {
                    "url": img.url,
                    "alt": (getattr(it, "alt", None) or "").strip(),
                }
            )
    return rows if rows else None


def _spotlight_gallery_from_saved_payload(instance: Any) -> list[dict[str, str]] | None:
    p = getattr(instance, "about_payload", None)
    if not isinstance(p, dict):
        return None
    gal = p.get("spotlightGallery")
    if not isinstance(gal, list):
        return None
    rows: list[dict[str, str]] = []
    for x in gal:
        if not isinstance(x, dict):
            continue
        u = (x.get("url") or "").strip()
        if u:
            rows.append({"url": u, "alt": (x.get("alt") or "").strip()})
    return rows if rows else None


def _merge_spotlight_gallery_from_instance(core: dict[str, Any], instance: Any) -> dict[str, Any]:
    if not instance or not getattr(instance, "pk", None):
        return core
    from .models import AboutSpotlightImage

    has_saved_files = AboutSpotlightImage.objects.filter(static_page=instance).exclude(image="").exists()
    if has_saved_files:
        rows = _spotlight_gallery_from_inline_rows(instance) or []
        return {**core, "spotlightGallery": rows}
    leg = _spotlight_gallery_from_saved_payload(instance)
    if leg:
        return {**core, "spotlightGallery": leg}
    return core


def build_about_payload(cleaned: dict[str, Any], instance: Any | None = None) -> dict[str, Any]:
    if not cleaned.get("ab_enable_v1_layout"):
        return {}
    core = _build_about_payload_core(cleaned)
    if instance is not None:
        core = _merge_about_manufacturer_files(core, instance)
        core = _merge_about_intro_files(core, instance)
        core = _merge_spotlight_gallery_from_instance(core, instance)
    if len(core) <= 1:
        return {}
    return core


def about_page_admin_fieldsets() -> tuple[tuple[str, dict[str, Any]], ...]:
    """Fieldsets для страницы «О нас» (slug o-nas); подключаются в StaticPageAdmin.get_fieldsets."""
    desc_main = _(
        "Тот же макет, что и на витрине (version 1). "
        "Пустые поля на сайте не показываются; при снятом флаге «Включить макет» используется только HTML ниже. "
        "Фото и видео можно задать файлами в блоках или внешними URL — файлы имеют приоритет. "
        "Галерея «плитка» на витрине: загрузка только через инлайн "
        "«Галерея (О нас, витрина)…» под полем «Содержимое»: "
        "неограниченно фото, клик или перетаскивание в рамку, при необходимости подпись. "
        "Старые поля «URL фото 1–3» в админке сняты — на сервере с актуальным кодом (релиз 3.2.16+) их нет. "
        "Пока в инлайне нет загруженных файлов, в JSON остаётся ранее сохранённый список. "
        "Блок отзывов внизу страницы — общий виджет сайта, он не дублируется этой формой."
    )
    return (
        (
            _("Макет «О нас» — витрина"),
            {
                "fields": ("ab_enable_v1_layout",),
                "description": desc_main,
            },
        ),
        (
            _("Блок: вступление"),
            {
                "fields": (
                    "ab_intro_title",
                    "ab_intro_title_accent",
                    "ab_intro_p0",
                    "ab_intro_p1",
                    "ab_intro_p2",
                    "ab_intro_p3",
                    "about_intro_image",
                    "about_intro_video",
                    "ab_intro_image_url",
                    "ab_intro_image_alt",
                    "ab_intro_video_url",
                    "ab_intro_video_cta",
                    "ab_intro_video_sub",
                ),
            },
        ),
        (
            _("Блок: преимущества (список)"),
            {
                "fields": ("ab_fb0", "ab_fb1", "ab_fb2", "ab_fb3", "ab_fb4", "ab_fb5"),
            },
        ),
        (
            _("Блок: производитель и видео"),
            {
                "fields": (
                    "about_manufacturer_image",
                    "about_manufacturer_video",
                    "ab_mnf_image_url",
                    "ab_mnf_image_alt",
                    "ab_mnf_video_url",
                    "ab_mnf_video_cta",
                    "ab_mnf_video_sub",
                    "ab_mnf_heading",
                    "ab_mnf_lead",
                    "ab_mnf_legal",
                ),
            },
        ),
        (
            _("Блок: метрики (полосы)"),
            {
                "fields": (
                    "ab_met0_label",
                    "ab_met0_value",
                    "ab_met0_bar",
                    "ab_met1_label",
                    "ab_met1_value",
                    "ab_met1_bar",
                    "ab_met2_label",
                    "ab_met2_value",
                    "ab_met2_bar",
                ),
            },
        ),
        (
            _("Блок: факты и цифры"),
            {
                "fields": (
                    "ab_facts_bg",
                    "ab_facts_badge",
                    "ab_facts_subtitle",
                    "ab_f0_val",
                    "ab_f0_lbl",
                    "ab_f1_val",
                    "ab_f1_lbl",
                    "ab_f2_val",
                    "ab_f2_lbl",
                    "ab_f3_val",
                    "ab_f3_lbl",
                ),
            },
        ),
    )
