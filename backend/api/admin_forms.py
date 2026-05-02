"""Формы админки: удобный ввод вместо сырого JSON где возможно."""

from django import forms
from django.db import DatabaseError, transaction
from django.utils.translation import gettext_lazy as _
from unfold.widgets import UnfoldAdminPasswordWidget

from .models import OzonSellerApiSettings, Product, Promotion, SiteSettings

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


class PromotionAdminForm(forms.ModelForm):
    """Крупные области ввода для текста страницы акции — заметнее, что поля нужно заполнять."""

    class Meta:
        model = Promotion
        fields = "__all__"
        widgets = {
            "excerpt": forms.Textarea(attrs={"rows": 4}),
            "body": forms.Textarea(attrs={"rows": 14}),
        }


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


# Порядок строк = порядок в UI (см. default_header_navigation).
_HEADER_NAV_SLUGS: tuple[str, ...] = (
    "home",
    "catalog",
    "promotions",
    "about",
    "portfolio",
    "reviews",
    "blog",
    "contacts",
)
_HEADER_NAV_LABELS: dict[str, str] = {
    "home": "Главная",
    "catalog": "Каталог",
    "about": "О нас",
    "portfolio": "Портфолио",
    "reviews": "Отзывы",
    "blog": "Блог",
    "contacts": "Контакты",
    "promotions": "Акции",
}


class SiteSettingsHeaderNavMixin:
    """Поля `nav_item_*` вместо сырого JSON `header_navigation`."""

    def _header_nav_inject_fields(self) -> None:
        from config.header_nav import default_header_navigation, normalize_header_navigation

        inst = getattr(self, "instance", None)
        if inst and getattr(inst, "pk", None):
            norm = normalize_header_navigation(inst.header_navigation)
        else:
            norm = default_header_navigation()
        by_key = {r["key"]: r for r in norm}
        for key in _HEADER_NAV_SLUGS:
            row = by_key.get(key) or {"enabled": True, "order": 0, "label": ""}
            label_base = _HEADER_NAV_LABELS.get(key, key)
            self.fields[f"nav_item_{key}_enabled"] = forms.BooleanField(
                label=_("Показывать: %s") % label_base,
                required=False,
                initial=row.get("enabled", True) is not False and row.get("enabled") != 0,
                widget=forms.CheckboxInput(attrs={"class": _CHECK_CLASSES}),
            )
            self.fields[f"nav_item_{key}_order"] = forms.IntegerField(
                label=_("Порядок (%s)") % label_base,
                required=True,
                min_value=0,
                max_value=100,
                initial=int(row.get("order") or 0),
                help_text=_("Меньшее число — левее в шапке."),
                widget=forms.NumberInput(attrs={"class": _SMALL_INPUT_CLASSES, "style": "max-width:5rem;"}),
            )
            self.fields[f"nav_item_{key}_label"] = forms.CharField(
                label=_("Своя подпись: %s") % label_base,
                required=False,
                max_length=120,
                initial=(row.get("label") or "") if isinstance(row.get("label"), str) else "",
                help_text=_("Пусто — подставится подпись из «Главная (контент)» → «Интерфейс витрин»."),
                widget=forms.TextInput(attrs={"class": _MP_INPUT_CLASSES}),
            )
        if "nav_item_about_enabled" in self.fields:
            self.fields["nav_item_about_enabled"].help_text = _(
                "Включите и при необходимости отдельно включите «Отзывы» и «Портфолио» ниже — "
                "они откроются в подменю, а не в одной строке с остальными разделами."
            )

    def _header_nav_apply_to_instance(self, instance: SiteSettings) -> None:
        from config.header_nav import normalize_header_navigation

        rows: list[dict] = []
        for key in _HEADER_NAV_SLUGS:
            en = self.cleaned_data.get(f"nav_item_{key}_enabled", True)
            if isinstance(en, str):
                enabled = en not in ("0", "false", "False", "")
            else:
                enabled = en is not False
            try:
                order = int(self.cleaned_data.get(f"nav_item_{key}_order", 0))
            except (TypeError, ValueError):
                order = 0
            order = max(0, min(100, order))
            lab = self.cleaned_data.get(f"nav_item_{key}_label")
            label = (lab or "").strip()[:120] if isinstance(lab, str) else ""
            rows.append({"key": key, "enabled": bool(enabled), "order": order, "label": label})
        instance.header_navigation = normalize_header_navigation(rows)


class SiteSettingsAdminForm(SiteSettingsHeaderNavMixin, forms.ModelForm):
    """
    Все настройки сайта; JSON `header_navigation` не редактируется напрямую —
    заполняются поля `nav_item_*` (и секция «Шапка: пункты меню»).
    """

    class Meta:
        model = SiteSettings
        exclude = ("header_navigation",)
        widgets = {
            "smtp_password": forms.PasswordInput(
                render_value=True,
                attrs={"autocomplete": "new-password"},
            ),
            "astrum_crm_api_key": forms.PasswordInput(
                render_value=True,
                attrs={"autocomplete": "new-password"},
            ),
            "bitrix24_webhook_base": forms.PasswordInput(
                render_value=True,
                attrs={"autocomplete": "new-password"},
            ),
            "cdek_secure_password": forms.PasswordInput(
                render_value=True,
                attrs={"autocomplete": "new-password"},
            ),
            "ozon_pay_client_secret": forms.PasswordInput(
                render_value=True,
                attrs={"autocomplete": "new-password"},
            ),
            "ozon_pay_webhook_secret": forms.PasswordInput(
                render_value=True,
                attrs={"autocomplete": "new-password"},
            ),
            "reviews_yandex_widget_html": forms.Textarea(attrs={"rows": 8}),
            "seo_title_templates": forms.Textarea(
                attrs={"rows": 10, "class": "vLargeTextField font-mono text-sm", "spellcheck": "false"},
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._header_nav_inject_fields()

    def save(self, commit=True):
        instance = super().save(commit=False)
        self._header_nav_apply_to_instance(instance)
        if commit:
            instance.save()
        return instance


class SiteSettingsMenuSectionForm(SiteSettingsHeaderNavMixin, forms.ModelForm):
    """Секция «Шапка: пункты меню и отзывы»: только витрина, Яндекс и навигация (без остальных настроек)."""

    class Meta:
        model = SiteSettings
        fields = (
            "reviews_yandex_profile_url",
            "reviews_yandex_widget_html",
            "market_goods_feedback_enabled",
            "market_goods_feedback_business_id",
        )
        widgets = {
            "reviews_yandex_widget_html": forms.Textarea(attrs={"rows": 8}),
            "market_goods_feedback_business_id": forms.TextInput(
                attrs={
                    "placeholder": _("ID бизнеса из кабинета Маркета (Partner API), не URL магазина"),
                    "style": "max-width: 32rem;",
                }
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._header_nav_inject_fields()

    def save(self, commit=True):
        instance = super().save(commit=False)
        self._header_nav_apply_to_instance(instance)
        if commit:
            instance.save()
        return instance


class SiteSettingsOzonLogisticsSectionForm(forms.ModelForm):
    """Секция «логистика Ozon» + ключи в `OzonSellerApiSettings` (отдельная таблица — MySQL 65KB/строка)."""

    ozon_seller_client_id = forms.CharField(
        label=OzonSellerApiSettings._meta.get_field("client_id").verbose_name,
        help_text=OzonSellerApiSettings._meta.get_field("client_id").help_text,
        required=False,
        widget=forms.TextInput(attrs={"class": _MP_INPUT_CLASSES}),
    )
    ozon_seller_api_key = forms.CharField(
        label=OzonSellerApiSettings._meta.get_field("api_key").verbose_name,
        help_text=OzonSellerApiSettings._meta.get_field("api_key").help_text,
        required=False,
        widget=UnfoldAdminPasswordWidget(
            attrs={"autocomplete": "new-password"},
            render_value=True,
        ),
    )

    class Meta:
        model = SiteSettings
        fields = (
            "ozon_logistics_enabled",
            "ozon_logistics_delivery_payer",
            "ozon_logistics_buyer_note",
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and getattr(self.instance, "pk", None):
            # Только чтение: не создаём строку в БД на GET. Нет таблицы (не migrate) — не падаем.
            try:
                cred = OzonSellerApiSettings.objects.filter(
                    site_id=self.instance.pk
                ).first()
            except DatabaseError:
                return
            if cred is not None:
                self.initial.setdefault("ozon_seller_client_id", cred.client_id)
                self.initial.setdefault("ozon_seller_api_key", cred.api_key)

    def save(self, commit=True):
        """Ozon + SiteSettings в одной транзакции; Api-Key: пустое поле = не трогать (как у пароля)."""
        with transaction.atomic():
            instance = super().save(commit=commit)
            if not commit:
                return instance
            cid = (self.cleaned_data.get("ozon_seller_client_id") or "").strip()
            try:
                old = OzonSellerApiSettings.objects.get(site_id=instance.pk)
            except OzonSellerApiSettings.DoesNotExist:
                old = None
            if "ozon_seller_api_key" in self.data:
                k = (self.cleaned_data.get("ozon_seller_api_key") or "").strip()
                if k == "" and old and (old.api_key or "").strip():
                    new_key = old.api_key
                else:
                    new_key = k
            else:
                new_key = (old.api_key or "") if old else ""
            OzonSellerApiSettings.objects.update_or_create(
                site=instance,
                defaults={"client_id": cid, "api_key": new_key},
            )
        return instance
