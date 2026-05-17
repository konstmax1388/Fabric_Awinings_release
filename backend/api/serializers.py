from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import Avg, Count, QuerySet
import os
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .validators import (
    COMMENT_MAX_LEN,
    clean_customer_order_email,
    clean_person_name,
    normalize_ru_phone,
    normalize_ru_phone_optional,
    reject_honeypot,
)
from .html_sanitize import sanitize_about_payload, sanitize_html_fragment
from .services.customer_order_public_tracking import (
    OZON_MY_ORDERS_PUBLIC_URL,
    cdek_public_tracking_url,
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
    Promotion,
    Review,
    ShippingAddress,
    SiteSettings,
    StaticPage,
)


def product_image_absolute_url(request, img: ProductImage) -> str | None:
    if not img.image:
        return None
    rel = img.image.url
    if request:
        return request.build_absolute_uri(rel)
    return rel


def product_storefront_images_queryset(product: Product) -> QuerySet[ProductImage]:
    """Все фото из инлайна «Фотографии товара» (любой вариант / без варианта), порядок как в админке."""
    return product.images_rel.all().order_by("sort_order", "id")


def media_file_absolute(request, filef) -> str:
    """Абсолютный URL загруженного файла (изображения в админке — только файлы)."""
    if not filef:
        return ""
    rel = filef.url
    if request:
        return request.build_absolute_uri(rel)
    return rel


def merge_static_page_about_file_urls(
    payload: dict[str, object], obj: StaticPage, request
) -> dict[str, object]:
    """
    URL из about_intro_* / about_manufacturer_* (файлы на модели) в aboutPayload.
    Вызывается только при включённом макете v1 (version==1 в about_payload в БД),
    синхронно с логикой save в админке.
    """
    if (getattr(obj, "slug", None) or "").strip() != "o-nas":
        return payload
    if not isinstance(payload, dict):
        return payload
    out: dict[str, object] = dict(payload)
    intro_raw = out.get("intro")
    intro: dict[str, object] = {**intro_raw} if isinstance(intro_raw, dict) else {}
    iimg = getattr(obj, "about_intro_image", None)
    ivid = getattr(obj, "about_intro_video", None)
    if iimg and getattr(iimg, "name", ""):
        intro["imageUrl"] = media_file_absolute(request, iimg)
    if ivid and getattr(ivid, "name", ""):
        intro["videoUrl"] = media_file_absolute(request, ivid)
    if intro:
        out["intro"] = intro
    m_raw = out.get("manufacturer")
    m: dict[str, object] = {**m_raw} if isinstance(m_raw, dict) else {}
    mimg = getattr(obj, "about_manufacturer_image", None)
    mvid = getattr(obj, "about_manufacturer_video", None)
    if mimg and getattr(mimg, "name", ""):
        m["imageUrl"] = media_file_absolute(request, mimg)
    if mvid and getattr(mvid, "name", ""):
        m["videoUrl"] = media_file_absolute(request, mvid)
    if m:
        out["manufacturer"] = m
    return out


class ProductCategoryPublicSerializer(serializers.ModelSerializer):
    sortOrder = serializers.IntegerField(source="sort_order", read_only=True)
    imageUrl = serializers.SerializerMethodField()
    listIconUrl = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = ("slug", "title", "sortOrder", "imageUrl", "listIconUrl")

    def get_imageUrl(self, obj: ProductCategory) -> str | None:
        if not obj.image:
            return None
        request = self.context.get("request")
        rel = obj.image.url
        if request:
            return request.build_absolute_uri(rel)
        return rel

    def get_listIconUrl(self, obj: ProductCategory) -> str | None:
        f = getattr(obj, "list_icon", None)
        if not f or not getattr(f, "name", ""):
            return None
        request = self.context.get("request")
        rel = f.url
        if request:
            return request.build_absolute_uri(rel)
        return rel


class ProductListSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    priceFrom = serializers.SerializerMethodField()
    priceList = serializers.SerializerMethodField()
    showOnHome = serializers.BooleanField(source="show_on_home")
    marketplaceLinks = serializers.JSONField(source="marketplace_links")
    updatedAt = serializers.DateTimeField(source="updated_at", format="%Y-%m-%d")
    category = serializers.CharField(source="category.slug", read_only=True)
    categoryTitle = serializers.CharField(source="category.title", read_only=True)
    cdekWeightGrams = serializers.IntegerField(source="cdek_weight_grams", allow_null=True, read_only=True)
    cdekLengthCm = serializers.IntegerField(source="cdek_length_cm", allow_null=True, read_only=True)
    cdekWidthCm = serializers.IntegerField(source="cdek_width_cm", allow_null=True, read_only=True)
    cdekHeightCm = serializers.IntegerField(source="cdek_height_cm", allow_null=True, read_only=True)
    warrantyMonths = serializers.SerializerMethodField()
    returnDays = serializers.SerializerMethodField()
    ozonSku = serializers.IntegerField(source="ozon_sku", allow_null=True, read_only=True)
    promoEndsAt = serializers.SerializerMethodField()
    promotions = serializers.SerializerMethodField()
    bestPromotionDiscountPercent = serializers.SerializerMethodField()
    model3dUrl = serializers.SerializerMethodField()

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
            "priceList",
            "promoEndsAt",
            "bestPromotionDiscountPercent",
            "promotions",
            "marketplaceLinks",
            "updatedAt",
            "showOnHome",
            "teasers",
            "cdekWeightGrams",
            "cdekLengthCm",
            "cdekWidthCm",
            "cdekHeightCm",
            "warrantyMonths",
            "returnDays",
            "ozonSku",
            "model3dUrl",
        )

    def get_id(self, obj: Product) -> str:
        return str(obj.pk)

    def get_priceFrom(self, obj: Product) -> int:
        from api.services.cart_line_unit_prices import effective_unit_price_rub

        return effective_unit_price_rub(product=obj, variant=None)

    def get_priceList(self, obj: Product) -> int:
        from api.services.cart_line_unit_prices import list_unit_price_rub

        return list_unit_price_rub(product=obj, variant=None)

    def get_promoEndsAt(self, obj: Product) -> str | None:
        from api.services.promotions import promo_countdown_end_for_product

        end = promo_countdown_end_for_product(obj)
        if end is None:
            return None
        return end.isoformat()

    def get_promotions(self, obj: Product) -> list[dict[str, object]]:
        from api.services.promotions import active_promotion_summaries_for_product

        return active_promotion_summaries_for_product(obj)

    def get_bestPromotionDiscountPercent(self, obj: Product) -> int:
        from api.services.promotions import best_discount_percent_for_product

        return int(best_discount_percent_for_product(obj))

    def get_model3dUrl(self, obj: Product) -> str:
        f = getattr(obj, "model_3d", None)
        if not f or not getattr(f, "name", ""):
            return ""
        request = self.context.get("request")
        return media_file_absolute(request, f)

    def get_images(self, obj: Product) -> list[str]:
        request = self.context.get("request")
        out: list[str] = []
        for im in product_storefront_images_queryset(obj):
            u = product_image_absolute_url(request, im)
            if u:
                out.append(u)
        return out

    def get_warrantyMonths(self, obj: Product) -> int:
        if obj.warranty_months is not None:
            return int(obj.warranty_months)
        ss = self.context.get("site_settings")
        if ss is None:
            ss = SiteSettings.get_solo()
        return int(ss.catalog_warranty_months)

    def get_returnDays(self, obj: Product) -> int:
        if obj.return_days is not None:
            return int(obj.return_days)
        ss = self.context.get("site_settings")
        if ss is None:
            ss = SiteSettings.get_solo()
        return int(ss.catalog_return_days)


class ProductSpecificationSerializer(serializers.ModelSerializer):
    groupName = serializers.CharField(source="group_name", allow_blank=True)

    class Meta:
        model = ProductSpecification
        fields = ("groupName", "name", "value")


class ProductVariantDetailSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    priceFrom = serializers.SerializerMethodField()
    priceList = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    wbUrl = serializers.URLField(source="marketplace_wb_url", allow_blank=True)
    isDefault = serializers.BooleanField(source="is_default", read_only=True)
    ozonSku = serializers.IntegerField(source="ozon_sku", allow_null=True, read_only=True)

    class Meta:
        model = ProductVariant
        fields = ("id", "label", "priceFrom", "priceList", "images", "wbUrl", "isDefault", "ozonSku")

    def get_id(self, obj: ProductVariant) -> str:
        return str(obj.pk)

    def get_priceFrom(self, obj: ProductVariant) -> int:
        from api.services.cart_line_unit_prices import effective_unit_price_rub

        return effective_unit_price_rub(product=obj.product, variant=obj)

    def get_priceList(self, obj: ProductVariant) -> int:
        return int(obj.price_from)

    def get_images(self, obj: ProductVariant) -> list[str]:
        request = self.context.get("request")
        out: list[str] = []
        for im in obj.images.all().order_by("sort_order", "id"):
            u = product_image_absolute_url(request, im)
            if u:
                out.append(u)
        return out


class ProductDetailSerializer(ProductListSerializer):
    descriptionHtml = serializers.SerializerMethodField()
    variants = ProductVariantDetailSerializer(many=True, read_only=True)
    specifications = ProductSpecificationSerializer(many=True, read_only=True)
    defaultVariantId = serializers.SerializerMethodField()
    materialMap = serializers.SerializerMethodField()
    seo = serializers.SerializerMethodField()
    aggregateRating = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + (
            "descriptionHtml",
            "variants",
            "specifications",
            "defaultVariantId",
            "materialMap",
            "seo",
            "aggregateRating",
        )

    def get_descriptionHtml(self, obj: Product) -> str:
        return sanitize_html_fragment(obj.description_html or "")

    def get_seo(self, obj: Product) -> dict[str, str]:
        from api.seo_public import product_public_seo_dict

        ss = self.context.get("site_settings")
        if ss is None:
            ss = SiteSettings.get_solo()
        request = self.context.get("request")
        return product_public_seo_dict(obj, request, ss)

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_aggregateRating(self, obj: Product) -> dict[str, object] | None:
        agg = Review.objects.filter(is_published=True).aggregate(c=Count("id"), avg=Avg("rating"))
        c = int(agg["c"] or 0)
        if c < 3:
            return None
        avg = float(agg["avg"] or 5)
        return {"ratingValue": round(avg, 1), "reviewCount": c}

    def get_defaultVariantId(self, obj: Product) -> str | None:
        d = obj.variants.filter(is_default=True).first()
        if d:
            return str(d.pk)
        f = obj.variants.order_by("sort_order", "id").first()
        return str(f.pk) if f else None

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_materialMap(self, obj: Product) -> dict[str, object] | None:
        raw = obj.material_map if isinstance(obj.material_map, dict) else {}
        enabled = bool(raw.get("enabled"))
        if not enabled:
            return None
        req = self.context.get("request")
        title = str(raw.get("title") or "").strip() or "Карта материалов"
        subtitle = str(raw.get("subtitle") or "").strip()
        layers_raw = raw.get("layers") if isinstance(raw.get("layers"), list) else []
        layers: list[dict[str, object]] = []
        for i, row in enumerate(layers_raw):
            if not isinstance(row, dict):
                continue
            label = str(row.get("title") or "").strip()
            if not label:
                continue
            try:
                x = int(row.get("x"))
                y = int(row.get("y"))
            except (TypeError, ValueError):
                continue
            x = max(0, min(100, x))
            y = max(0, min(100, y))
            rid = str(row.get("id") or f"layer_{i+1}")
            layers.append({"id": rid, "title": label, "x": x, "y": y})
        if not layers:
            return None
        image_url = media_file_absolute(req, obj.material_map_image)
        return {"title": title, "subtitle": subtitle, "layers": layers, "imageUrl": image_url}


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
    productPhoto = serializers.SerializerMethodField()
    video = serializers.URLField(source="video_url", allow_blank=True, allow_null=True)

    class Meta:
        model = Review
        fields = ("id", "name", "city", "reviewedOn", "text", "rating", "photo", "productPhoto", "video")

    def get_id(self, obj: Review) -> str:
        return str(obj.pk)

    def get_photo(self, obj: Review) -> str:
        req = self.context.get("request")
        return media_file_absolute(req, obj.photo_file)

    def get_productPhoto(self, obj: Review) -> str:
        req = self.context.get("request")
        return media_file_absolute(req, obj.product_photo_file)


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
    excerpt = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = ("slug", "title", "excerpt", "date", "img")

    def get_excerpt(self, obj: BlogPost) -> str:
        return sanitize_html_fragment(obj.excerpt or "")

    def get_img(self, obj: BlogPost) -> str:
        req = self.context.get("request")
        return media_file_absolute(req, obj.cover_image)

    def get_date(self, obj: BlogPost) -> str:
        if obj.published_at:
            return obj.published_at.strftime("%d.%m.%Y")
        return ""


class BlogPostDetailSerializer(BlogPostListSerializer):
    body = serializers.SerializerMethodField()
    seo = serializers.SerializerMethodField()

    class Meta(BlogPostListSerializer.Meta):
        fields = BlogPostListSerializer.Meta.fields + ("body", "seo")

    def get_body(self, obj: BlogPost) -> str:
        return sanitize_html_fragment(obj.body or "")

    def get_seo(self, obj: BlogPost) -> dict[str, str]:
        from api.models import SiteSettings
        from api.seo_public import blog_post_public_seo_dict

        ss = self.context.get("site_settings")
        if ss is None:
            ss = SiteSettings.get_solo()
        request = self.context.get("request")
        return blog_post_public_seo_dict(obj, request, ss)


class PromotionListSerializer(serializers.ModelSerializer):
    """Публичный список акций (только активные отдаёт view)."""

    imageUrl = serializers.SerializerMethodField()
    startsAt = serializers.DateTimeField(source="starts_at")
    endsAt = serializers.DateTimeField(source="ends_at", allow_null=True)
    discountPercent = serializers.IntegerField(source="discount_percent", read_only=True)
    appliesToAllProducts = serializers.BooleanField(source="applies_to_all_products", read_only=True)
    stackWithOthers = serializers.BooleanField(source="stack_with_others", read_only=True)

    class Meta:
        model = Promotion
        fields = (
            "slug",
            "title",
            "excerpt",
            "imageUrl",
            "startsAt",
            "endsAt",
            "discountPercent",
            "appliesToAllProducts",
            "stackWithOthers",
        )

    def get_imageUrl(self, obj: Promotion) -> str:
        return media_file_absolute(self.context.get("request"), getattr(obj, "image", None))


class PromotionDetailSerializer(PromotionListSerializer):
    body = serializers.SerializerMethodField()
    products = serializers.SerializerMethodField()

    class Meta(PromotionListSerializer.Meta):
        fields = PromotionListSerializer.Meta.fields + ("body", "products")

    def get_body(self, obj: Promotion) -> str:
        return sanitize_html_fragment(obj.body or "")

    def get_products(self, obj: Promotion) -> list[dict[str, object]]:
        if obj.applies_to_all_products:
            return []
        from api.services.cart_line_unit_prices import effective_unit_price_rub, list_unit_price_rub

        request = self.context.get("request")
        out: list[dict[str, object]] = []
        for p in obj.products.filter(is_published=True, category__is_published=True).order_by("sort_order", "id")[:80]:
            eff = effective_unit_price_rub(product=p, variant=None)
            lst = list_unit_price_rub(product=p, variant=None)
            img = ""
            for im in product_storefront_images_queryset(p)[:1]:
                u = product_image_absolute_url(request, im)
                if u:
                    img = u
            excerpt = (p.excerpt or "").strip()
            if len(excerpt) > 400:
                excerpt = excerpt[:399] + "…"
            out.append(
                {
                    "slug": p.slug,
                    "title": p.title,
                    "excerpt": excerpt,
                    "priceFrom": eff,
                    "priceList": lst,
                    "imageUrl": img,
                }
            )
        return out


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
    cdekWeightGrams = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    cdekLengthCm = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    cdekWidthCm = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    cdekHeightCm = serializers.IntegerField(required=False, allow_null=True, min_value=1)

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
        from .services.checkout_pricing import (
            build_trusted_checkout_lines,
            goods_subtotal_from_lines,
            quoted_cdek_delivery_rub,
        )
        from .services.checkout_rules import (
            delivery_options_public,
            raise_if_checkout_orders_blocked,
            validate_delivery_and_payment,
        )

        s = SiteSettings.get_solo()
        raise_if_checkout_orders_blocked(s)
        if not delivery_options_public(s):
            raise serializers.ValidationError(
                "Оформление заказа недоступно: в настройках сайта не включён ни один способ доставки."
            )
        validate_delivery_and_payment(
            attrs.get("deliveryMethod", CartOrder.DeliveryMethod.PICKUP),
            attrs.get("paymentMethod", CartOrder.PaymentMethod.CASH_PICKUP),
            s,
        )
        lines = attrs.get("lines") or []
        try:
            trusted_lines = build_trusted_checkout_lines([dict(x) for x in lines])
        except ValueError as exc:
            raise serializers.ValidationError(str(exc))
        attrs["_trusted_lines"] = trusted_lines
        dm = attrs.get("deliveryMethod", CartOrder.DeliveryMethod.PICKUP)
        if dm == CartOrder.DeliveryMethod.OZON_LOGISTICS:
            from .services.ozon_acquiring_cart import lines_missing_ozon_sku

            if lines_missing_ozon_sku(trusted_lines):
                raise serializers.ValidationError(
                    {
                        "deliveryMethod": [
                            "Логистика Ozon доступна только если у всех товаров в каталоге задан Ozon SKU.",
                        ]
                    }
                )
        goods_sub = goods_subtotal_from_lines(trusted_lines)
        min_rub = int(s.checkout_minimum_order_rub or 0)
        if min_rub > 0 and goods_sub < min_rub:
            est = f"{min_rub:,}".replace(",", " ")
            raise serializers.ValidationError(f"Минимальная сумма заказа (товары) — {est} ₽.")
        delivery = attrs.get("delivery") or {}
        free_from = int(s.checkout_free_delivery_from_rub or 0)
        if dm == CartOrder.DeliveryMethod.CDEK:
            need_delivery_quote = not (free_from > 0 and goods_sub >= free_from)
            if need_delivery_quote and quoted_cdek_delivery_rub(delivery) is None:
                raise serializers.ValidationError(
                    "Укажите стоимость доставки СДЭК: выберите тариф на карте или введите сумму."
                )
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
            if mode == "door":
                top_addr = str(delivery.get("address") or "").strip()
                cdek_addr = ""
                if isinstance(cdek, dict):
                    cdek_addr = str(cdek.get("address") or "").strip()
                if not top_addr and not cdek_addr:
                    raise serializers.ValidationError(
                        "Для доставки курьером укажите адрес: улица, дом (и квартиру при необходимости)."
                    )
        return attrs

    def validate_customer(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Некорректные данные")
        if (value.get("website") or "").strip():
            raise serializers.ValidationError("Проверка не пройдена")
        name = clean_person_name(value.get("name") or "")
        phone = normalize_ru_phone(value.get("phone") or "")
        email = clean_customer_order_email(value.get("email") or "")
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
        from .services.checkout_pricing import (
            cdek_recipient_fee_rub,
            expected_total_approx,
            goods_subtotal_from_lines,
            quoted_cdek_delivery_rub,
        )
        from .services.delivery_snapshot import sanitize_checkout_delivery
        from .services.letters import build_cart_letters
        from .services.order_ref import generate_order_ref
        from .services.ozon_acquiring import try_begin_ozon_pay
        from .services.ozon_acquiring_cart import aggregate_qty_by_ozon_sku
        from .services.ozon_seller_stocks import validate_ozon_logistics_stock

        request = self.context.get("request")
        user = None
        if request and request.user.is_authenticated:
            user = request.user

        ref = generate_order_ref()
        while CartOrder.objects.filter(order_ref=ref).exists():
            ref = generate_order_ref()
        customer = validated_data["customer"]
        lines_plain = validated_data.pop("_trusted_lines", None) or [dict(x) for x in validated_data["lines"]]
        goods_sub = goods_subtotal_from_lines(lines_plain)
        dm = validated_data.get("deliveryMethod", CartOrder.DeliveryMethod.PICKUP)
        pm = validated_data.get("paymentMethod", CartOrder.PaymentMethod.CASH_PICKUP)
        delivery_snapshot = sanitize_checkout_delivery(validated_data.get("delivery") or {})

        settings = SiteSettings.get_solo()
        free_from = int(settings.checkout_free_delivery_from_rub or 0)
        if dm == CartOrder.DeliveryMethod.CDEK:
            if free_from > 0 and goods_sub >= free_from:
                delivery_charge = 0
            else:
                q = quoted_cdek_delivery_rub(delivery_snapshot)
                delivery_charge = q if q is not None else 0
        else:
            delivery_charge = 0

        recipient_fee = cdek_recipient_fee_rub(
            settings=settings,
            delivery_method=dm,
            payment_method=pm,
            goods_subtotal=goods_sub,
        )
        if dm == CartOrder.DeliveryMethod.CDEK:
            cdek_raw = delivery_snapshot.get("cdek")
            cdek_obj = dict(cdek_raw) if isinstance(cdek_raw, dict) else {}
            cdek_obj["recipientFeeRub"] = int(recipient_fee)
            delivery_snapshot["cdek"] = cdek_obj
        if dm == CartOrder.DeliveryMethod.OZON_LOGISTICS:
            ol0 = delivery_snapshot.get("ozonLogistics")
            ol_d = dict(ol0) if isinstance(ol0, dict) else {}
            ol_d["deliveryPayer"] = (settings.ozon_logistics_delivery_payer or "store").strip() or "store"
            delivery_snapshot["ozonLogistics"] = ol_d

        total_expected = expected_total_approx(goods_sub, delivery_charge, recipient_fee)
        if int(validated_data["totalApprox"]) != total_expected:
            raise serializers.ValidationError(
                {
                    "totalApprox": "Сумма заказа не совпала с расчётом. Обновите страницу и проверьте доставку.",
                }
            )

        if (
            dm == CartOrder.DeliveryMethod.OZON_LOGISTICS
            and pm == CartOrder.PaymentMethod.CARD_ONLINE
        ):
            need = aggregate_qty_by_ozon_sku(lines_plain)
            if need:
                validate_ozon_logistics_stock(need)

        acquiring: dict = {}
        if pm == CartOrder.PaymentMethod.CARD_ONLINE:
            acquiring = try_begin_ozon_pay(
                order_ref=ref,
                total_approx=total_expected,
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

        if pm in (CartOrder.PaymentMethod.CARD_ONLINE, CartOrder.PaymentMethod.COD_CDEK):
            pay_status = CartOrder.PaymentStatus.PENDING
        else:
            pay_status = CartOrder.PaymentStatus.NOT_REQUIRED

        if dm == CartOrder.DeliveryMethod.CDEK and pm == CartOrder.PaymentMethod.CARD_ONLINE:
            cdek_sync_status = CartOrder.CdekSyncStatus.PENDING
        elif dm == CartOrder.DeliveryMethod.CDEK:
            cdek_sync_status = CartOrder.CdekSyncStatus.PENDING
        else:
            cdek_sync_status = CartOrder.CdekSyncStatus.NOT_REQUIRED

        dm_label = CartOrder.DeliveryMethod(dm).label
        pm_label = CartOrder.PaymentMethod(pm).label
        manager_letter, client_ack = build_cart_letters(
            ref,
            customer,
            lines_plain,
            total_expected,
            delivery=delivery_snapshot,
            delivery_method_label=str(dm_label),
            payment_method_label=str(pm_label),
            goods_subtotal=goods_sub,
            delivery_price_rub=delivery_charge,
            recipient_fee_rub=recipient_fee,
        )
        if pm == CartOrder.PaymentMethod.CARD_ONLINE:
            pay_url = acquiring.get("redirectUrl") if isinstance(acquiring, dict) else None
            extra = (acquiring or {}).get("message") if isinstance(acquiring, dict) else None
            if pay_url:
                client_ack = f"{client_ack}\n\nОплатить заказ онлайн: {pay_url}\n"
            elif extra:
                client_ack = f"{client_ack}\n\n{extra}\n"

        payment_ext = ""
        if pm == CartOrder.PaymentMethod.CARD_ONLINE and isinstance(acquiring, dict):
            oid = acquiring.get("ozonOrderId")
            if oid is not None and str(oid).strip():
                payment_ext = str(oid).strip()[:128]

        return CartOrder.objects.create(
            order_ref=ref,
            order_source=CartOrder.OrderSource.CHECKOUT,
            user=user,
            customer_name=customer.get("name", "").strip(),
            customer_phone=customer.get("phone", "").strip(),
            customer_email=(customer.get("email") or "").strip(),
            customer_comment=(customer.get("comment") or "").strip(),
            lines=lines_plain,
            total_approx=total_expected,
            goods_subtotal_approx=goods_sub,
            delivery_price_rub=delivery_charge,
            manager_letter=manager_letter,
            client_ack=client_ack,
            delivery_method=dm,
            payment_method=pm,
            payment_status=pay_status,
            payment_provider="ozon_pay" if pm == CartOrder.PaymentMethod.CARD_ONLINE else "",
            payment_external_id=payment_ext,
            delivery_provider=str(dm),
            delivery_snapshot=delivery_snapshot,
            acquiring_payload=acquiring if isinstance(acquiring, dict) else {},
            cdek_sync_status=cdek_sync_status,
        )


class OneClickOrderCreateSerializer(serializers.Serializer):
    """Заказ в 1 клик: только контакт и товарные строки (без доставки и оплаты на сайте)."""

    customer = serializers.DictField()
    lines = CartLineInputSerializer(many=True)
    totalApprox = serializers.IntegerField(min_value=0)

    def validate(self, attrs):
        from .models import SiteSettings
        from .services.checkout_pricing import build_trusted_checkout_lines, goods_subtotal_from_lines
        from .services.checkout_rules import raise_if_checkout_orders_blocked

        s = SiteSettings.get_solo()
        raise_if_checkout_orders_blocked(s)
        lines = attrs.get("lines") or []
        if not lines:
            raise serializers.ValidationError({"lines": ["Нужна хотя бы одна позиция."]})
        try:
            trusted_lines = build_trusted_checkout_lines([dict(x) for x in lines])
        except ValueError as exc:
            raise serializers.ValidationError(str(exc))
        attrs["_trusted_lines"] = trusted_lines
        goods_sub = goods_subtotal_from_lines(trusted_lines)
        min_rub = int(s.checkout_minimum_order_rub or 0)
        if min_rub > 0 and goods_sub < min_rub:
            est = f"{min_rub:,}".replace(",", " ")
            raise serializers.ValidationError(f"Минимальная сумма заказа (товары) — {est} ₽.")
        ta = int(attrs.get("totalApprox") or 0)
        if ta != goods_sub:
            raise serializers.ValidationError(
                {"totalApprox": "Сумма не совпала с расчётом по каталогу. Обновите страницу."}
            )
        return attrs

    def validate_customer(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Некорректные данные")
        if (value.get("website") or "").strip():
            raise serializers.ValidationError("Проверка не пройдена")
        name = clean_person_name(value.get("name") or "")
        phone = normalize_ru_phone(value.get("phone") or "")
        email = clean_customer_order_email(value.get("email") or "")
        return {
            "name": name,
            "phone": phone,
            "email": email,
        }

    def create(self, validated_data):
        from .models import SiteSettings
        from .services.checkout_pricing import goods_subtotal_from_lines
        from .services.letters import build_one_click_letters
        from .services.order_ref import generate_order_ref

        request = self.context.get("request")
        user = None
        if request and request.user.is_authenticated:
            user = request.user

        ref = generate_order_ref()
        while CartOrder.objects.filter(order_ref=ref).exists():
            ref = generate_order_ref()
        customer = validated_data["customer"]
        lines_plain = validated_data.pop("_trusted_lines", None) or [dict(x) for x in validated_data["lines"]]
        goods_sub = goods_subtotal_from_lines(lines_plain)
        _ = SiteSettings.get_solo()

        manager_letter, client_ack = build_one_click_letters(ref, customer, lines_plain, goods_sub)
        return CartOrder.objects.create(
            order_ref=ref,
            order_source=CartOrder.OrderSource.ONE_CLICK,
            user=user,
            customer_name=customer.get("name", "").strip(),
            customer_phone=customer.get("phone", "").strip(),
            customer_email=(customer.get("email") or "").strip(),
            customer_comment="",
            lines=lines_plain,
            total_approx=goods_sub,
            goods_subtotal_approx=goods_sub,
            delivery_price_rub=0,
            manager_letter=manager_letter,
            client_ack=client_ack,
            delivery_method=CartOrder.DeliveryMethod.PICKUP,
            payment_method=CartOrder.PaymentMethod.CASH_PICKUP,
            payment_status=CartOrder.PaymentStatus.NOT_REQUIRED,
            payment_provider="",
            delivery_provider="pickup",
            delivery_snapshot={},
            acquiring_payload={},
            cdek_sync_status=CartOrder.CdekSyncStatus.NOT_REQUIRED,
        )


class CartOrderResponseSerializer(serializers.ModelSerializer):
    orderRef = serializers.CharField(source="order_ref")
    clientAck = serializers.CharField(source="client_ack")
    fulfillmentStatus = serializers.CharField(source="fulfillment_status", read_only=True)
    paymentRedirectUrl = serializers.SerializerMethodField()
    cdekSync = serializers.SerializerMethodField()

    class Meta:
        model = CartOrder
        fields = ("orderRef", "clientAck", "fulfillmentStatus", "paymentRedirectUrl", "cdekSync")

    def get_cdekSync(self, obj: CartOrder) -> dict[str, str | None] | None:
        if obj.delivery_method != CartOrder.DeliveryMethod.CDEK:
            return None
        err = (obj.cdek_sync_error or "").strip() or None
        tr = (obj.cdek_tracking or "").strip() or None
        return {
            "status": str(obj.cdek_sync_status or ""),
            "error": err,
            "tracking": tr,
        }

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
    portfolioEnabled = serializers.BooleanField(source="show_portfolio", read_only=True)
    productPhotoAspect = serializers.CharField(source="product_photo_aspect", read_only=True)
    catalogIntro = serializers.CharField(source="catalog_intro", read_only=True)
    catalogWarrantyMonths = serializers.IntegerField(source="catalog_warranty_months", read_only=True)
    catalogReturnDays = serializers.IntegerField(source="catalog_return_days", read_only=True)
    catalogTrustWarrantyIconUrl = serializers.SerializerMethodField()
    catalogTrustReturnIconUrl = serializers.SerializerMethodField()
    checkout = serializers.SerializerMethodField()
    mapForm = serializers.SerializerMethodField()
    analyticsYandex = serializers.SerializerMethodField()
    seoDefaults = serializers.SerializerMethodField()
    headerNavigation = serializers.SerializerMethodField()
    reviewsYandex = serializers.SerializerMethodField()
    reviewsMarket = serializers.SerializerMethodField()

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
            "portfolioEnabled",
            "productPhotoAspect",
            "catalogIntro",
            "catalogWarrantyMonths",
            "catalogReturnDays",
            "catalogTrustWarrantyIconUrl",
            "catalogTrustReturnIconUrl",
            "checkout",
            "mapForm",
            "analyticsYandex",
            "seoDefaults",
            "headerNavigation",
            "reviewsYandex",
            "reviewsMarket",
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

    def get_catalogTrustWarrantyIconUrl(self, obj: SiteSettings) -> str | None:
        return self._absolute_media(
            self.context.get("request"), getattr(obj, "catalog_trust_warranty_icon", None)
        )

    def get_catalogTrustReturnIconUrl(self, obj: SiteSettings) -> str | None:
        return self._absolute_media(
            self.context.get("request"), getattr(obj, "catalog_trust_return_icon", None)
        )

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
        from django.urls import reverse

        from .services.cdek_dimensions import cdek_default_package
        from .services.cdek_checkout_public import cdek_widget_tariffs_public
        from .services.cdek_runtime import cdek_api_base_url
        from .services.checkout_rules import (
            allowed_payment_methods,
            checkout_orders_blocked_public_message,
            delivery_options_public,
        )

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

        default_pack = cdek_default_package(obj)
        default_goods = [default_pack]
        widget_script = (obj.cdek_widget_script_url or "").strip() or "https://cdn.jsdelivr.net/npm/@cdek-it/widget@3"
        req = self.context.get("request")
        widget_service_url = ""
        if req is not None:
            widget_service_url = req.build_absolute_uri(reverse("cdek-widget-service"))

        deliveries = delivery_options_public(obj)
        matrix = {d["id"]: allowed_payment_methods(d["id"], obj) for d in deliveries}
        payment_labels = {c.value: str(c.label) for c in CartOrder.PaymentMethod}
        tariffs = cdek_widget_tariffs_public(obj)

        return {
            "minimumOrderRub": int(obj.checkout_minimum_order_rub or 0),
            "freeDeliveryFromRub": int(obj.checkout_free_delivery_from_rub or 0),
            "ordersBlocked": bool(obj.checkout_orders_blocked),
            "ordersBlockedMessage": checkout_orders_blocked_public_message(obj),
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
                "checkoutUi": obj.cdek_checkout_ui,
                "tariffs": tariffs,
                "defaultPackage": default_pack,
                "widgetGoods": default_goods,
                "recipientDeliveryFee": {
                    "mode": str(obj.cdek_recipient_delivery_fee_mode or "off"),
                    "fixedRub": int(obj.cdek_recipient_delivery_fee_fixed_rub or 0),
                    "percent": float(obj.cdek_recipient_delivery_fee_percent or 0),
                },
            },
            "ozonLogistics": {
                "enabled": obj.ozon_logistics_enabled,
                "buyerNote": obj.ozon_logistics_buyer_note,
                "deliveryPayer": (obj.ozon_logistics_delivery_payer or "store").strip() or "store",
                "deliveryPayerLabel": (
                    "Доставка за счёт покупателя"
                    if (obj.ozon_logistics_delivery_payer or "").strip() == "buyer"
                    else "Доставка за наш счёт"
                ),
            },
            "ozonPay": {
                "enabled": obj.ozon_pay_enabled,
                "sandbox": obj.ozon_pay_sandbox,
            },
        }

    def get_analyticsYandex(self, obj: SiteSettings) -> dict:
        return {
            "enabled": bool(obj.analytics_yandex_enabled),
            "headSnippet": str(obj.analytics_head_snippet or "").strip(),
            "bodyStartSnippet": str(obj.analytics_body_start_snippet or "").strip(),
            "bodyEndSnippet": str(obj.body_end_snippet or "").strip(),
        }

    def get_seoDefaults(self, obj: SiteSettings) -> dict:
        from .models import default_seo_title_templates

        templates = default_seo_title_templates()
        raw = getattr(obj, "seo_title_templates", None)
        if isinstance(raw, dict):
            for k, v in raw.items():
                if k in templates and isinstance(v, str) and v.strip():
                    templates[str(k)] = v.strip()
        req = self.context.get("request")
        og = self._absolute_media(req, obj.seo_og_image) if getattr(obj, "seo_og_image", None) else None
        return {
            "allowIndexing": bool(obj.seo_allow_indexing),
            "region": (obj.seo_region or "RU").strip() or "RU",
            "defaultMetaDescription": (obj.seo_default_meta_description or "").strip(),
            "catalogListingMetaDescription": (getattr(obj, "seo_catalog_listing_meta_description", None) or "").strip(),
            "blogListingMetaDescription": (getattr(obj, "seo_blog_listing_meta_description", None) or "").strip(),
            "portfolioListingMetaDescription": (
                getattr(obj, "seo_portfolio_listing_meta_description", None) or ""
            ).strip(),
            "titleSuffix": (obj.seo_title_suffix or "").strip(),
            "locale": (obj.seo_locale or "ru_RU").strip() or "ru_RU",
            "titleTemplates": templates,
            "titleSeparator": (getattr(obj, "seo_title_separator", None) or " | ").strip() or " | ",
            "ogImageUrl": og,
            "metaDescriptionMaxLength": int(getattr(obj, "seo_meta_description_max", None) or 160),
            "twitterCard": (getattr(obj, "seo_twitter_card", None) or "summary_large_image")
            .strip()
            or "summary_large_image",
        }

    def get_headerNavigation(self, obj: SiteSettings) -> list[dict[str, object]]:
        from config.header_nav import normalize_header_navigation

        return normalize_header_navigation(obj.header_navigation)

    def get_reviewsYandex(self, obj: SiteSettings) -> dict[str, str]:
        return {
            "profileUrl": (obj.reviews_yandex_profile_url or "").strip(),
            "widgetHtml": (obj.reviews_yandex_widget_html or "").strip(),
        }

    def get_reviewsMarket(self, obj: SiteSettings) -> dict[str, bool]:
        api_key = (os.environ.get("YANDEX_MARKET_PARTNER_API_KEY") or "").strip()
        bid = (obj.market_goods_feedback_business_id or "").strip()
        active = bool(obj.market_goods_feedback_enabled and api_key and bid)
        return {"goodsFeedbackActive": active}


class StaticPagePublicSerializer(serializers.ModelSerializer):
    path = serializers.SerializerMethodField()
    pageTitle = serializers.CharField(source="meta_title", read_only=True)
    metaDescription = serializers.CharField(source="meta_description", read_only=True)
    bodyHtml = serializers.SerializerMethodField()
    aboutPayload = serializers.SerializerMethodField()
    showInHeader = serializers.BooleanField(source="show_in_header", read_only=True)
    showInFooter = serializers.BooleanField(source="show_in_footer", read_only=True)
    headerLinkLabel = serializers.CharField(source="header_link_label", read_only=True)
    footerLinkLabel = serializers.CharField(source="footer_link_label", read_only=True)
    sortOrder = serializers.IntegerField(source="sort_order", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", format="%Y-%m-%dT%H:%M:%S%z", read_only=True)
    robots = serializers.SerializerMethodField()

    STATIC_PAGE_NOINDEX_SLUGS = frozenset(
        {
            "politika-konfidentsialnosti-i-soglasie-na-obrabotku-personalnykh-dannykh",
            "polzovatelskoe-soglashenie",
            "publichnaia-oferta",
            "soglasie-na-obrabotku-personalnykh-dannykh",
        }
    )

    class Meta:
        model = StaticPage
        fields = (
            "slug",
            "path",
            "title",
            "pageTitle",
            "metaDescription",
            "bodyHtml",
            "aboutPayload",
            "showInHeader",
            "showInFooter",
            "headerLinkLabel",
            "footerLinkLabel",
            "sortOrder",
            "updatedAt",
            "robots",
        )

    def get_robots(self, obj: StaticPage) -> str:
        ss = self.context.get("site_settings")
        if ss is None:
            ss = SiteSettings.get_solo()
        if not ss.seo_allow_indexing:
            return "noindex, nofollow"
        slug = (obj.slug or "").strip()
        if slug in self.STATIC_PAGE_NOINDEX_SLUGS:
            return "noindex, follow"
        return "index, follow"

    def get_path(self, obj: StaticPage) -> str:
        return f"/{obj.slug}"

    def get_bodyHtml(self, obj: StaticPage) -> str:
        return sanitize_html_fragment(obj.body or "")

    def get_aboutPayload(self, obj: StaticPage) -> dict[str, object]:
        raw = obj.about_payload if isinstance(obj.about_payload, dict) else {}
        out = sanitize_about_payload(raw)
        if (getattr(obj, "slug", None) or "").strip() == "o-nas" and raw.get("version") == 1:
            return merge_static_page_about_file_urls(out, obj, self.context.get("request"))
        return out


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
    deliveryMethod = serializers.CharField(source="delivery_method", read_only=True)
    deliveryMethodLabel = serializers.SerializerMethodField()
    cdekTracking = serializers.SerializerMethodField()
    cdekTrackingUrl = serializers.SerializerMethodField()
    ozonPayExternalOrderId = serializers.SerializerMethodField()
    ozonMyOrdersUrl = serializers.SerializerMethodField()

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
            "deliveryMethod",
            "deliveryMethodLabel",
            "cdekTracking",
            "cdekTrackingUrl",
            "ozonPayExternalOrderId",
            "ozonMyOrdersUrl",
        )

    def get_fulfillmentStatusLabel(self, obj: CartOrder) -> str:
        return obj.get_fulfillment_status_display()

    def get_paymentStatusLabel(self, obj: CartOrder) -> str:
        return obj.get_payment_status_display()

    def get_deliveryMethodLabel(self, obj: CartOrder) -> str:
        return obj.get_delivery_method_display()

    def get_cdekTracking(self, obj: CartOrder) -> str:
        if obj.delivery_method != CartOrder.DeliveryMethod.CDEK:
            return ""
        return (obj.cdek_tracking or "").strip()

    def get_cdekTrackingUrl(self, obj: CartOrder) -> str:
        if obj.delivery_method != CartOrder.DeliveryMethod.CDEK:
            return ""
        url = cdek_public_tracking_url(obj.cdek_tracking)
        return url or ""

    def get_ozonPayExternalOrderId(self, obj: CartOrder) -> str:
        if obj.delivery_method != CartOrder.DeliveryMethod.OZON_LOGISTICS:
            return ""
        return (obj.payment_external_id or "").strip()

    def get_ozonMyOrdersUrl(self, obj: CartOrder) -> str:
        if obj.delivery_method != CartOrder.DeliveryMethod.OZON_LOGISTICS:
            return ""
        return OZON_MY_ORDERS_PUBLIC_URL


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
