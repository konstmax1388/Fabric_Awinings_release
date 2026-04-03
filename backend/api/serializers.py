from rest_framework import serializers

from .models import (
    BlogPost,
    CalculatorLead,
    CartOrder,
    PortfolioProject,
    Product,
    ProductImage,
    Review,
)


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("url", "sort_order")


class ProductListSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    priceFrom = serializers.IntegerField(source="price_from")
    showOnHome = serializers.BooleanField(source="show_on_home")
    marketplaceLinks = serializers.JSONField(source="marketplace_links")
    updatedAt = serializers.DateTimeField(source="updated_at", format="%Y-%m-%d")

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "title",
            "excerpt",
            "description",
            "category",
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
        qs = obj.images_rel.all()
        return [img.url for img in qs]


class ProductDetailSerializer(ProductListSerializer):
    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields


class PortfolioSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    before = serializers.URLField(source="before_image")
    after = serializers.URLField(source="after_image")
    date = serializers.SerializerMethodField()

    class Meta:
        model = PortfolioProject
        fields = ("id", "slug", "title", "category", "before", "after", "date")

    def get_id(self, obj: PortfolioProject) -> str:
        return str(obj.pk)

    def get_date(self, obj: PortfolioProject) -> str:
        if obj.completed_on:
            return obj.completed_on.strftime("%d.%m.%Y")
        return ""


class ReviewSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    photo = serializers.URLField(source="photo_url", allow_blank=True)
    video = serializers.URLField(source="video_url", allow_blank=True, allow_null=True)

    class Meta:
        model = Review
        fields = ("id", "name", "text", "rating", "photo", "video")

    def get_id(self, obj: Review) -> str:
        return str(obj.pk)


class BlogPostListSerializer(serializers.ModelSerializer):
    img = serializers.URLField(source="cover_image_url", allow_blank=True)
    date = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = ("slug", "title", "excerpt", "date", "img")

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
        )


class CartLineInputSerializer(serializers.Serializer):
    productId = serializers.CharField()
    slug = serializers.CharField()
    title = serializers.CharField()
    priceFrom = serializers.IntegerField(min_value=0)
    qty = serializers.IntegerField(min_value=1, max_value=99)


class CartOrderCreateSerializer(serializers.Serializer):
    customer = serializers.DictField()
    lines = CartLineInputSerializer(many=True)
    totalApprox = serializers.IntegerField(min_value=0)

    def validate_customer(self, value):
        name = (value.get("name") or "").strip()
        phone = (value.get("phone") or "").strip()
        if len(name) < 2:
            raise serializers.ValidationError("Укажите имя")
        if len(phone) < 10:
            raise serializers.ValidationError("Укажите телефон")
        return value

    def create(self, validated_data):
        from .services.letters import build_cart_letters
        from .services.order_ref import generate_order_ref

        ref = generate_order_ref()
        while CartOrder.objects.filter(order_ref=ref).exists():
            ref = generate_order_ref()
        customer = validated_data["customer"]
        lines_plain = [dict(x) for x in validated_data["lines"]]
        total = validated_data["totalApprox"]
        manager_letter, client_ack = build_cart_letters(ref, customer, lines_plain, total)
        return CartOrder.objects.create(
            order_ref=ref,
            customer_name=customer.get("name", "").strip(),
            customer_phone=customer.get("phone", "").strip(),
            customer_email=(customer.get("email") or "").strip(),
            customer_comment=(customer.get("comment") or "").strip(),
            lines=lines_plain,
            total_approx=total,
            manager_letter=manager_letter,
            client_ack=client_ack,
        )


class CartOrderResponseSerializer(serializers.ModelSerializer):
    orderRef = serializers.CharField(source="order_ref")
    clientAck = serializers.CharField(source="client_ack")

    class Meta:
        model = CartOrder
        fields = ("orderRef", "clientAck")
