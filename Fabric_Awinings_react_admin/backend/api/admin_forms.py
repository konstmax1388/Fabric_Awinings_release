"""Формы админки: удобный ввод вместо сырого JSON где возможно."""

from django import forms
from django.utils.translation import gettext_lazy as _

from .models import Product

_MP_INPUT_CLASSES = (
    "border border-base-200 rounded-default px-3 py-2 text-sm w-full max-w-3xl "
    "bg-white shadow-xs font-mono dark:border-base-700 dark:bg-base-900"
)

_CHECK_CLASSES = (
    "size-4 rounded border-base-300 text-primary-600 "
    "focus:ring-primary-600/40 dark:border-base-600"
)

# Ключ → имя поля формы; порядок кортежа — для вновь добавляемых тизеров (если их не было в старом JSON).
TEASER_FORM_FIELDS: tuple[tuple[str, str], ...] = (
    ("bestseller", "teaser_bestseller"),
    ("new", "teaser_new"),
    ("recommended", "teaser_recommended"),
)


def teasers_list_for_save(raw_t: object, cleaned: dict) -> list[str]:
    """Собирает список для `Product.teasers`: сохраняет порядок из БД, дополняет каноническим порядком."""
    allowed = {k for k, _ in TEASER_FORM_FIELDS}
    checked = {k for k, fname in TEASER_FORM_FIELDS if cleaned.get(fname)}
    out: list[str] = []
    seen: set[str] = set()
    if isinstance(raw_t, list):
        for t in raw_t:
            if isinstance(t, str) and t in checked and t in allowed and t not in seen:
                out.append(t)
                seen.add(t)
    for k, _fname in TEASER_FORM_FIELDS:
        if k in checked and k not in seen:
            out.append(k)
            seen.add(k)
    return out


class ProductAdminForm(forms.ModelForm):
    """МП — отдельные URL; тизеры — чекбоксы вместо JSON (как на витрине: хит / новинка / рекомендуем)."""

    mp_wb = forms.URLField(
        label=_("Wildberries"),
        required=False,
        assume_scheme="https",
        widget=forms.URLInput(
            attrs={
                "class": _MP_INPUT_CLASSES,
                "placeholder": "https://www.wildberries.ru/catalog/…",
            }
        ),
    )
    mp_ozon = forms.URLField(
        label=_("Ozon"),
        required=False,
        assume_scheme="https",
        widget=forms.URLInput(
            attrs={
                "class": _MP_INPUT_CLASSES,
                "placeholder": "https://www.ozon.ru/product/…",
            }
        ),
    )
    mp_ym = forms.URLField(
        label=_("Яндекс Маркет"),
        required=False,
        assume_scheme="https",
        widget=forms.URLInput(
            attrs={
                "class": _MP_INPUT_CLASSES,
                "placeholder": "https://market.yandex.ru/…",
            }
        ),
    )
    mp_avito = forms.URLField(
        label=_("Авито"),
        required=False,
        assume_scheme="https",
        widget=forms.URLInput(
            attrs={
                "class": _MP_INPUT_CLASSES,
                "placeholder": "https://www.avito.ru/…",
            }
        ),
    )

    teaser_bestseller = forms.BooleanField(
        label=_("Хит продаж"),
        required=False,
        widget=forms.CheckboxInput(attrs={"class": _CHECK_CLASSES}),
    )
    teaser_new = forms.BooleanField(
        label=_("Новинка"),
        required=False,
        widget=forms.CheckboxInput(attrs={"class": _CHECK_CLASSES}),
    )
    teaser_recommended = forms.BooleanField(
        label=_("Рекомендуем"),
        required=False,
        widget=forms.CheckboxInput(attrs={"class": _CHECK_CLASSES}),
    )

    class Meta:
        model = Product
        exclude = ("marketplace_links", "teasers")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        mp = {}
        if self.instance and getattr(self.instance, "pk", None):
            raw = self.instance.marketplace_links
            if isinstance(raw, dict):
                mp = raw
        for key, field in (
            ("wb", "mp_wb"),
            ("ozon", "mp_ozon"),
            ("ym", "mp_ym"),
            ("avito", "mp_avito"),
        ):
            v = mp.get(key)
            if v and isinstance(v, str):
                self.initial.setdefault(field, v.strip())

        raw_t = getattr(self.instance, "teasers", None)
        if not isinstance(raw_t, list):
            raw_t = []
        allowed = {k for k, _ in TEASER_FORM_FIELDS}
        active = {t for t in raw_t if isinstance(t, str) and t in allowed}
        for key, fname in TEASER_FORM_FIELDS:
            self.initial.setdefault(fname, key in active)
