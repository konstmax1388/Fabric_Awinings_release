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

    ab_fb0 = _txt(_("Преимущества: пункт 1"))
    ab_fb1 = _txt(_("Преимущества: пункт 2"))
    ab_fb2 = _txt(_("Преимущества: пункт 3"))
    ab_fb3 = _txt(_("Преимущества: пункт 4"))
    ab_fb4 = _txt(_("Преимущества: пункт 5"))
    ab_fb5 = _txt(_("Преимущества: пункт 6"))

    ab_sp_eyebrow = _txt(_("Синий блок: верхняя строка (капс)"))
    ab_sp_line = _area(_("Синий блок: подстрока"), rows=2)

    ab_g0_url = _txt(_("Галерея: фото 1 — URL"))
    ab_g0_alt = _txt(_("Галерея: фото 1 — подпись"))
    ab_g1_url = _txt(_("Галерея: фото 2 — URL"))
    ab_g1_alt = _txt(_("Галерея: фото 2 — подпись"))
    ab_g2_url = _txt(_("Галерея: фото 3 — URL"))
    ab_g2_alt = _txt(_("Галерея: фото 3 — подпись"))

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
    ab_facts_badge = _txt(_("Факты: бейдж (синяя плашка)"))
    ab_facts_subtitle = _area(_("Факты: подзаголовок"), rows=2)
    ab_f0_val = _txt(_("Факты: ячейка 1 — число"))
    ab_f0_lbl = _txt(_("Факты: ячейка 1 — подпись"))
    ab_f1_val = _txt(_("Факты: ячейка 2 — число"))
    ab_f1_lbl = _txt(_("Факты: ячейка 2 — подпись"))
    ab_f2_val = _txt(_("Факты: ячейка 3 — число"))
    ab_f2_lbl = _txt(_("Факты: ячейка 3 — подпись"))
    ab_f3_val = _txt(_("Факты: ячейка 4 — число"))
    ab_f3_lbl = _txt(_("Факты: ячейка 4 — подпись"))

    ab_rev_title = _txt(_("Отзывы: заголовок (часть 1)"))
    ab_rev_title_accent = _txt(_("Отзывы: заголовок (часть 2, акцент)"))
    ab_rev_subtitle = _area(_("Отзывы: подзаголовок"), rows=2)

    ab_r0_product = _txt(_("Отзыв 1: товар/заголовок"))
    ab_r0_text = _area(_("Отзыв 1: текст"), rows=4)
    ab_r0_author = _txt(_("Отзыв 1: имя"))
    ab_r0_source = _txt(_("Отзыв 1: источник (OZON, WB…)"))
    ab_r0_avatar = _txt(_("Отзыв 1: URL аватара"))

    ab_r1_product = _txt(_("Отзыв 2: товар/заголовок"))
    ab_r1_text = _area(_("Отзыв 2: текст"), rows=4)
    ab_r1_author = _txt(_("Отзыв 2: имя"))
    ab_r1_source = _txt(_("Отзыв 2: источник"))
    ab_r1_avatar = _txt(_("Отзыв 2: URL аватара"))


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

    fbs: list[Any] = p.get("featureBullets") if isinstance(p.get("featureBullets"), list) else []
    for i in range(6):
        v = str(fbs[i]).strip() if i < len(fbs) and fbs[i] is not None else ""
        form.fields[f"ab_fb{i}"].initial = v

    sp = p.get("spotlight") if isinstance(p.get("spotlight"), dict) else {}
    form.fields["ab_sp_eyebrow"].initial = (sp or {}).get("eyebrow") or ""
    form.fields["ab_sp_line"].initial = (sp or {}).get("line") or ""

    gal = p.get("spotlightGallery")
    for i in range(3):
        d: dict[str, Any] = {}
        if isinstance(gal, list) and i < len(gal) and isinstance(gal[i], dict):
            d = gal[i]
        form.fields[f"ab_g{i}_url"].initial = d.get("url") or ""
        form.fields[f"ab_g{i}_alt"].initial = d.get("alt") or ""

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

    rs = p.get("reviewsStrip") if isinstance(p.get("reviewsStrip"), dict) else {}
    form.fields["ab_rev_title"].initial = (rs or {}).get("title") or ""
    form.fields["ab_rev_title_accent"].initial = (rs or {}).get("titleAccent") or ""
    form.fields["ab_rev_subtitle"].initial = (rs or {}).get("subtitle") or ""
    ritems = (rs or {}).get("items")
    for j in range(2):
        d = {}
        if isinstance(ritems, list) and j < len(ritems) and isinstance(ritems[j], dict):
            d = ritems[j]
        form.fields[f"ab_r{j}_product"].initial = d.get("productTitle") or ""
        form.fields[f"ab_r{j}_text"].initial = d.get("text") or ""
        form.fields[f"ab_r{j}_author"].initial = d.get("authorName") or ""
        form.fields[f"ab_r{j}_source"].initial = d.get("source") or ""
        form.fields[f"ab_r{j}_avatar"].initial = d.get("avatarUrl") or ""


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
    if intro:
        out["intro"] = intro
    fbs: list[str] = [_s(cleaned, f"ab_fb{i}") for i in range(6)]
    fbs = [x for x in fbs if x]
    if fbs:
        out["featureBullets"] = fbs
    sp: dict[str, str] = {}
    if _s(cleaned, "ab_sp_eyebrow"):
        sp["eyebrow"] = _s(cleaned, "ab_sp_eyebrow")
    if _s(cleaned, "ab_sp_line"):
        sp["line"] = _s(cleaned, "ab_sp_line")
    if sp:
        out["spotlight"] = sp
    gal: list[dict[str, str]] = []
    for i in range(3):
        u, a = _s(cleaned, f"ab_g{i}_url"), _s(cleaned, f"ab_g{i}_alt")
        gal.append({"url": u, "alt": a})
    if any(g.get("url") or g.get("alt") for g in gal):
        out["spotlightGallery"] = gal
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
    rs: dict[str, Any] = {}
    if _s(cleaned, "ab_rev_title"):
        rs["title"] = _s(cleaned, "ab_rev_title")
    if _s(cleaned, "ab_rev_title_accent"):
        rs["titleAccent"] = _s(cleaned, "ab_rev_title_accent")
    if _s(cleaned, "ab_rev_subtitle"):
        rs["subtitle"] = _s(cleaned, "ab_rev_subtitle")
    rits: list[dict[str, str]] = []
    for j in range(2):
        ptt = _s(cleaned, f"ab_r{j}_product")
        tx = _s(cleaned, f"ab_r{j}_text")
        aut = _s(cleaned, f"ab_r{j}_author")
        src = _s(cleaned, f"ab_r{j}_source")
        av = _s(cleaned, f"ab_r{j}_avatar")
        if not (ptt or tx or aut or src or av):
            continue
        d: dict[str, str] = {}
        if ptt:
            d["productTitle"] = ptt
        if tx:
            d["text"] = tx
        if aut:
            d["authorName"] = aut
        if src:
            d["source"] = src
        if av:
            d["avatarUrl"] = av
        rits.append(d)
    if rits:
        rs["items"] = rits
    if rs:
        out["reviewsStrip"] = rs
    return out


def build_about_payload(cleaned: dict[str, Any]) -> dict[str, Any]:
    if not cleaned.get("ab_enable_v1_layout"):
        return {}
    core = _build_about_payload_core(cleaned)
    if len(core) <= 1:
        return {}
    return core


def about_page_admin_fieldsets() -> tuple[tuple[str, dict[str, Any]], ...]:
    """Fieldsets для страницы «О нас» (slug o-nas); подключаются в StaticPageAdmin.get_fieldsets."""
    desc_main = _(
        "Тот же макет, что и на витрине (version 1). "
        "Пустые поля на сайте не показываются; при снятом флаге «Включить макет» используется только HTML ниже."
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
                    "ab_intro_image_url",
                    "ab_intro_image_alt",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            _("Блок: преимущества (список)"),
            {
                "fields": ("ab_fb0", "ab_fb1", "ab_fb2", "ab_fb3", "ab_fb4", "ab_fb5"),
                "classes": ("collapse",),
            },
        ),
        (
            _("Блок: синий акцент и галерея"),
            {
                "fields": (
                    "ab_sp_eyebrow",
                    "ab_sp_line",
                    "ab_g0_url",
                    "ab_g0_alt",
                    "ab_g1_url",
                    "ab_g1_alt",
                    "ab_g2_url",
                    "ab_g2_alt",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            _("Блок: производитель и видео"),
            {
                "fields": (
                    "ab_mnf_image_url",
                    "ab_mnf_image_alt",
                    "ab_mnf_video_url",
                    "ab_mnf_video_cta",
                    "ab_mnf_video_sub",
                    "ab_mnf_heading",
                    "ab_mnf_lead",
                    "ab_mnf_legal",
                ),
                "classes": ("collapse",),
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
                "classes": ("collapse",),
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
                "classes": ("collapse",),
            },
        ),
        (
            _("Блок: отзывы (карусель)"),
            {
                "fields": (
                    "ab_rev_title",
                    "ab_rev_title_accent",
                    "ab_rev_subtitle",
                    "ab_r0_product",
                    "ab_r0_text",
                    "ab_r0_author",
                    "ab_r0_source",
                    "ab_r0_avatar",
                    "ab_r1_product",
                    "ab_r1_text",
                    "ab_r1_author",
                    "ab_r1_source",
                    "ab_r1_avatar",
                ),
                "classes": ("collapse",),
            },
        ),
    )
