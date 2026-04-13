from datetime import timedelta

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.utils import timezone
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
    photo = serializers.SerializerMethodField()
    video = serializers.URLField(source="video_url", allow_blank=True, allow_null=True)

    class Meta:
        model = Review
        fields = ("id", "name", "text", "rating", "photo", "video")

    def get_id(self, obj: Review) -> str:
        return str(obj.pk)

    def get_photo(self, obj: Review) -> str:
        req = self.context.get("request")
        return media_file_absolute(req, obj.photo_file)


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


class CartOrderCreateSerializer(serializers.Serializer):
    customer = serializers.DictField()
    lines = CartLineInputSerializer(many=True)
    totalApprox = serializers.IntegerField(min_value=0)
    delivery = serializers.DictField(required=False, default=dict)

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
        from .services.letters import build_cart_letters
        from .services.order_ref import generate_order_ref

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
        delivery = validated_data.get("delivery") or {}
        if isinstance(delivery, dict):
            delivery_plain = {
                k: (str(v).strip() if v is not None else "")
                for k, v in delivery.items()
                if k in ("city", "address", "comment")
            }
        else:
            delivery_plain = {}

        manager_letter, client_ack = build_cart_letters(
            ref, customer, lines_plain, total, delivery=delivery_plain
        )
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
            delivery_snapshot=delivery_plain,
        )


class CartOrderResponseSerializer(serializers.ModelSerializer):
    orderRef = serializers.CharField(source="order_ref")
    clientAck = serializers.CharField(source="client_ack")
    fulfillmentStatus = serializers.CharField(source="fulfillment_status", read_only=True)

    class Meta:
        model = CartOrder
        fields = ("orderRef", "clientAck", "fulfillmentStatus")


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

    class Meta:
        model = CartOrder
        fields = (
            "orderRef",
            "createdAt",
            "fulfillment_status",
            "payment_status",
            "totalApprox",
            "lines",
        )


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
