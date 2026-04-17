import json
import logging
from typing import Any

from django import forms
from django.contrib import admin, messages
from django.contrib.admin import display
from django.contrib.auth.admin import GroupAdmin as DjangoGroupAdmin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import Group, User
from django.core.exceptions import PermissionDenied
from django.forms.models import modelform_factory
from django.http import Http404
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils.html import escape, format_html, format_html_join
from django.utils.safestring import mark_safe
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin, TabularInline
from unfold.widgets import UnfoldAdminPasswordWidget

from config.homepage_nav import (
    SECTION_FIELDS as HP_SECTION_FIELDS,
    SECTION_ORDER as HP_SECTION_ORDER,
    SECTIONS as HP_SECTIONS,
    hp_fieldset,
)
from config.sitesettings_nav import (
    SECTION_FIELDS as SS_SECTION_FIELDS,
    SECTION_ORDER as SS_SECTION_ORDER,
    SECTIONS as SS_SECTIONS,
    ss_fieldset,
)

from .admin_forms import ProductAdminForm, teasers_list_for_save
from .home_page_admin_form import (
    HomePageContentAdminForm,
    HomePageSectionForm,
    apply_homepage_section_save,
)
from .product_wb_import import WbImportError, import_one_from_wb_url

_logger = logging.getLogger(__name__)

from .models import (
    BlogPost,
    CalculatorLead,
    CallbackLead,
    CartOrder,
    CustomerProfile,
    HomePageContent,
    PortfolioProject,
    Product,
    ProductCategory,
    ProductImage,
    ProductSpecification,
    ProductVariant,
    Review,
    ShippingAddress,
    SiteEmailTemplate,
    SiteSettings,
)


def _sitesettings_section_nav(current_slug: str) -> list[dict[str, Any]]:
    return [
        {
            "slug": s,
            "title": SS_SECTIONS[s]["title"],
            "url": reverse("admin:api_sitesettings_section", kwargs={"slug": s}),
            "current": s == current_slug,
        }
        for s in SS_SECTION_ORDER
    ]


def _homepage_section_nav(current_slug: str) -> list[dict[str, Any]]:
    return [
        {
            "slug": s,
            "title": HP_SECTIONS[s]["nav"],
            "url": reverse("admin:api_homepagecontent_section", kwargs={"slug": s}),
            "current": s == current_slug,
        }
        for s in HP_SECTION_ORDER
    ]


def _sitesettings_section_modelform_factory(request, fields: tuple[str, ...]):
    """Виджеты Unfold как в обычной карточке модели (секции настроек — modelform_factory)."""
    model_admin = admin.site._registry[SiteSettings]

    def formfield_callback(db_field, **kwargs):
        if db_field.name == "smtp_password":
            kwargs["widget"] = UnfoldAdminPasswordWidget(
                attrs={"autocomplete": "new-password"},
                render_value=True,
            )
        if db_field.name == "astrum_crm_api_key":
            kwargs["widget"] = UnfoldAdminPasswordWidget(
                attrs={"autocomplete": "new-password"},
                render_value=True,
            )
        if db_field.name == "bitrix24_webhook_base":
            kwargs["widget"] = UnfoldAdminPasswordWidget(
                attrs={
                    "autocomplete": "new-password",
                    "placeholder": "https://…bitrix24…/rest/1/…",
                },
                render_value=True,
            )
        if db_field.name in (
            "cdek_secure_password",
            "ozon_pay_client_secret",
            "ozon_pay_webhook_secret",
        ):
            kwargs["widget"] = UnfoldAdminPasswordWidget(
                attrs={"autocomplete": "new-password"},
                render_value=True,
            )
        return model_admin.formfield_for_dbfield(db_field, request, **kwargs)

    return modelform_factory(
        SiteSettings,
        fields=fields,
        formfield_callback=formfield_callback,
    )


def _validate_astrum_crm_section(form: forms.ModelForm) -> None:
    inst = form.instance
    if not inst.astrum_crm_enabled:
        return
    key = (inst.astrum_crm_api_key or "").strip()
    if not key:
        form.add_error(
            "astrum_crm_api_key",
            _(
                "При включённой интеграции укажите API-ключ из панели приложения "
                "«Заявки с сайта» в Битрикс24."
            ),
        )
    if inst.astrum_crm_assigned_default is None:
        form.add_error(
            "astrum_crm_assigned_default",
            _("Укажите числовой ID ответственного (assigned_default в документации Astrum)."),
        )


class ProductImageInline(TabularInline):
    model = ProductImage
    extra = 1
    fields = ("variant", "image", "sort_order")
    verbose_name = _("Фото")
    verbose_name_plural = _(
        "Фотографии товара: загрузка файла (клик по полю / иконке или перетаскивание в рамку)"
    )


class ProductVariantInline(TabularInline):
    model = ProductVariant
    extra = 0
    fields = (
        "label",
        "wb_nm_id",
        "ozon_sku",
        "bitrix_xml_id",
        "bitrix_catalog_id",
        "price_from",
        "sort_order",
        "is_default",
        "marketplace_wb_url",
    )
    ordering = ("sort_order", "id")
    verbose_name = _("Вариант")
    verbose_name_plural = _("Варианты (торговые предложения)")


class ProductSpecificationInline(TabularInline):
    model = ProductSpecification
    extra = 1
    fields = ("group_name", "name", "value", "sort_order")
    ordering = ("sort_order", "id")
    verbose_name = _("Характеристика")
    verbose_name_plural = _("Характеристики")


@admin.register(ProductCategory)
class ProductCategoryAdmin(ModelAdmin):
    list_display = ("list_thumb", "title", "slug", "sort_order", "is_published")
    list_display_links = ("title",)
    list_filter = ("is_published",)
    search_fields = ("title", "slug")
    readonly_fields = ("slug",)
    ordering = ("sort_order", "title")
    fieldsets = (
        (
            _("Категория в каталоге"),
            {
                "fields": ("title", "slug", "image", "sort_order", "is_published"),
                "description": _(
                    "Слаг формируется автоматически из названия при сохранении (если пустой). "
                    "Используется в URL каталога (?category=…). Не удаляйте категорию, пока к ней привязаны товары. "
                    "Фото — на главной («Виды тентов») и в меню каталога; без фото подставляется картинка по умолчанию."
                ),
            },
        ),
    )

    @display(description=_("Фото"))
    def list_thumb(self, obj: ProductCategory):
        if not obj.image:
            return "—"
        return format_html(
            '<img src="{}" alt="" style="width:48px;height:48px;object-fit:cover;border-radius:8px;" />',
            obj.image.url,
        )


@admin.register(Product)
class ProductAdmin(ModelAdmin):
    form = ProductAdminForm
    list_per_page = 40
    list_display = (
        "list_thumb",
        "title",
        "slug",
        "category",
        "price_from",
        "show_on_home",
        "is_published",
        "sort_order",
    )
    # Первая колонка — превью (HTML), неочевидно что по ней можно перейти в карточку товара.
    list_display_links = ("title",)
    list_filter = ("category", "show_on_home", "is_published")
    search_fields = ("title", "slug", "excerpt")
    readonly_fields = ("slug",)
    ordering = ("sort_order", "-updated_at")
    inlines = [ProductVariantInline, ProductSpecificationInline, ProductImageInline]
    fieldsets = (
        (
            _("Как на сайте: название, категория и текст"),
            {
                "fields": ("title", "slug", "category", "excerpt", "description", "description_html"),
                "description": _(
                    "Слаг создаётся автоматически из названия при первом сохранении (импорт WB задаёт свой слаг). "
                    "HTML-описание (если заполнено) показывается на витрине вместо обычного текста. "
                    "Фотографии привязывайте к варианту или оставьте вариант пустым для общих фото. "
                    "Формат рамки фото (портрет 3:4 или квадрат) задаётся в «Настройки сайта» — на витрине кадр без обрезки."
                ),
            },
        ),
        (
            _("Каталог и главная"),
            {
                "fields": (
                    "price_from",
                    "is_published",
                    "sort_order",
                    "show_on_home",
                    "teaser_bestseller",
                    "teaser_new",
                    "teaser_recommended",
                ),
                "description": _(
                    "«Показывать на главной» — блок рекомендуемых на главной странице. "
                    "Бейджи на карточке товара: можно включить несколько; на сайте порядок: хит → новинка → рекомендуем."
                ),
            },
        ),
        (
            _("Ссылки на маркетплейсы в карточке товара"),
            {
                "fields": ("mp_wb", "mp_ozon", "mp_ym", "mp_avito"),
                "description": _(
                    "Полные URL карточек товара на площадках (можно с параметрами вроде ?from_sku=…). "
                    "Пустое поле — на витрине подставится общая витрина из «Настройки сайта», если площадка включена."
                ),
            },
        ),
        (
            _("Битрикс24: сопоставление с каталогом CRM"),
            {
                "fields": ("bitrix_xml_id", "bitrix_catalog_id"),
                "description": _(
                    "Внешний код (XML_ID) — для команды sync_bitrix_catalog_ids; числовой ID — в Astrum уходит как product_id. "
                    "Если вариантов несколько — XML_ID/ID у каждого варианта в таблице ниже; у товара поля — запасной вариант "
                    "для одновариантных позиций. Подробнее: docs/astrum-bitrix-crm.md."
                ),
            },
        ),
        (
            _("Ozon: доставка Ozon Логистика"),
            {
                "fields": ("ozon_sku",),
                "description": _(
                    "Числовой SKU товара в Ozon для поля items[].sku в Acquiring createOrder (если у варианта заполнен свой SKU — он важнее)."
                ),
            },
        ),
    )

    @display(description=_("Фото"))
    def list_thumb(self, obj: Product):
        qs = obj.images_rel.all()
        dv = obj.variants.filter(is_default=True).first()
        if dv:
            qs = qs.filter(variant=dv)
        elif obj.variants.exists():
            fv = obj.variants.order_by("sort_order", "id").first()
            if fv:
                qs = qs.filter(variant=fv)
        else:
            qs = qs.filter(variant__isnull=True)
        im = qs.order_by("sort_order", "id").first()
        if not im:
            im = obj.images_rel.order_by("sort_order", "id").first()
        url = None
        if im and im.image:
            url = im.image.url
        if not url:
            return "—"
        return format_html(
            '<img src="{}" width="52" height="52" loading="lazy" '
            'style="width:52px;height:52px;object-fit:cover" '
            'class="rounded-lg border border-base-200 dark:border-base-700" alt="">',
            url,
        )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("category")
            .prefetch_related("images_rel", "variants")
        )

    def save_model(self, request, obj, form, change):
        if isinstance(form, ProductAdminForm):
            links: dict[str, str] = {}
            for key, fname in (
                ("wb", "mp_wb"),
                ("ozon", "mp_ozon"),
                ("ym", "mp_ym"),
                ("avito", "mp_avito"),
            ):
                val = form.cleaned_data.get(fname)
                if val and str(val).strip():
                    links[key] = str(val).strip()
            obj.marketplace_links = links
            raw_before = obj.teasers if isinstance(obj.teasers, list) else []
            obj.teasers = teasers_list_for_save(raw_before, form.cleaned_data)
        super().save_model(request, obj, form, change)

    def get_urls(self):
        info = self.model._meta.app_label, self.model._meta.model_name
        return [
            path(
                "import-wb/",
                self.admin_site.admin_view(self.import_wb_view),
                name=f"{info[0]}_{info[1]}_import_wb",
            ),
            *super().get_urls(),
        ]

    def import_wb_view(self, request):
        if not self.has_add_permission(request):
            from django.core.exceptions import PermissionDenied

            raise PermissionDenied

        if request.method == "POST":
            form = WbBulkImportForm(request.POST)
            if form.is_valid():
                lines = [
                    ln.strip()
                    for ln in form.cleaned_data["urls"].splitlines()
                    if ln.strip()
                ]
                category = form.cleaned_data["category"]
                publish = form.cleaned_data["publish"]
                dry = form.cleaned_data["dry_run"]
                create_variants = form.cleaned_data["create_variants"]
                price_source_mode = form.cleaned_data["price_source_mode"]
                ok = 0
                for line in lines:
                    try:
                        preview, p, wb_warnings = import_one_from_wb_url(
                            line,
                            category=category,
                            publish=publish,
                            dry_run=dry,
                            create_variants=create_variants,
                            price_source_mode=price_source_mode,
                        )
                    except WbImportError as e:
                        messages.error(request, f"{line}: {e}")
                        continue
                    except Exception as e:
                        _logger.exception("WB import failed (admin)")
                        messages.error(
                            request,
                            _("%(url)s: внутренняя ошибка — %(err)s")
                            % {"url": line, "err": str(e)},
                        )
                        continue
                    for w in wb_warnings:
                        messages.warning(request, f"{line}: {w}")
                    if dry:
                        assert preview is not None
                        b = preview
                        n_img = sum(len(v.image_urls) for v in b.variants)
                        messages.info(
                            request,
                            _(
                                "Проверка: nm=%(nm)s — %(title)s — вариантов %(nv)d, "
                                "фото (скачиваемые) ≈%(n)d, характеристик %(ns)d, "
                                "цена %(price)s ₽ (источник: %(source)s, режим: %(mode)s)"
                            )
                            % {
                                "nm": b.seed_nm,
                                "title": b.title[:120],
                                "nv": len(b.variants),
                                "n": n_img,
                                "ns": len(b.specifications),
                                "price": b.price_from_min,
                                "source": b.price_from_min_source,
                                "mode": b.price_source_mode,
                            },
                        )
                    else:
                        assert p is not None
                        ok += 1
                        messages.success(
                            request,
                            _(
                                "Создан товар «%(title)s» (слаг %(slug)s), "
                                "цена «от» %(price)s ₽ (режим источника цены: %(mode)s)"
                            )
                            % {
                                "title": p.title,
                                "slug": p.slug,
                                "price": p.price_from,
                                "mode": price_source_mode,
                            },
                        )
                if ok and not dry:
                    return redirect("admin:api_product_changelist")
        else:
            form = WbBulkImportForm()

        context = {
            **self.admin_site.each_context(request),
            "title": _("Импорт с Wildberries"),
            "form": form,
            "opts": self.model._meta,
        }
        return TemplateResponse(request, "admin/api/product/import_wb.html", context)


_WB_TEXTAREA_CLASSES = (
    "block w-full max-w-3xl font-mono text-sm leading-relaxed "
    "border border-base-200 rounded-default px-3 py-2.5 "
    "bg-white text-font-default-light shadow-xs "
    "focus:outline-hidden focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 "
    "dark:border-base-700 dark:bg-base-900 dark:text-font-default-dark"
)
_WB_SELECT_CLASSES = (
    "block w-full max-w-md border border-base-200 rounded-default px-3 py-2 text-sm "
    "bg-white text-font-default-light shadow-xs "
    "focus:outline-hidden focus:ring-2 focus:ring-primary-600/30 "
    "dark:border-base-700 dark:bg-base-900 dark:text-font-default-dark"
)
_WB_CHECK_CLASSES = (
    "size-4 rounded border-base-300 text-primary-600 "
    "focus:ring-primary-600/40 dark:border-base-600"
)


class WbBulkImportForm(forms.Form):
    PRICE_SOURCE_CHOICES = (
        ("auto", _("auto — сначала salePriceU, затем fallback")),
        ("salePriceU", _("salePriceU — акцентная цена WB")),
        ("product", _("product — базовая цена из WB API")),
    )
    urls = forms.CharField(
        label=_("Ссылки на карточки Wildberries"),
        widget=forms.Textarea(
            attrs={
                "rows": 12,
                "class": _WB_TEXTAREA_CLASSES,
                "placeholder": "https://www.wildberries.ru/catalog/310046862/detail.aspx",
                "spellcheck": "false",
            }
        ),
        help_text=_(
            "По одной ссылке на строку. Подтягиваются название, описание, характеристики, варианты, цены. "
            "Фото скачиваются на ваш сервер (папка media). Устаревшие артикулы в группе WB могут быть пропущены — "
            "вверху появятся предупреждения."
        ),
    )
    category = forms.ModelChoiceField(
        label=_("Категория на сайте"),
        queryset=ProductCategory.objects.order_by("sort_order", "title"),
        empty_label=None,
        widget=forms.Select(attrs={"class": _WB_SELECT_CLASSES}),
    )
    publish = forms.BooleanField(
        label=_("Сразу опубликовать на витрине"),
        required=False,
        initial=False,
        widget=forms.CheckboxInput(attrs={"class": _WB_CHECK_CLASSES}),
    )
    dry_run = forms.BooleanField(
        label=_("Только проверить (ничего не сохранять)"),
        required=False,
        initial=False,
        widget=forms.CheckboxInput(attrs={"class": _WB_CHECK_CLASSES}),
    )
    create_variants = forms.BooleanField(
        label=_("Создавать варианты товара (как на WB)"),
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={"class": _WB_CHECK_CLASSES}),
        help_text=_(
            "Если выключено, создаётся только основной вариант из ссылки (без набора остальных вариантов WB)."
        ),
    )
    price_source_mode = forms.ChoiceField(
        label=_("Источник цены WB"),
        choices=PRICE_SOURCE_CHOICES,
        initial="auto",
        widget=forms.Select(attrs={"class": _WB_SELECT_CLASSES}),
        help_text=_("Какое поле цены использовать при импорте и расчёте «цены от»."),
    )


@admin.register(PortfolioProject)
class PortfolioProjectAdmin(ModelAdmin):
    list_display = ("title", "slug", "category", "is_published", "sort_order")
    list_filter = ("is_published", "category")
    ordering = ("sort_order", "-created_at")
    search_fields = ("title", "slug")
    readonly_fields = ("slug",)
    fieldsets = (
        (
            _("На странице /portfolio и блоке на главной"),
            {
                "fields": ("title", "slug", "category", "is_published", "sort_order"),
                "description": _("Слаг подставляется из названия при сохранении, если ещё не задан."),
            },
        ),
        (
            _("Фото до / после"),
            {
                "fields": ("before_image_file", "after_image_file", "completed_on"),
                "description": _("Загрузите изображения с компьютера (клик или перетаскивание в рамку)."),
            },
        ),
    )


@admin.register(Review)
class ReviewAdmin(ModelAdmin):
    list_display = ("name", "city", "reviewed_on", "is_moderated", "is_published", "sort_order", "created_at")
    list_filter = ("is_published", "is_moderated", "publication_consent", "rating")
    ordering = ("sort_order", "-created_at")
    search_fields = ("name", "city", "text")
    readonly_fields = ("submitted_from_site", "moderated_by", "moderated_at")
    actions = ("approve_and_publish", "mark_moderated_only")
    fieldsets = (
        (
            _("Блок отзывов на главной"),
            {
                "fields": (
                    "name",
                    "city",
                    "reviewed_on",
                    "text",
                    "rating",
                    "publication_consent",
                    "is_moderated",
                    "is_published",
                    "sort_order",
                )
            },
        ),
        (
            _("Медиа (опционально)"),
            {
                "fields": ("photo_file", "video_url"),
                "description": _("Фото — только загрузка файла. Видео — ссылка на ролик (YouTube и т.п.)."),
            },
        ),
        (
            _("Модерация"),
            {
                "fields": ("submitted_from_site", "moderated_by", "moderated_at"),
                "description": _("Публикация допускается только после подтверждения менеджером."),
            },
        ),
    )

    def save_model(self, request, obj, form, change):
        if obj.is_published and not obj.is_moderated:
            obj.is_moderated = True
        if obj.is_moderated and not obj.moderated_at:
            obj.moderated_at = timezone.now()
        if obj.is_moderated and obj.moderated_by_id is None and request.user.is_authenticated:
            obj.moderated_by = request.user
        super().save_model(request, obj, form, change)

    @admin.action(description="Подтвердить и опубликовать выбранные")
    def approve_and_publish(self, request, queryset):
        now = timezone.now()
        count = queryset.exclude(publication_consent=False).update(
            is_moderated=True,
            is_published=True,
            moderated_at=now,
            moderated_by=request.user if request.user.is_authenticated else None,
        )
        skipped = queryset.filter(publication_consent=False).count()
        if skipped:
            self.message_user(
                request,
                _(
                    "Опубликовано %(count)s. Пропущено без согласия: %(skipped)s."
                )
                % {"count": count, "skipped": skipped},
                level=messages.WARNING,
            )
            return
        self.message_user(request, _("Опубликовано: %(count)s.") % {"count": count}, level=messages.SUCCESS)

    @admin.action(description="Только подтвердить (без публикации)")
    def mark_moderated_only(self, request, queryset):
        now = timezone.now()
        count = queryset.update(
            is_moderated=True,
            moderated_at=now,
            moderated_by=request.user if request.user.is_authenticated else None,
        )
        self.message_user(request, _("Подтверждено: %(count)s.") % {"count": count}, level=messages.SUCCESS)


@admin.register(BlogPost)
class BlogPostAdmin(ModelAdmin):
    list_display = ("title", "slug", "published_at", "is_published")
    list_filter = ("is_published",)
    date_hierarchy = "published_at"
    ordering = ("-published_at", "-id")
    search_fields = ("title", "slug", "excerpt")
    readonly_fields = ("slug",)
    fieldsets = (
        (
            _("Раздел /blog"),
            {
                "fields": ("title", "slug", "is_published", "published_at"),
                "description": _("Слаг генерируется из заголовка при сохранении, пока поле пустое."),
            },
        ),
        (
            _("Текст и обложка"),
            {
                "fields": ("excerpt", "body", "cover_image"),
                "description": _("Обложка — только загрузка файла."),
            },
        ),
    )


@admin.register(CalculatorLead)
class CalculatorLeadAdmin(ModelAdmin):
    list_display = ("name", "phone", "length_m", "width_m", "estimated_price_rub", "created_at")
    date_hierarchy = "created_at"
    ordering = ("-created_at", "-id")
    search_fields = ("name", "phone", "comment")
    readonly_fields = ("created_at",)
    fieldsets = (
        (_("Заявка с главной (калькулятор)"), {"fields": ("name", "phone", "comment")}),
        (_("Параметры расчёта"), {"fields": ("length_m", "width_m", "material_id", "material_label", "options", "estimated_price_rub")}),
        (_("Системное"), {"fields": ("created_at",), "classes": ("collapse",)}),
    )


def _format_cart_order_rub(n: int | None) -> str:
    v = int(n or 0)
    spaced = f"{v:,}".replace(",", " ")
    return f"{spaced} руб."


@admin.register(CallbackLead)
class CallbackLeadAdmin(ModelAdmin):
    list_display = ("name", "phone", "source", "created_at")
    list_filter = ("source",)
    date_hierarchy = "created_at"
    ordering = ("-created_at", "-id")
    search_fields = ("name", "phone", "comment")
    readonly_fields = ("created_at",)
    fieldsets = (
        (_("Заявка"), {"fields": ("name", "phone", "comment", "source")}),
        (_("Системное"), {"fields": ("created_at",), "classes": ("collapse",)}),
    )


@admin.register(CartOrder)
class CartOrderAdmin(ModelAdmin):
    list_select_related = ("user",)
    date_hierarchy = "created_at"
    ordering = ("-created_at", "-id")
    list_display = (
        "order_ref",
        "customer_name",
        "customer_phone",
        "list_total_rub",
        "fulfillment_status",
        "payment_status",
        "crm_list_column",
        "created_at",
    )
    list_filter = ("fulfillment_status", "payment_status", "bitrix_sync_status")
    search_fields = ("order_ref", "customer_name", "customer_phone", "customer_email", "bitrix_entity_id")
    readonly_fields = (
        "order_ref",
        "lines_table",
        "total_approx_display",
        "lines",
        "manager_letter",
        "client_ack",
        "created_at",
        "bitrix_sync_attempts",
        "crm_sync_summary",
    )
    fieldsets = (
        (
            _("Заказ с сайта"),
            {
                "fields": ("order_ref", "lines_table", "total_approx_display", "created_at"),
                "description": _(
                    "Состав и сумма пришли с витрины. Ниже в свёрнутом блоке «Отладка» — те же позиции сырьём (JSON), "
                    "как их передаёт сайт (англ. имена полей: title, qty, priceFrom, slug, productId, variantId)."
                ),
            },
        ),
        (
            _("Отладка"),
            {
                "fields": ("lines",),
                "classes": ("collapse",),
                "description": _("Технический формат; обычно достаточно таблицы позиций выше."),
            },
        ),
        (
            _("CRM: Битрикс24 (Astrum)"),
            {
                "fields": ("crm_sync_summary",),
                "description": _(
                    "После оформления заказ отправляется в приложение «Заявки с сайта»; ниже — итог и текст ошибки, если была."
                ),
            },
        ),
        (_("Покупатель"), {"fields": ("customer_name", "customer_phone", "customer_email", "customer_comment", "user")}),
        (
            _("Обработка заказа"),
            {"fields": ("fulfillment_status", "payment_status", "payment_provider", "payment_external_id")},
        ),
        (
            _("Доставка и способ оплаты (с сайта)"),
            {
                "fields": (
                    "delivery_method",
                    "payment_method",
                    "delivery_provider",
                    "delivery_snapshot",
                    "cdek_tracking",
                    "acquiring_payload",
                ),
            },
        ),
        (
            _("Битрикс24: поля для правки (при необходимости)"),
            {
                "fields": ("bitrix_entity_id", "bitrix_sync_status", "bitrix_sync_error", "bitrix_sync_attempts"),
                "classes": ("collapse",),
                "description": _(
                    "Обычно заполняются автоматически. Повторная отправка — команда retry_astrum_crm_orders или сохраните заказ после исправления интеграции."
                ),
            },
        ),
        (_("Письма и текст для клиента"), {"fields": ("manager_letter", "client_ack"), "classes": ("collapse",)}),
    )

    @display(description=_("Сумма"), ordering="total_approx")
    def list_total_rub(self, obj: CartOrder) -> str:
        return _format_cart_order_rub(obj.total_approx)

    @display(description=_("Сумма заказа"))
    def total_approx_display(self, obj: CartOrder | None) -> str:
        if obj is None:
            return "—"
        return _format_cart_order_rub(obj.total_approx)

    @display(description=_("Позиции заказа"))
    def lines_table(self, obj: CartOrder | None) -> str:
        if obj is None or not obj.pk:
            return "—"
        raw = obj.lines
        rows: list[dict[str, Any]] = raw if isinstance(raw, list) else []
        if not rows:
            return format_html(
                '<p class="text-sm text-font-subtle-light dark:text-font-subtle-dark">{}</p>',
                _("Позиций нет."),
            )
        head = format_html(
            "<thead><tr>"
            "<th class='px-2 py-1.5 text-left text-xs font-semibold'>{}</th>"
            "<th class='px-2 py-1.5 text-right text-xs font-semibold'>{}</th>"
            "<th class='px-2 py-1.5 text-right text-xs font-semibold'>{}</th>"
            "<th class='px-2 py-1.5 text-left text-xs font-semibold'>{}</th>"
            "<th class='px-2 py-1.5 text-left text-xs font-semibold'>{}</th>"
            "<th class='px-2 py-1.5 text-left text-xs font-semibold'>{}</th>"
            "</tr></thead>",
            _("Наименование"),
            _("Кол-во"),
            _("Цена от"),
            _("Ссылка (slug)"),
            _("ID товара"),
            _("ID варианта"),
        )
        body_cells: list[str] = []
        for item in rows:
            if not isinstance(item, dict):
                body_cells.append(
                    "<tr><td colspan='6' class='px-2 py-1 text-xs text-amber-800'>{}</td></tr>".format(
                        escape(_("Некорректная строка: {}").format(repr(item)[:200]))
                    )
                )
                continue
            title = str(item.get("title") or "—").strip() or "—"
            qty = item.get("qty")
            qty_s = str(qty) if qty is not None else "—"
            pf = item.get("priceFrom")
            if pf is not None:
                try:
                    price_s = _format_cart_order_rub(int(pf))
                except (TypeError, ValueError):
                    price_s = escape(str(pf))
            else:
                price_s = "—"
            slug = str(item.get("slug") or "—").strip() or "—"
            pid = str(item.get("productId") or "—").strip() or "—"
            vid_raw = item.get("variantId")
            vid = str(vid_raw).strip() if vid_raw not in (None, "") else "—"
            body_cells.append(
                "<tr class='border-t border-base-200 dark:border-base-700'>"
                f"<td class='px-2 py-1.5 text-sm'>{escape(title)}</td>"
                f"<td class='px-2 py-1.5 text-right text-sm'>{escape(qty_s)}</td>"
                f"<td class='px-2 py-1.5 text-right text-sm'>{price_s}</td>"
                f"<td class='px-2 py-1.5 text-xs font-mono'>{escape(slug)}</td>"
                f"<td class='px-2 py-1.5 text-xs font-mono'>{escape(pid)}</td>"
                f"<td class='px-2 py-1.5 text-xs font-mono'>{escape(vid)}</td>"
                "</tr>"
            )
        tbody = format_html("<tbody>{}</tbody>", mark_safe("".join(body_cells)))
        return format_html(
            '<div class="overflow-x-auto rounded-default border border-base-200 dark:border-base-700">'
            '<table class="min-w-full border-collapse">{}{}</table></div>',
            head,
            tbody,
        )

    @staticmethod
    def _crm_status_style(status: str) -> tuple[str, str]:
        """CSS-классы: фон, текст."""
        m = {
            CartOrder.BitrixSyncStatus.SYNCED: (
                "bg-green-100 text-green-900 dark:bg-green-950/60 dark:text-green-200",
                "check_circle",
            ),
            CartOrder.BitrixSyncStatus.ERROR: (
                "bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200",
                "error",
            ),
            CartOrder.BitrixSyncStatus.PENDING: (
                "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
                "schedule",
            ),
            CartOrder.BitrixSyncStatus.NOT_SENT: (
                "bg-base-200 text-base-700 dark:bg-base-800 dark:text-base-300",
                "cloud_off",
            ),
        }
        return m.get(
            status,
            ("bg-base-200 text-base-700 dark:bg-base-800 dark:text-base-300", "help"),
        )

    @display(description=_("CRM (Битрикс24)"), ordering="bitrix_sync_status")
    def crm_list_column(self, obj: CartOrder) -> str:
        label = obj.get_bitrix_sync_status_display()
        css, icon = self._crm_status_style(obj.bitrix_sync_status)
        badge = format_html(
            '<span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium {}">'
            '<span class="material-symbols-outlined text-[14px] leading-none">{}</span>{}</span>',
            css,
            icon,
            escape(label),
        )
        parts = [badge]
        eid = (obj.bitrix_entity_id or "").strip()
        if eid and obj.bitrix_sync_status == CartOrder.BitrixSyncStatus.SYNCED:
            parts.append(
                format_html(
                    '<div class="mt-1 max-w-[14rem] truncate text-xs text-font-subtle-light dark:text-font-subtle-dark" title="{}">ID: {}</div>',
                    escape(eid),
                    escape(eid),
                )
            )
        err = (obj.bitrix_sync_error or "").strip()
        if err and obj.bitrix_sync_status == CartOrder.BitrixSyncStatus.ERROR:
            short = err.replace("\n", " ")[:120]
            if len(err) > 120:
                short += "…"
            parts.append(
                format_html(
                    '<div class="mt-1 max-w-[18rem] text-xs text-red-700 dark:text-red-300" title="{}">{}</div>',
                    escape(err[:500]),
                    escape(short),
                )
            )
        inner = format_html_join("", "{}", ((p,) for p in parts))
        return format_html('<div class="leading-tight">{}</div>', inner)

    @display(description=_("Сводка по CRM"))
    def crm_sync_summary(self, obj: CartOrder | None) -> str:
        if obj is None or not obj.pk:
            return "—"
        label = obj.get_bitrix_sync_status_display()
        css, icon = self._crm_status_style(obj.bitrix_sync_status)
        head = format_html(
            '<div class="mb-3 flex flex-wrap items-center gap-2">'
            '<span class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium {}">'
            '<span class="material-symbols-outlined text-[20px]">{}</span>{}</span>'
            '<span class="text-sm text-font-subtle-light dark:text-font-subtle-dark">{} {}</span></div>',
            css,
            icon,
            escape(label),
            _("Попыток отправки:"),
            obj.bitrix_sync_attempts or 0,
        )
        if obj.bitrix_sync_status == CartOrder.BitrixSyncStatus.SYNCED:
            eid = (obj.bitrix_entity_id or "").strip()
            if eid:
                body = format_html(
                    '<p class="text-sm"><span class="font-medium">{}</span> '
                    '<code class="rounded bg-base-100 px-1.5 py-0.5 text-xs dark:bg-base-800">{}</code></p>',
                    _("ID ответа (Astrum / заявка):"),
                    escape(eid),
                )
            else:
                body = format_html(
                    '<p class="text-sm text-font-subtle-light dark:text-font-subtle-dark">{}</p>',
                    _("Успешно, но в ответе не было id — проверьте панель Astrum / Б24."),
                )
        elif obj.bitrix_sync_status == CartOrder.BitrixSyncStatus.ERROR:
            err = (obj.bitrix_sync_error or "").strip() or _("Текст ошибки не сохранён.")
            body = format_html(
                '<p class="mb-1 text-sm font-medium text-red-800 dark:text-red-200">{}</p>'
                '<pre class="max-h-48 overflow-auto rounded-default border border-red-200 bg-red-50/80 p-3 text-xs whitespace-pre-wrap dark:border-red-900/50 dark:bg-red-950/30">{}</pre>',
                _("Сообщение об ошибке:"),
                escape(err),
            )
        elif obj.bitrix_sync_status == CartOrder.BitrixSyncStatus.NOT_SENT:
            body = format_html(
                '<p class="text-sm text-font-subtle-light dark:text-font-subtle-dark">{}</p>',
                _(
                    "Заказ не отправлялся: интеграция Astrum выключена или не заданы API-ключ и ответственный "
                    "(см. «Настройки сайта» → Битрикс24 / переменные ASTRUM_CRM_*)."
                ),
            )
        else:
            body = format_html(
                '<p class="text-sm text-font-subtle-light dark:text-font-subtle-dark">{}</p>',
                _("Отправка выполнялась или ожидает повтора; при необходимости см. свёрнутый блок полей ниже."),
            )
        return format_html("{}{}", head, body)



class SiteSettingsAdminForm(forms.ModelForm):
    class Meta:
        model = SiteSettings
        fields = "__all__"
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
        }


@admin.register(SiteSettings)
class SiteSettingsAdmin(ModelAdmin):
    form = SiteSettingsAdminForm
    list_display = (
        "id",
        "site_name",
        "show_social_links",
        "show_calculator",
        "show_marketplace_wb",
        "show_marketplace_ozon",
        "show_marketplace_ym",
        "show_marketplace_avito",
    )
    readonly_fields = ("id", "smtp_test_link")
    fieldsets = (
        ss_fieldset(
            "logo",
            {
                "fields": ("logo", "favicon"),
                "description": _(
                    "Загрузка с компьютера (перетаскивание в рамку). "
                    "Если поля пустые — на сайте подставляются файлы по умолчанию из сборки витрины."
                ),
            },
        ),
        ss_fieldset(
            "branding",
            {
                "fields": ("site_name", "site_tagline", "footer_note"),
                "description": _("Отображаются в шапке и в подвале на всех страницах."),
            },
        ),
        ss_fieldset(
            "contacts",
            {
                "fields": (
                    "phone_display",
                    "phone_href",
                    "email",
                    "address",
                    "legal",
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
                    "map_submitting",
                    "map_success_message",
                ),
                "description": _(
                    "Телефон, почта, адрес и реквизиты: шапка, подвал, страница «Контакты», подпись под картой. "
                    "Ниже — блок «карта + форма заявки» внизу главной: заполненное поле подменяет подпись из "
                    "«Главная страница (контент)»; пустое — на сайте берётся из контента главной."
                ),
            },
        ),
        ss_fieldset(
            "smtp",
            {
                "fields": (
                    "notification_recipients",
                    "smtp_enabled",
                    "smtp_host",
                    "smtp_port",
                    "smtp_use_tls",
                    "smtp_use_ssl",
                    "smtp_user",
                    "smtp_password",
                    "email_outbound_from",
                    "smtp_test_link",
                ),
                "description": _(
                    "Сюда приходят уведомления о заявках с калькулятора и заказах из корзины. "
                    "Тексты и темы писем настраиваются в разделе «Шаблоны писем» в этом же меню. "
                    "Сохраните настройки, затем откройте ссылку проверки и отправьте тестовое письмо. "
                    "Входящие заявки по-прежнему в разделах «Заявки калькулятора» и «Заказы корзины»."
                ),
            },
        ),
        ss_fieldset(
            "crm_astrum",
            {
                "fields": (
                    "astrum_crm_enabled",
                    "astrum_crm_api_key",
                    "astrum_crm_assigned_default",
                    "astrum_crm_api_url",
                    "astrum_crm_contact_behavior",
                    "astrum_crm_entity_behavior",
                    "astrum_crm_deal_title_prefix",
                    "astrum_crm_timeout_seconds",
                ),
                "description": _(
                    "После оформления заказа на сайте данные уходят в приложение «Заявки с сайта» (Astrum) "
                    "в Битрикс24. Документация API: https://app-5.astrum.agency/documentation — "
                    "Поведение со сделкой: для каждого заказа отдельная сделка в Б24 выберите «Всегда новая сделка/лид» (CREATE_ANYWAY). "
                    "«Добавлять к активной» объединяет повторные заказы одного клиента в комментарии к одной сделке. "
                    "Параметры contact_behavior и entity_behavior — как в документации Astrum. "
                    "Если интеграция здесь выключена, можно задать ASTRUM_CRM_API_KEY и "
                    "ASTRUM_CRM_ASSIGNED_DEFAULT в переменных окружения (приоритет у настроек из этого блока, "
                    "когда включено «Включить отправку…» и заполнены ключ и ответственный)."
                ),
            },
        ),
        ss_fieldset(
            "crm_bitrix_catalog",
            {
                "fields": (
                    "bitrix24_webhook_base",
                    "bitrix24_catalog_product_iblock_id",
                    "bitrix24_catalog_offer_iblock_id",
                ),
                "description": _(
                    "Сохраните вебхук и инфоблоки, затем «Проверка вебхука» и при необходимости "
                    "«Массовое сопоставление товаров» (подстановка ID каталога Б24 по XML_ID). "
                    "Та же логика, что у команды sync_bitrix_catalog_ids. "
                    "Вебхук в Б24: Приложения → Входящий вебхук с правом «Каталог». "
                    "Не путать с API-ключом Astrum для заказов. "
                    "Резерв: BITRIX24_* в .env, если поля здесь пустые."
                ),
            },
        ),
        ss_fieldset(
            "social",
            {
                "fields": ("show_social_links", "footer_vk_url", "footer_telegram_url"),
                "description": _(
                    "Включите «Показывать блок соцсетей», чтобы в подвале сайта появился раздел ВКонтакте и Telegram. "
                    "Выключено — блок на витрине скрыт, URL можно сохранить для будущего. "
                    "Пустой URL — на сайте ведёт на заглушку (#)."
                ),
            },
        ),
        ss_fieldset(
            "contacts_page",
            {
                "fields": (
                    "contacts_page_title",
                    "contacts_intro",
                    "contacts_hours",
                    "contacts_meta_description",
                    "contacts_back_link_label",
                ),
                "description": _(
                    "Заголовок и тексты только для маршрута /contacts. "
                    "Телефон, email, адрес и настройки карты на главной — в блоке «Контакты на витрине»."
                ),
            },
        ),
        ss_fieldset(
            "calculator",
            {
                "fields": ("show_calculator",),
                "description": _(
                    "Включите или выключите блок калькулятора на главной странице. "
                    "Подписи полей, кнопки и тексты — в разделе «Главная страница (контент)», блок «Калькулятор»."
                ),
            },
        ),
        ss_fieldset(
            "catalog",
            {
                "fields": ("catalog_intro", "product_photo_aspect"),
                "description": _(
                    "Текст под заголовком «Каталог» и формат фото в карточках. "
                    "Портрет 3:4 — рамка как 900×1200; квадрат — 1:1. На сайте фото не обрезается."
                ),
            },
        ),
        ss_fieldset(
            "checkout_pickup",
            {
                "fields": (
                    "checkout_pickup_enabled",
                    "pickup_point_title",
                    "pickup_point_address",
                    "pickup_point_hours",
                    "pickup_point_note",
                    "pickup_point_lat",
                    "pickup_point_lng",
                ),
                "description": _(
                    "Самовывоз со склада: данные показываются на оформлении заказа. "
                    "Наличные при выдаче — без онлайн-эквайринга (или вместе с картой, если включён Ozon Pay)."
                ),
            },
        ),
        ss_fieldset(
            "checkout_cdek",
            {
                "fields": (
                    "cdek_enabled",
                    "cdek_test_mode",
                    "cdek_account",
                    "cdek_secure_password",
                    "cdek_widget_script_url",
                    "cdek_yandex_map_api_key",
                    "cdek_widget_sender_city",
                    "cdek_manual_pvz_enabled",
                ),
                "description": _(
                    "API v2: тест https://api.edu.cdek.ru, бой https://api.cdek.ru (см. docs/cdek-api-v2.md). "
                    "Секрет можно задать в .env: CDEK_ACCOUNT, CDEK_SECURE, CDEK_API_BASE_URL. "
                    "Виджет v3: wiki https://github.com/cdek-it/widget/wiki — скрипт по умолчанию @cdek-it/widget@3; "
                    "прокси расчёта: GET/POST …/api/cdek-widget/service/ (ключ Яндекс.Карт — в поле ниже)."
                ),
            },
        ),
        ss_fieldset(
            "checkout_ozon_logistics",
            {
                "fields": ("ozon_logistics_enabled", "ozon_logistics_buyer_note"),
                "description": _(
                    "Доставка через Ozon Логистику: подключение в кабинете продавца Ozon. "
                    "На витрине доступна только вместе с онлайн-оплатой (Ozon Pay)."
                ),
            },
        ),
        ss_fieldset(
            "checkout_ozon_pay",
            {
                "fields": (
                    "ozon_pay_enabled",
                    "ozon_pay_sandbox",
                    "ozon_pay_client_id",
                    "ozon_pay_client_secret",
                    "ozon_pay_webhook_secret",
                ),
                "description": _(
                    "Эквайринг Ozon Bank: Ozon Pay Checkout — https://docs.ozon.ru/api/acquiring/ "
                    "Сервер вызывает POST …/v1/createOrder с подписью requestSign (accessKey + secretKey). "
                    "Базовый URL API: OZON_PAY_API_BASE_URL в .env. "
                    "Вебхук POST: /api/webhooks/ozon-pay/ — проверка requestSign по notificationSecretKey. "
                    "См. docs/ozon-pay-env.md."
                ),
            },
        ),
        ss_fieldset(
            "mp_show",
            {
                "fields": (
                    "show_marketplace_wb",
                    "show_marketplace_ozon",
                    "show_marketplace_ym",
                    "show_marketplace_avito",
                ),
                "description": _("Включённые площадки — в шапке, подвале и в карточках товаров."),
            },
        ),
        ss_fieldset(
            "mp_urls",
            {
                "fields": ("global_url_wb", "global_url_ozon", "global_url_ym", "global_url_avito"),
                "description": _(
                    "Подставляются, если у товара нет своей ссылки на эту площадку. "
                    "Пустое поле — берётся ссылка по умолчанию из настроек витрины."
                ),
            },
        ),
    )

    def _redirect_first_section(self):
        return redirect("admin:api_sitesettings_section", slug=SS_SECTION_ORDER[0])

    def changelist_view(self, request, extra_context=None):
        return self._redirect_first_section()

    def change_view(self, request, object_id, form_url="", extra_context=None):
        return self._redirect_first_section()

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def section_view(self, request, slug: str):
        if slug not in SS_SECTION_FIELDS:
            raise Http404
        if not self.has_change_permission(request):
            raise PermissionDenied
        obj = SiteSettings.get_solo()
        fields = SS_SECTION_FIELDS[slug]
        SectionForm = _sitesettings_section_modelform_factory(request, fields)
        if request.method == "POST":
            form = SectionForm(request.POST, request.FILES, instance=obj)
            if form.is_valid():
                if slug == "crm_astrum":
                    _validate_astrum_crm_section(form)
                if form.is_valid():
                    form.save()
                    messages.success(request, _("Изменения сохранены."))
                    return redirect("admin:api_sitesettings_section", slug=slug)
        else:
            form = SectionForm(instance=obj)
        meta = SS_SECTIONS[slug]
        context = {
            **self.admin_site.each_context(request),
            "title": str(meta["title"]),
            "section_title": meta["title"],
            "opts": self.model._meta,
            "form": form,
            "section_slug": slug,
            "section_index_url": reverse(
                "admin:api_sitesettings_section",
                kwargs={"slug": SS_SECTION_ORDER[0]},
            ),
            "smtp_test_url": reverse("admin:api_sitesettings_smtp_test") if slug == "smtp" else None,
            "ozon_pay_test_url": (
                reverse("admin:api_sitesettings_ozon_pay_test")
                if slug == "checkout_ozon_pay"
                else None
            ),
            "bitrix24_test_url": (
                reverse("admin:api_sitesettings_bitrix24_catalog_test")
                if slug == "crm_bitrix_catalog"
                else None
            ),
            "bitrix24_sync_url": (
                reverse("admin:api_sitesettings_bitrix24_catalog_sync")
                if slug == "crm_bitrix_catalog"
                else None
            ),
            "section_nav": _sitesettings_section_nav(slug),
        }
        return TemplateResponse(request, "admin/api/section_form.html", context)

    @display(description=_("Проверка SMTP"))
    def smtp_test_link(self, obj: SiteSettings):
        info = self.opts.app_label, self.opts.model_name
        url = reverse("admin:%s_%s_smtp_test" % info)
        return format_html(
            '<a href="{}" class="inline-flex items-center rounded-default border border-base-200 bg-white px-4 py-2 text-sm font-medium text-primary-600 shadow-xs hover:bg-base-50 dark:border-base-700 dark:bg-base-900 dark:hover:bg-base-800">{}</a>',
            url,
            _("Открыть страницу проверки отправки…"),
        )

    def get_urls(self):
        info = self.opts.app_label, self.opts.model_name
        return [
            path(
                "section/<slug>/",
                self.admin_site.admin_view(self.section_view),
                name="%s_%s_section" % info,
            ),
            path(
                "smtp-test/",
                self.admin_site.admin_view(self.smtp_test_view),
                name="%s_%s_smtp_test" % info,
            ),
            path(
                "ozon-pay-test/",
                self.admin_site.admin_view(self.ozon_pay_test_view),
                name="%s_%s_ozon_pay_test" % info,
            ),
            path(
                "bitrix24-catalog-test/",
                self.admin_site.admin_view(self.bitrix24_catalog_test_view),
                name="%s_%s_bitrix24_catalog_test" % info,
            ),
            path(
                "bitrix24-catalog-sync/",
                self.admin_site.admin_view(self.bitrix24_catalog_sync_view),
                name="%s_%s_bitrix24_catalog_sync" % info,
            ),
            *super().get_urls(),
        ]

    def bitrix24_catalog_test_view(self, request):
        from .services.bitrix24_admin_test import run_bitrix24_saved_settings_test

        test_results = None
        if request.method == "POST" and request.POST.get("run_test"):
            test_results = run_bitrix24_saved_settings_test()

        s = SiteSettings.get_solo()
        context = {
            **self.admin_site.each_context(request),
            "title": _("Проверка вебхука Битрикс24"),
            "opts": self.model._meta,
            "site_settings": s,
            "test_results": test_results,
        }
        return TemplateResponse(
            request, "admin/api/sitesettings/bitrix24_webhook_test.html", context
        )

    def bitrix24_catalog_sync_view(self, request):
        from api.services.bitrix24_catalog_sync import run_bitrix24_catalog_sync_job

        if not self.has_change_permission(request):
            raise PermissionDenied

        sync_result = None
        dup_warnings_hidden = 0
        form_force = False
        form_skip_variants = False
        form_skip_products = False
        form_no_products = False
        form_no_offers = False
        form_timeout = 120

        if request.method == "POST" and request.POST.get("sync_action"):
            action = (request.POST.get("sync_action") or "").strip()
            dry_run = action != "apply"
            form_force = bool(request.POST.get("force"))
            form_skip_variants = bool(request.POST.get("skip_variants"))
            form_skip_products = bool(request.POST.get("skip_products"))
            form_no_products = bool(request.POST.get("no_products"))
            form_no_offers = bool(request.POST.get("no_offers"))
            try:
                form_timeout = max(10, min(600, int(request.POST.get("timeout") or 120)))
            except (TypeError, ValueError):
                form_timeout = 120

            sync_result = run_bitrix24_catalog_sync_job(
                dry_run=dry_run,
                force=form_force,
                no_products=form_no_products,
                no_offers=form_no_offers,
                skip_model_products=form_skip_products,
                skip_model_variants=form_skip_variants,
                timeout=form_timeout,
            )
            if sync_result.duplicate_warnings:
                dup_warnings_hidden = max(0, len(sync_result.duplicate_warnings) - 40)
            if sync_result.ok:
                if dry_run:
                    messages.info(request, _("Пробный прогон выполнен (счётчики без записи в БД)."))
                else:
                    messages.success(request, _("Поля «ID в каталоге Б24» обновлены."))
            else:
                messages.error(request, sync_result.error or _("Ошибка синхронизации"))

        context = {
            **self.admin_site.each_context(request),
            "title": _("Сопоставление каталога Б24"),
            "opts": self.model._meta,
            "sync_result": sync_result,
            "dup_warnings_hidden": dup_warnings_hidden,
            "form_force": form_force,
            "form_skip_variants": form_skip_variants,
            "form_skip_products": form_skip_products,
            "form_no_products": form_no_products,
            "form_no_offers": form_no_offers,
            "form_timeout": form_timeout,
        }
        return TemplateResponse(
            request, "admin/api/sitesettings/bitrix24_catalog_sync.html", context
        )

    def smtp_test_view(self, request):
        from .services.notification_email import parse_recipient_list, send_smtp_test

        if request.method == "POST":
            to = request.POST.get("test_to", "").strip()
            ok, err = send_smtp_test(to)
            if ok:
                messages.success(request, _("Письмо отправлено на %(email)s") % {"email": to})
            else:
                messages.error(request, err)
            info = self.opts.app_label, self.opts.model_name
            return redirect("admin:%s_%s_smtp_test" % info)

        s = SiteSettings.get_solo()
        default_to = ""
        rec = parse_recipient_list(s.notification_recipients or "")
        if rec:
            default_to = rec[0]
        elif getattr(request.user, "email", None):
            default_to = request.user.email.strip()

        context = {
            **self.admin_site.each_context(request),
            "title": _("Проверка SMTP"),
            "opts": self.model._meta,
            "site_settings": s,
            "default_test_to": default_to,
        }
        return TemplateResponse(request, "admin/api/sitesettings/smtp_test.html", context)

    def ozon_pay_test_view(self, request):
        import json

        from .services.ozon_pay_admin_test import run_ozon_pay_create_order_test

        test_result = None
        test_result_raw = ""
        test_pay_link = ""
        test_error_message = ""

        if request.method == "POST" and request.POST.get("run_ozon_pay_test"):
            test_result = run_ozon_pay_create_order_test()
            if isinstance(test_result, dict):
                pay_url = test_result.get("redirectUrl")
                if isinstance(pay_url, str) and pay_url.strip():
                    test_pay_link = pay_url.strip()
                    messages.success(request, _("Ozon Pay: payLink получен."))
                else:
                    test_error_message = str(test_result.get("message") or "").strip()
                    if not test_error_message:
                        test_error_message = _("Ozon Pay не вернул ссылку на оплату (payLink).")
                    messages.error(request, test_error_message)
                test_result_raw = json.dumps(test_result, ensure_ascii=False, indent=2)
            else:
                test_error_message = _("Некорректный ответ теста Ozon Pay.")
                messages.error(request, test_error_message)

        s = SiteSettings.get_solo()
        context = {
            **self.admin_site.each_context(request),
            "title": _("Проверка Ozon Pay"),
            "opts": self.model._meta,
            "site_settings": s,
            "test_result": test_result,
            "test_result_raw": test_result_raw,
            "test_pay_link": test_pay_link,
            "test_error_message": test_error_message,
        }
        return TemplateResponse(request, "admin/api/sitesettings/ozon_pay_test.html", context)


@admin.register(HomePageContent)
class HomePageContentAdmin(ModelAdmin):
    form = HomePageContentAdminForm
    list_display = ("id",)
    readonly_fields = ("id",)

    fieldsets = (
        hp_fieldset(
            "meta",
            {
                "fields": ("meta_title", "meta_description", "meta_org_name", "meta_org_description"),
                "description": _("Title и description страницы, данные для schema.org LocalBusiness."),
            },
        ),
        hp_fieldset(
            "hero",
            {
                "fields": (
                    "hero_title",
                    "hero_subtitle",
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
                    "hero_background",
                ),
                "description": _(
                    "Кнопки: «По ссылке» — укажите путь (/catalog, /#calculator) или полный https://… "
                    "Пустая ссылка при режиме «По ссылке» сохраняет прежнее поведение (основная — калькулятор или каталог, "
                    "вторая — каталог). «Обратный звонок» открывает всплывающую форму; тексты формы — поля ниже."
                ),
            },
        ),
        hp_fieldset(
            "ps",
            {
                "classes": ("collapse",),
                "description": _(
                    "Для каждой карточки: тип значка — эмодзи, иконка Font Awesome (список или класс вручную) или загрузка картинки."
                ),
                "fields": (
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
            },
        ),
        hp_fieldset(
            "tent",
            {"fields": ("tt_heading", "tt_subheading")},
        ),
        hp_fieldset(
            "feat",
            {"fields": ("feat_heading", "feat_subheading", "feat_catalog_cta")},
        ),
        hp_fieldset(
            "calc",
            {
                "classes": ("collapse",),
                "description": _("Видимость блока на сайте — переключатель «Показывать калькулятор» в «Настройки сайта»."),
                "fields": (
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
                ),
            },
        ),
        hp_fieldset(
            "port",
            {
                "classes": ("collapse",),
                "fields": (
                    "port_heading",
                    "port_subheading",
                    "port_filters",
                    "port_loading",
                    "port_empty",
                    "port_all_cta",
                ),
            },
        ),
        hp_fieldset(
            "why",
            {
                "classes": ("collapse",),
                "fields": (
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
            },
        ),
        hp_fieldset(
            "rev",
            {
                "classes": ("collapse",),
                "fields": ("rev_heading", "rev_subheading", "rev_loading", "rev_video_caption"),
            },
        ),
        hp_fieldset(
            "blog",
            {
                "classes": ("collapse",),
                "fields": (
                    "blog_heading",
                    "blog_subheading",
                    "blog_all_link",
                    "blog_read_more",
                    "blog_loading",
                ),
            },
        ),
        hp_fieldset(
            "map",
            {
                "classes": ("collapse",),
                "fields": (
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
            },
        ),
        hp_fieldset(
            "ui",
            {
                "classes": ("collapse",),
                "fields": (
                    "ui_loading_featured",
                    "ui_buy_marketplaces",
                    "ui_buy_marketplaces_mobile",
                ),
            },
        ),
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def _redirect_first_section(self):
        return redirect("admin:api_homepagecontent_section", slug=HP_SECTION_ORDER[0])

    def changelist_view(self, request, extra_context=None):
        return self._redirect_first_section()

    def change_view(self, request, object_id, form_url="", extra_context=None):
        return self._redirect_first_section()

    def get_urls(self):
        info = self.opts.app_label, self.opts.model_name
        return [
            path(
                "section/<slug>/",
                self.admin_site.admin_view(self.section_view),
                name="%s_%s_section" % info,
            ),
            *super().get_urls(),
        ]

    def section_view(self, request, slug: str):
        if slug not in HP_SECTION_FIELDS:
            raise Http404
        if not self.has_change_permission(request):
            raise PermissionDenied
        obj = HomePageContent.get_solo()
        if request.method == "POST":
            form = HomePageSectionForm(
                request.POST,
                request.FILES,
                instance=obj,
                section_slug=slug,
            )
            if form.is_valid():
                apply_homepage_section_save(obj, form.cleaned_data)
                messages.success(request, _("Изменения сохранены."))
                return redirect("admin:api_homepagecontent_section", slug=slug)
        else:
            form = HomePageSectionForm(instance=obj, section_slug=slug)
        meta = HP_SECTIONS[slug]
        context = {
            **self.admin_site.each_context(request),
            "title": str(meta["title"]),
            "section_title": meta["title"],
            "opts": self.model._meta,
            "form": form,
            "section_slug": slug,
            "section_index_url": reverse(
                "admin:api_homepagecontent_section",
                kwargs={"slug": HP_SECTION_ORDER[0]},
            ),
            "smtp_test_url": None,
            "bitrix24_test_url": None,
            "bitrix24_sync_url": None,
            "section_nav": _homepage_section_nav(slug),
        }
        return TemplateResponse(request, "admin/api/section_form.html", context)


@admin.register(SiteEmailTemplate)
class SiteEmailTemplateAdmin(ModelAdmin):
    """Редактирование тем и текстов писем (строки создаются миграцией, не добавлять вручную)."""

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if db_field.name == "body":
            kwargs.setdefault(
                "widget",
                forms.Textarea(attrs={"rows": 18, "cols": 80, "class": "vLargeTextField font-mono text-sm"}),
            )
        if db_field.name == "subject":
            kwargs.setdefault("widget", forms.TextInput(attrs={"size": 80}))
        return super().formfield_for_dbfield(db_field, request, **kwargs)

    list_display = ("key_display", "subject_preview")
    list_display_links = ("key_display",)
    ordering = ("key",)

    def has_add_permission(self, request) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        return False

    readonly_fields = ("key", "placeholder_reference")
    fieldsets = (
        (
            None,
            {
                "fields": ("key", "placeholder_reference"),
                "description": _(
                    "Плейсхолдеры в фигурных скобках, например {name}, подставляются при отправке. "
                    "Если очистить тему или текст полностью и сохранить, подставятся встроенные значения по умолчанию."
                ),
            },
        ),
        (_("Тема и текст"), {"fields": ("subject", "body")}),
    )

    @display(description=_("Тип письма"))
    def key_display(self, obj: SiteEmailTemplate) -> str:
        return obj.get_key_display()

    @display(description=_("Тема (фрагмент)"))
    def subject_preview(self, obj: SiteEmailTemplate) -> str:
        s = (obj.subject or "").strip()
        if len(s) > 72:
            return s[:69] + "…"
        return s or "—"

    @display(description=_("Подсказка: подстановки"))
    def placeholder_reference(self, obj: SiteEmailTemplate):
        from api.email_template_defaults import PLACEHOLDER_REFERENCE

        rows = PLACEHOLDER_REFERENCE.get(obj.key, [])
        if not rows:
            return format_html(
                '<p class="text-sm text-font-subtle-light dark:text-font-subtle-dark">{}</p>',
                _("Для этого типа список не задан — можно править текст свободно."),
            )
        lis = format_html_join(
            "",
            '<li class="mb-1.5"><code class="rounded bg-base-200 px-1.5 py-0.5 font-mono text-xs dark:bg-base-300">{}</code> — {}</li>',
            (("{" + code + "}", desc) for code, desc in rows),
        )
        return format_html(
            '<ul class="list-disc space-y-0.5 ps-5 text-sm text-font-default-light dark:text-font-default-dark">{}</ul>',
            lis,
        )


@admin.register(CustomerProfile)
class CustomerProfileAdmin(ModelAdmin):
    list_display = ("user", "phone", "updated_at")
    search_fields = ("user__username", "user__email", "phone")
    autocomplete_fields = ("user",)
    fieldsets = ((_("Личный кабинет на сайте"), {"fields": ("user", "phone")}),)


@admin.register(ShippingAddress)
class ShippingAddressAdmin(ModelAdmin):
    list_display = ("user", "label", "city", "street", "is_default", "created_at")
    list_filter = ("is_default",)
    search_fields = ("user__username", "city", "street")
    autocomplete_fields = ("user",)
    fieldsets = (
        (_("Пользователь"), {"fields": ("user", "label", "is_default")}),
        (_("Адрес"), {"fields": ("postal_code", "city", "street", "building", "apartment")}),
        (_("Получатель"), {"fields": ("recipient_name", "recipient_phone")}),
    )


admin.site.unregister(User)
admin.site.unregister(Group)


@admin.register(User)
class UserAdmin(DjangoUserAdmin, ModelAdmin):
    pass


@admin.register(Group)
class GroupAdmin(DjangoGroupAdmin, ModelAdmin):
    pass
