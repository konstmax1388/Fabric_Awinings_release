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

_SMALL_INPUT_CLASSES = (
    "border border-base-200 rounded-default px-3 py-2 text-sm w-full max-w-md "
    "bg-white shadow-xs dark:border-base-700 dark:bg-base-900"
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
    material_map_enabled = forms.BooleanField(
        label=_("Показывать блок «Карта материалов»"),
        required=False,
        widget=forms.CheckboxInput(attrs={"class": _CHECK_CLASSES}),
    )
    material_map_title = forms.CharField(
        label=_("Заголовок блока"),
        required=False,
        max_length=120,
        widget=forms.TextInput(attrs={"class": _SMALL_INPUT_CLASSES}),
    )
    material_map_subtitle = forms.CharField(
        label=_("Подсказка под заголовком"),
        required=False,
        max_length=220,
        widget=forms.TextInput(attrs={"class": _MP_INPUT_CLASSES}),
    )
    material_layer_1_title = forms.CharField(
        label=_("Слой 1: название"),
        required=False,
        max_length=120,
        widget=forms.TextInput(attrs={"class": _SMALL_INPUT_CLASSES}),
    )
    material_layer_1_x = forms.IntegerField(
        label=_("Слой 1: X (%)"),
        required=False,
        min_value=0,
        max_value=100,
        widget=forms.NumberInput(attrs={"class": _SMALL_INPUT_CLASSES}),
    )
    material_layer_1_y = forms.IntegerField(
        label=_("Слой 1: Y (%)"),
        required=False,
        min_value=0,
        max_value=100,
        widget=forms.NumberInput(attrs={"class": _SMALL_INPUT_CLASSES}),
    )
    material_layer_2_title = forms.CharField(
        label=_("Слой 2: название"),
        required=False,
        max_length=120,
        widget=forms.TextInput(attrs={"class": _SMALL_INPUT_CLASSES}),
    )
    material_layer_2_x = forms.IntegerField(
        label=_("Слой 2: X (%)"),
        required=False,
        min_value=0,
        max_value=100,
        widget=forms.NumberInput(attrs={"class": _SMALL_INPUT_CLASSES}),
    )
    material_layer_2_y = forms.IntegerField(
        label=_("Слой 2: Y (%)"),
        required=False,
        min_value=0,
        max_value=100,
        widget=forms.NumberInput(attrs={"class": _SMALL_INPUT_CLASSES}),
    )
    material_layer_3_title = forms.CharField(
        label=_("Слой 3: название"),
        required=False,
        max_length=120,
        widget=forms.TextInput(attrs={"class": _SMALL_INPUT_CLASSES}),
    )
    material_layer_3_x = forms.IntegerField(
        label=_("Слой 3: X (%)"),
        required=False,
        min_value=0,
        max_value=100,
        widget=forms.NumberInput(attrs={"class": _SMALL_INPUT_CLASSES}),
    )
    material_layer_3_y = forms.IntegerField(
        label=_("Слой 3: Y (%)"),
        required=False,
        min_value=0,
        max_value=100,
        widget=forms.NumberInput(attrs={"class": _SMALL_INPUT_CLASSES}),
    )

    class Meta:
        model = Product
        exclude = ("marketplace_links", "teasers", "material_map")

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

        raw_mm = getattr(self.instance, "material_map", None)
        mm = raw_mm if isinstance(raw_mm, dict) else {}
        self.initial.setdefault("material_map_enabled", bool(mm.get("enabled")))
        self.initial.setdefault("material_map_title", (mm.get("title") or "").strip())
        self.initial.setdefault("material_map_subtitle", (mm.get("subtitle") or "").strip())
        layers = mm.get("layers") if isinstance(mm.get("layers"), list) else []
        for idx in range(1, 4):
            row = layers[idx - 1] if idx - 1 < len(layers) and isinstance(layers[idx - 1], dict) else {}
            self.initial.setdefault(f"material_layer_{idx}_title", str(row.get("title") or "").strip())
            self.initial.setdefault(f"material_layer_{idx}_x", row.get("x"))
            self.initial.setdefault(f"material_layer_{idx}_y", row.get("y"))
