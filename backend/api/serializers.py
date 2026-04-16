from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db import transaction
from rest_framework import serializers

from .validators import (
    COMMENT_MAX_LEN,
    clean_person_name,
    normalize_ru_phone,
    normalize_ru_phone_optional,
    reject_honeypot,
)
from .models import (
    BlogPost,
    CalculatorLead,
    CallbackLead,
    CartOrder,
    CustomerProfile,
    PortfolioProject,
    Product,
    ProductCategory,
    ProductImage,
    ProductSpecification,
    ProductVariant,
    Review,
    ShippingAddress,
    SiteSettings,
)


def product_image_absolute_url(request, img: ProductImage) -> str | None:
    if not img.image:
        return None
    rel = img.image.url
    if request:
        return request.build_absolute_uri(rel)
    return rel


def media_file_absolute(request, filef) -> str:
    """Абсолютный URL загруженного файла (изображения в админке — только файлы)."""
    if not filef:
        return ""
    rel = filef.url
    if request:
        return request.build_absolute_uri(rel)
    return rel


class ProductCategoryPublicSerializer(serializers.ModelSerializer):
    sortOrder = serializers.IntegerField(source="sort_order", read_only=True)
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = ("slug", "title", "sortOrder", "imageUrl")

    def get_imageUrl(self, obj: ProductCategory) -> str | None:
        if not obj.image:
            return None
        request = self.context.get("request")
        rel = obj.image.url
        if request:
            return request.build_absolute_uri(rel)
        return rel


class ProductListSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    priceFrom = serializers.IntegerField(source="price_from")
    showOnHome = serializers.BooleanField(source="show_on_home")
    marketplaceLinks = serializers.JSONField(source="marketplace_links")
    updatedAt = serializers.DateTimeField(source="updated_at", format="%Y-%m-%d")
    category = serializers.CharField(source="category.slug", read_only=True)
    categoryTitle = serializers.CharField(source="category.title", read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "title",
            "excerpt",
            "description",
            "category",
            "categoryTitle",
            "images",
            "priceFrom",
            "marketplaceLinks",
            "updatedAt",
            "showOnHome",
            "teasers",
        )

    def get_id(self, obj: Product) -> str:
        return str(obj.pk)

    def get_images(self, obj: Product) -> list[str]:
        request = self.context.get("request")
        qs = obj.images_rel.all()
        dv = obj.variants.filter(is_default=True).first()
        if dv is None:
            first_v = obj.variants.order_by("sort_order", "id").first()
            dv = first_v
        if dv is not None:
            qs = qs.filter(variant=dv)
        else:
            qs = qs.filter(variant__isnull=True)
        out: list[str] = []
        for im in qs.order_by("sort_order", "id"):
            u = product_image_absolute_url(request, im)
            if u:
                out.append(u)
        return out


class ProductSpecificationSerializer(serializers.ModelSerializer):
    groupName = serializers.CharField(source="group_name", allow_blank=True)

    class Meta:
        model = ProductSpecification
        fields = ("groupName", "name", "value")


class ProductVariantDetailSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    priceFrom = serializers.IntegerField(source="price_from")
    images = serializers.SerializerMethodField()
    wbUrl = serializers.URLField(source="marketplace_wb_url", allow_blank=True)
    isDefault = serializers.BooleanField(source="is_default", read_only=True)

    class Meta:
        model = ProductVariant
        fields = ("id", "label", "priceFrom", "images", "wbUrl", "isDefault")

    def get_id(self, obj: ProductVariant) -> str:
        return str(obj.pk)

    def get_images(self, obj: ProductVariant) -> list[str]:
        request = self.context.get("request")
        out: list[str] = []
        for im in obj.images.all().order_by("sort_order", "id"):
            u = product_image_absolute_url(request, im)
            if u:
                out.append(u)
        return out


class ProductDetailSerializer(ProductListSerializer):
    descriptionHtml = serializers.CharField(
        source="description_html", allow_blank=True, read_only=True
    )
    variants = ProductVariantDetailSerializer(many=True, read_only=True)
    specifications = ProductSpecificationSerializer(many=True, read_only=True)
    defaultVariantId = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + (
            "descriptionHtml",
            "variants",
            "specifications",
            "defaultVariantId",
        )

    def get_defaultVariantId(self, obj: Product) -> str | None:
        d = obj.variants.filter(is_default=True).first()
        if d:
            return str(d.pk)
        f = obj.variants.order_by("sort_order", "id").first()
        return str(f.pk) if f else None


class PortfolioSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    before = serializers.SerializerMethodField()
    after = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = PortfolioProject
        fields = ("id", "slug", "title", "category", "before", "after", "date")

    def get_id(self, obj: PortfolioProject) -> str:
        return str(obj.pk)

    def get_before(self, obj: PortfolioProject) -> str:
        req = self.context.get("request")
        return media_file_absolute(req, obj.before_image_file)

    def get_after(self, obj: PortfolioProject) -> str:
        req = self.context.get("request")
        return media_file_absolute(req, obj.after_image_file)

    def get_date(self, obj: PortfolioProject) -> str:
        if obj.completed_on:
            return obj.completed_on.strftime("%d.%m.%Y")
        return ""


class ReviewSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    reviewedOn = serializers.DateField(source="reviewed_on", format="%Y-%m-%d", allow_null=True)
    photo = serializers.SerializerMethodField()
    video = serializers.URLField(source="video_url", allow_blank=True, allow_null=True)

    class Meta:
        model = Review
        fields = ("id", "name", "city", "reviewedOn", "text", "rating", "photo", "video")

    def get_id(self, obj: Review) -> str:
        return str(obj.pk)

    def get_photo(self, obj: Review) -> str:
        req = self.context.get("request")
        return media_file_absolute(req, obj.photo_file)


class ReviewSubmissionCreateSerializer(serializers.ModelSerializer):
    """Публичная отправка отзыва: дату отзыва задаёт менеджер в админке (reviewed_on)."""

    publicationConsent = serializers.BooleanField(source="publication_consent")
    website = serializers.CharField(required=False, allow_blank=True, write_only=True, default="")

    class Meta:
        model = Review
        fields = ("name", "city", "text", "publicationConsent", "website")

    def validate_name(self, value: str) -> str:
        return clean_person_name(value)

    def validate_city(self, value: str) -> str:
        city = (value or "").strip()
        if len(city) < 2 or len(city) > 120:
            raise serializers.ValidationError("Укажите город")
        return city

    def validate_text(self, value: str) -> str:
        text = (value or "").strip()
        if len(text) < 20:
            raise serializers.ValidationError("Отзыв слишком короткий")
        if len(text) > COMMENT_MAX_LEN:
            raise serializers.ValidationError(f"Слишком длинный отзыв (до {COMMENT_MAX_LEN} символов)")
        return text

    def validate(self, attrs: dict) -> dict:
        reject_honeypot(attrs)
        if not attrs.get("publication_consent"):
            raise serializers.ValidationError(
                {"publicationConsent": ["Нужно согласие на публикацию отзыва"]}
            )
        return attrs

    def create(self, validated_data: dict) -> Review:
        return Review.objects.create(
            **validated_data,
            rating=5,
            is_published=False,
            is_moderated=False,
            submitted_from_site=True,
        )


class BlogPostListSerializer(serializers.ModelSerializer):
    img = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = ("slug", "title", "excerpt", "date", "img")

    def get_img(self, obj: BlogPost) -> str:
        req = self.context.get("request")
        return media_file_absolute(req, obj.cover_image)

    def get_date(self, obj: BlogPost) -> str:
        if obj.published_at:
            return obj.published_at.strftime("%d.%m.%Y")
        return ""


class BlogPostDetailSerializer(BlogPostListSerializer):
    class Meta(BlogPostListSerializer.Meta):
        fields = BlogPostListSerializer.Meta.fields + ("body",)


class CalculatorLeadCreateSerializer(serializers.ModelSerializer):
    lengthM = serializers.DecimalField(
        source="length_m", max_digits=8, decimal_places=2, coerce_to_string=False
    )
    widthM = serializers.DecimalField(
        source="width_m", max_digits=8, decimal_places=2, coerce_to_string=False
    )
    materialId = serializers.CharField(source="material_id")
    materialLabel = serializers.CharField(source="material_label", allow_blank=True)
    estimatedPriceRub = serializers.IntegerField(source="estimated_price_rub")
    website = serializers.CharField(required=False, allow_blank=True, write_only=True, default="")

    class Meta:
        model = CalculatorLead
        fields = (
            "name",
            "phone",
            "comment",
            "lengthM",
            "widthM",
            "materialId",
            "materialLabel",
            "options",
            "estimatedPriceRub",
            "website",
        )

    def validate(self, attrs):
        reject_honeypot(attrs)
        attrs["name"] = clean_person_name(attrs.get("name", ""))
        attrs["phone"] = normalize_ru_phone(attrs.get("phone", ""))
        c = (attrs.get("comment") or "").strip()
        if len(c) > COMMENT_MAX_LEN:
            raise serializers.ValidationError({"comment": ["Слишком длинный комментарий"]})
        attrs["comment"] = c
        return attrs


class CallbackLeadCreateSerializer(serializers.ModelSerializer):
    website = serializers.CharField(required=False, allow_blank=True, write_only=True, default="")
    leadSource = serializers.ChoiceField(
        source="source",
        choices=CallbackLead.Source.choices,
        required=False,
        default=CallbackLead.Source.HERO,
        write_only=True,
    )

    class Meta:
        model = CallbackLead
        fields = ("name", "phone", "comment", "website", "leadSource")

    def validate(self, attrs):
        reject_honeypot(attrs)
        attrs["name"] = clean_person_name(attrs.get("name", ""))
        attrs["phone"] = normalize_ru_phone(attrs.get("phone", ""))
        c = (attrs.get("comment") or "").strip()
        if len(c) > COMMENT_MAX_LEN:
            raise serializers.ValidationError({"comment": ["Слишком длинный комментарий"]})
        attrs["comment"] = c
        return attrs


class CartLineInputSerializer(serializers.Serializer):
    productId = serializers.CharField()
    variantId = serializers.CharField(required=False, allow_blank=True, default="")
    slug = serializers.CharField()
    title = serializers.CharField()
    priceFrom = serializers.IntegerField(min_value=0)
    qty = serializers.IntegerField(min_value=1, max_value=99)
    image = serializers.CharField(required=False, allow_blank=True, default="", max_length=2048)
    ozonSku = serializers.IntegerField(required=False, allow_null=True, min_value=1)

    def validate_image(self, value: str) -> str:
        s = (value or "").strip()
        if not s:
            return ""
        if len(s) > 2048:
            return ""
        if s.startswith("/") or s.startswith("http://") or s.startswith("https://"):
            return s
        return ""


class CartOrderCreateSerializer(serializers.Serializer):
    customer = serializers.DictField()
    lines = CartLineInputSerializer(many=True)
    totalApprox = serializers.IntegerField(min_value=0)
    delivery = serializers.DictField(required=False, default=dict)
    deliveryMethod = serializers.ChoiceField(
        choices=CartOrder.DeliveryMethod.choices,
        default=CartOrder.DeliveryMethod.PICKUP,
    )
    paymentMethod = serializers.ChoiceField(
        choices=CartOrder.PaymentMethod.choices,
        default=CartOrder.PaymentMethod.CASH_PICKUP,
    )

    def validate(self, attrs):
        from .models import SiteSettings
        from .services.checkout_rules import delivery_options_public, validate_delivery_and_payment

        s = SiteSettings.get_solo()
        if not delivery_options_public(s):
            raise serializers.ValidationError(
                "Оформление заказа недоступно: в настройках сайта не включён ни один способ доставки."
            )
        validate_delivery_and_payment(
            attrs.get("deliveryMethod", CartOrder.DeliveryMethod.PICKUP),
            attrs.get("paymentMethod", CartOrder.PaymentMethod.CASH_PICKUP),
            s,
        )
        dm = attrs.get("deliveryMethod", CartOrder.DeliveryMethod.PICKUP)
        delivery = attrs.get("delivery") or {}
        if dm == CartOrder.DeliveryMethod.CDEK and isinstance(delivery, dict):
            cdek = delivery.get("cdek") or {}
            mode = ""
            pvz_code = ""
            if isinstance(cdek, dict):
                mode = str(cdek.get("mode") or "").strip().lower()
                pvz_code = str(cdek.get("pvzCode") or "").strip()
            if mode != "door":
                if pvz_code:
                    pass
                elif s.cdek_manual_pvz_enabled:
                    raise serializers.ValidationError(
                        "Для доставки в ПВЗ выберите пункт на карте СДЭК или введите код ПВЗ вручную."
                    )
                else:
                    raise serializers.ValidationError(
                        "Для доставки в ПВЗ выберите пункт на карте СДЭК (ручной ввод ПВЗ отключён в настройках сайта)."
                    )
        return attrs

    def validate_customer(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Некорректные данные")
        if (value.get("website") or "").strip():
            raise serializers.ValidationError("Проверка не пройдена")
        name = clean_person_name(value.get("name") or "")
        phone = normalize_ru_phone(value.get("phone") or "")
        email = (value.get("email") or "").strip()
        if email:
            try:
                validate_email(email)
            except DjangoValidationError:
                raise serializers.ValidationError("Некорректный email")
        comment = (value.get("comment") or "").strip()
        if len(comment) > COMMENT_MAX_LEN:
            raise serializers.ValidationError("Слишком длинный комментарий")
        return {
            "name": name,
            "phone": phone,
            "email": email,
            "comment": comment[:COMMENT_MAX_LEN],
        }

    def create(self, validated_data):
        from .models import SiteSettings
        from .services.delivery_snapshot import sanitize_checkout_delivery
        from .services.letters import build_cart_letters
        from .services.order_ref import generate_order_ref
        from .services.ozon_acquiring import try_begin_ozon_pay

        request = self.context.get("request")
        user = None
        if request and request.user.is_authenticated:
            user = request.user

        ref = generate_order_ref()
        while CartOrder.objects.filter(order_ref=ref).exists():
            ref = generate_order_ref()
        customer = validated_data["customer"]
        lines_plain = [dict(x) for x in validated_data["lines"]]
        total = validated_data["totalApprox"]
        dm = validated_data.get("deliveryMethod", CartOrder.DeliveryMethod.PICKUP)
        pm = validated_data.get("paymentMethod", CartOrder.PaymentMethod.CASH_PICKUP)
        delivery_snapshot = sanitize_checkout_delivery(validated_data.get("delivery") or {})

        settings = SiteSettings.get_solo()
        acquiring: dict = {}
        if pm == CartOrder.PaymentMethod.CARD_ONLINE:
            acquiring = try_begin_ozon_pay(
                order_ref=ref,
                total_approx=total,
                settings=settings,
                delivery_method=dm,
                cart_lines=lines_plain,
                receipt_email=(customer.get("email") or "").strip(),
                fiscalization_phone=(customer.get("phone") or "").strip(),
            )
            pay_url = acquiring.get("redirectUrl") if isinstance(acquiring, dict) else None
            if not (isinstance(pay_url, str) and pay_url.strip()):
                msg = ""
                if isinstance(acquiring, dict):
                    msg = str(acquiring.get("message") or acquiring.get("httpError") or "").strip()
                raise serializers.ValidationError(
                    msg or "Не удалось инициализировать онлайн-оплату Ozon Pay. Проверьте настройки эквайринга."
                )

        if pm == CartOrder.PaymentMethod.CARD_ONLINE:
            pay_status = CartOrder.PaymentStatus.PENDING
        else:
            pay_status = CartOrder.PaymentStatus.NOT_REQUIRED

        dm_label = CartOrder.DeliveryMethod(dm).label
        pm_label = CartOrder.PaymentMethod(pm).label
        manager_letter, client_ack = build_cart_letters(
            ref,
            customer,
            lines_plain,
            total,
            delivery=delivery_snapshot,
            delivery_method_label=str(dm_label),
            payment_method_label=str(pm_label),
        )
        if pm == CartOrder.PaymentMethod.CARD_ONLINE:
            pay_url = acquiring.get("redirectUrl") if isinstance(acquiring, dict) else None
            extra = (acquiring or {}).get("message") if isinstance(acquiring, dict) else None
            if pay_url:
                client_ack = f"{client_ack}\n\nОплатить заказ онлайн: {pay_url}\n"
            elif extra:
                client_ack = f"{client_ack}\n\n{extra}\n"

        return CartOrder.objects.create(
            order_ref=ref,
            user=user,
            customer_name=customer.get("name", "").strip(),
            customer_phone=customer.get("phone", "").strip(),
            customer_email=(customer.get("email") or "").strip(),
            customer_comment=(customer.get("comment") or "").strip(),
            lines=lines_plain,
            total_approx=total,
            manager_letter=manager_letter,
            client_ack=client_ack,
            delivery_method=dm,
            payment_method=pm,
            payment_status=pay_status,
            payment_provider="ozon_pay" if pm == CartOrder.PaymentMethod.CARD_ONLINE else "",
            delivery_provider=str(dm),
            delivery_snapshot=delivery_snapshot,
            acquiring_payload=acquiring if isinstance(acquiring, dict) else {},
        )


class CartOrderResponseSerializer(serializers.ModelSerializer):
    orderRef = serializers.CharField(source="order_ref")
    clientAck = serializers.CharField(source="client_ack")
    fulfillmentStatus = serializers.CharField(source="fulfillment_status", read_only=True)
    paymentRedirectUrl = serializers.SerializerMethodField()

    class Meta:
        model = CartOrder
        fields = ("orderRef", "clientAck", "fulfillmentStatus", "paymentRedirectUrl")

    def get_paymentRedirectUrl(self, obj: CartOrder) -> str | None:
        raw = obj.acquiring_payload
        if not isinstance(raw, dict):
            return None
        url = raw.get("redirectUrl")
        return url if isinstance(url, str) and url.strip() else None


class SiteSettingsPublicSerializer(serializers.ModelSerializer):
    enabledMarketplaces = serializers.SerializerMethodField()
    globalMarketplaceUrls = serializers.SerializerMethodField()
    siteName = serializers.CharField(source="site_name", read_only=True)
    siteTagline = serializers.CharField(source="site_tagline", read_only=True)
    footerNote = serializers.CharField(source="footer_note", read_only=True)
    logoUrl = serializers.SerializerMethodField()
    faviconUrl = serializers.SerializerMethodField()
    phone = serializers.CharField(source="phone_display", read_only=True)
    phoneHref = serializers.CharField(source="phone_href", read_only=True)
    footerVkUrl = serializers.CharField(source="footer_vk_url", read_only=True)
    footerTelegramUrl = serializers.CharField(source="footer_telegram_url", read_only=True)
    showSocialLinks = serializers.BooleanField(source="show_social_links", read_only=True)
    contactsPageTitle = serializers.CharField(source="contacts_page_title", read_only=True)
    contactsIntro = serializers.CharField(source="contacts_intro", read_only=True)
    contactsHours = serializers.CharField(source="contacts_hours", read_only=True)
    contactsMetaDescription = serializers.CharField(source="contacts_meta_description", read_only=True)
    contactsBackLinkLabel = serializers.CharField(source="contacts_back_link_label", read_only=True)
    calculatorEnabled = serializers.BooleanField(source="show_calculator", read_only=True)
    productPhotoAspect = serializers.CharField(source="product_photo_aspect", read_only=True)
    catalogIntro = serializers.CharField(source="catalog_intro", read_only=True)
    checkout = serializers.SerializerMethodField()
    mapForm = serializers.SerializerMethodField()

    class Meta:
        model = SiteSettings
        fields = (
            "enabledMarketplaces",
            "globalMarketplaceUrls",
            "siteName",
            "siteTagline",
            "footerNote",
            "logoUrl",
            "faviconUrl",
            "phone",
            "phoneHref",
            "email",
            "address",
            "legal",
            "footerVkUrl",
            "footerTelegramUrl",
            "showSocialLinks",
            "contactsPageTitle",
            "contactsIntro",
            "contactsHours",
            "contactsMetaDescription",
            "contactsBackLinkLabel",
            "calculatorEnabled",
            "productPhotoAspect",
            "catalogIntro",
            "checkout",
            "mapForm",
        )

    def _absolute_media(self, request, f) -> str | None:
        if not f:
            return None
        rel = f.url
        if request:
            return request.build_absolute_uri(rel)
        return rel

    def get_logoUrl(self, obj: SiteSettings) -> str | None:
        return self._absolute_media(self.context.get("request"), obj.logo)

    def get_faviconUrl(self, obj: SiteSettings) -> str | None:
        return self._absolute_media(self.context.get("request"), obj.favicon)

    def get_enabledMarketplaces(self, obj: SiteSettings) -> list[str]:
        out: list[str] = []
        if obj.show_marketplace_wb:
            out.append("wb")
        if obj.show_marketplace_ozon:
            out.append("ozon")
        if obj.show_marketplace_ym:
            out.append("ym")
        if obj.show_marketplace_avito:
            out.append("avito")
        return out

    def get_globalMarketplaceUrls(self, obj: SiteSettings) -> dict[str, str]:
        m: dict[str, str] = {}
        if obj.global_url_wb:
            m["wb"] = obj.global_url_wb
        if obj.global_url_ozon:
            m["ozon"] = obj.global_url_ozon
        if obj.global_url_ym:
            m["ym"] = obj.global_url_ym
        if obj.global_url_avito:
            m["avito"] = obj.global_url_avito
        return m

    def get_mapForm(self, obj: SiteSettings) -> dict[str, str] | None:
        """Перекрытия для блока карты на главной; пустые поля не включаются (берутся из home-content)."""

        def add(key: str, raw: str | None) -> None:
            if isinstance(raw, str) and raw.strip():
                out[key] = raw.strip()

        out: dict[str, str] = {}
        add("heading", obj.map_heading)
        add("subheading", obj.map_subheading)
        add("mapIframeSrc", obj.map_iframe_src)
        add("mapTitle", obj.map_title)
        add("formNameLabel", obj.map_form_name_label)
        add("formPhoneLabel", obj.map_form_phone_label)
        add("formCommentLabel", obj.map_form_comment_label)
        add("namePlaceholder", obj.map_name_placeholder)
        add("phonePlaceholder", obj.map_phone_placeholder)
        add("commentPlaceholder", obj.map_comment_placeholder)
        add("submitButton", obj.map_submit_button)
        add("submitting", obj.map_submitting)
        add("successMessage", obj.map_success_message)
        return out or None

    def get_checkout(self, obj: SiteSettings) -> dict:
        import os

        from django.urls import reverse

        from .services.cdek_runtime import cdek_api_base_url
        from .services.checkout_rules import allowed_payment_methods, delivery_options_public

        def widget_sender_city() -> str:
            s = (obj.cdek_widget_sender_city or "").strip()
            if s:
                return s
            addr = (obj.pickup_point_address or "").strip()
            if addr:
                part = addr.split(",")[0].strip()
                if part:
                    return part
            return "Москва"

        weight = int(os.environ.get("CDEK_WIDGET_DEFAULT_WEIGHT_G", "3000"))
        default_goods = [{"width": 20, "height": 20, "length": 30, "weight": weight}]
        widget_script = (obj.cdek_widget_script_url or "").strip() or "https://cdn.jsdelivr.net/npm/@cdek-it/widget@3"
        req = self.context.get("request")
        widget_service_url = ""
        if req is not None:
            widget_service_url = req.build_absolute_uri(reverse("cdek-widget-service"))

        deliveries = delivery_options_public(obj)
        matrix = {d["id"]: allowed_payment_methods(d["id"], obj) for d in deliveries}
        payment_labels = {c.value: str(c.label) for c in CartOrder.PaymentMethod}
        return {
            "deliveryOptions": deliveries,
            "paymentMatrix": matrix,
            "paymentLabels": payment_labels,
            "pickup": {
                "title": obj.pickup_point_title,
                "address": obj.pickup_point_address,
                "hours": obj.pickup_point_hours,
                "note": obj.pickup_point_note,
                "lat": float(obj.pickup_point_lat) if obj.pickup_point_lat is not None else None,
                "lng": float(obj.pickup_point_lng) if obj.pickup_point_lng is not None else None,
            },
            "cdek": {
                "enabled": obj.cdek_enabled,
                "testMode": obj.cdek_test_mode,
                "apiBaseUrl": cdek_api_base_url(obj),
                "widgetScriptUrl": widget_script,
                "yandexMapApiKey": (obj.cdek_yandex_map_api_key or "").strip(),
                "widgetServiceUrl": widget_service_url,
                "widgetSenderCity": widget_sender_city(),
                "manualPvzEnabled": obj.cdek_manual_pvz_enabled,
                "widgetGoods": default_goods,
            },
            "ozonLogistics": {
                "enabled": obj.ozon_logistics_enabled,
                "buyerNote": obj.ozon_logistics_buyer_note,
            },
            "ozonPay": {
                "enabled": obj.ozon_pay_enabled,
                "sandbox": obj.ozon_pay_sandbox,
            },
        }


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, max_length=128)
    firstName = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    lastName = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True, default="")
    website = serializers.CharField(required=False, allow_blank=True, write_only=True, default="")

    def validate(self, attrs):
        reject_honeypot(attrs)
        raw_phone = attrs.get("phone") or ""
        attrs["phone"] = normalize_ru_phone_optional(raw_phone)
        return attrs

    def validate_email(self, value: str) -> str:
        e = value.strip().lower()
        if User.objects.filter(username__iexact=e).exists():
            raise serializers.ValidationError("Пользователь с таким email уже зарегистрирован.")
        return e

    def create(self, validated_data):
        email = validated_data["email"]
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=(validated_data.get("firstName") or "").strip(),
            last_name=(validated_data.get("lastName") or "").strip(),
            is_staff=False,
        )
        CustomerProfile.objects.create(
            user=user,
            phone=(validated_data.get("phone") or "").strip(),
        )
        return user


class CustomerOrderListSerializer(serializers.ModelSerializer):
    orderRef = serializers.CharField(source="order_ref")
    createdAt = serializers.DateTimeField(source="created_at", format="%Y-%m-%dT%H:%M:%S%z")
    totalApprox = serializers.IntegerField(source="total_approx")
    fulfillmentStatusLabel = serializers.SerializerMethodField()
    paymentStatusLabel = serializers.SerializerMethodField()

    class Meta:
        model = CartOrder
        fields = (
            "orderRef",
            "createdAt",
            "fulfillment_status",
            "fulfillmentStatusLabel",
            "payment_status",
            "paymentStatusLabel",
            "totalApprox",
            "lines",
        )

    def get_fulfillmentStatusLabel(self, obj: CartOrder) -> str:
        return obj.get_fulfillment_status_display()

    def get_paymentStatusLabel(self, obj: CartOrder) -> str:
        return obj.get_payment_status_display()


class CustomerOrderDetailSerializer(CustomerOrderListSerializer):
    clientAck = serializers.CharField(source="client_ack")
    deliverySnapshot = serializers.JSONField(source="delivery_snapshot")

    class Meta(CustomerOrderListSerializer.Meta):
        fields = CustomerOrderListSerializer.Meta.fields + (
            "customer_name",
            "customer_phone",
            "customer_email",
            "customer_comment",
            "clientAck",
            "deliverySnapshot",
        )


class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = (
            "id",
            "label",
            "city",
            "street",
            "building",
            "apartment",
            "postal_code",
            "recipient_name",
            "recipient_phone",
            "is_default",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        user = self.context["request"].user
        if validated_data.get("is_default"):
            ShippingAddress.objects.filter(user=user, is_default=True).update(is_default=False)
        return ShippingAddress.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        if validated_data.get("is_default"):
            ShippingAddress.objects.filter(user=instance.user, is_default=True).exclude(
                pk=instance.pk
            ).update(is_default=False)
        return super().update(instance, validated_data)

    def validate_recipient_phone(self, value: str) -> str:
        return normalize_ru_phone_optional(value or "")


class ProfileUpdateSerializer(serializers.Serializer):
    firstName = serializers.CharField(max_length=150, required=False, allow_blank=True)
    lastName = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True)

    def validate_phone(self, value: str) -> str:
        return normalize_ru_phone_optional(value or "")


class ChangePasswordSerializer(serializers.Serializer):
    oldPassword = serializers.CharField(write_only=True)
    newPassword = serializers.CharField(write_only=True, min_length=8, max_length=128)

    def validate_newPassword(self, value: str) -> str:
        from django.contrib.auth.password_validation import validate_password

        user = self.context["request"].user
        validate_password(value, user)
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["oldPassword"]):
            raise serializers.ValidationError({"oldPassword": ["Неверный текущий пароль."]})
        return attrs

    def save(self):
        from django.contrib.auth.models import User

        user: User = self.context["request"].user
        user.set_password(self.validated_data["newPassword"])
        user.save()
        prof, _ = CustomerProfile.objects.get_or_create(user=user)
        if prof.password_change_deadline is not None:
            prof.password_change_deadline = None
            prof.save(update_fields=["password_change_deadline"])
        return user
