"""Staff API: каталог (camelCase)."""

from __future__ import annotations

from typing import Any

from rest_framework import serializers

from .admin_forms import TEASER_FORM_FIELDS, teasers_list_for_save
from .models import Product, ProductCategory, ProductImage, ProductSpecification, ProductVariant
from .staff_content_serializers import _abs_media, _apply_image_relative_path


ALLOWED_TEASERS = {k for k, _ in TEASER_FORM_FIELDS}


class ProductCategoryStaffSerializer(serializers.ModelSerializer):
    imageRelativePath = serializers.CharField(write_only=True, required=False, allow_blank=True)
    isPublished = serializers.BooleanField(source="is_published")
    sortOrder = serializers.IntegerField(source="sort_order", min_value=0)
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=64)

    class Meta:
        model = ProductCategory
        fields = (
            "id",
            "slug",
            "title",
            "imageRelativePath",
            "sortOrder",
            "isPublished",
        )
        read_only_fields = ("id",)

    def to_representation(self, instance: ProductCategory) -> dict[str, Any]:
        req = self.context.get("request")
        return {
            "id": str(instance.pk),
            "slug": instance.slug,
            "title": instance.title,
            "imageUrl": _abs_media(req, instance.image),
            "sortOrder": instance.sort_order,
            "isPublished": instance.is_published,
        }

    def create(self, validated_data: dict) -> ProductCategory:
        rel = validated_data.pop("imageRelativePath", None)
        instance = ProductCategory.objects.create(**validated_data)
        try:
            _apply_image_relative_path(instance, "image", rel, "imageRelativePath")
        except serializers.ValidationError:
            instance.delete()
            raise
        instance.save()
        return instance

    def update(self, instance: ProductCategory, validated_data: dict) -> ProductCategory:
        rel = validated_data.pop("imageRelativePath", None)
        instance = super().update(instance, validated_data)
        _apply_image_relative_path(instance, "image", rel, "imageRelativePath")
        instance.save()
        return instance


class ProductVariantStaffSerializer(serializers.ModelSerializer):
    productId = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True, required=False
    )
    wbNmId = serializers.IntegerField(source="wb_nm_id", required=False, allow_null=True)
    priceFrom = serializers.IntegerField(source="price_from", min_value=0)
    sortOrder = serializers.IntegerField(source="sort_order", min_value=0)
    isDefault = serializers.BooleanField(source="is_default")
    marketplaceWbUrl = serializers.URLField(
        source="marketplace_wb_url", required=False, allow_blank=True, max_length=2048
    )
    bitrixCatalogId = serializers.IntegerField(
        source="bitrix_catalog_id", required=False, allow_null=True
    )
    bitrixXmlId = serializers.CharField(
        source="bitrix_xml_id", required=False, allow_blank=True, max_length=191
    )
    ozonSku = serializers.IntegerField(source="ozon_sku", required=False, allow_null=True)

    class Meta:
        model = ProductVariant
        fields = (
            "id",
            "productId",
            "label",
            "wbNmId",
            "priceFrom",
            "sortOrder",
            "isDefault",
            "marketplaceWbUrl",
            "bitrixCatalogId",
            "bitrixXmlId",
            "ozonSku",
        )
        read_only_fields = ("id",)

    def to_representation(self, instance: ProductVariant) -> dict[str, Any]:
        return {
            "id": str(instance.pk),
            "productId": str(instance.product_id),
            "label": instance.label,
            "wbNmId": instance.wb_nm_id,
            "priceFrom": instance.price_from,
            "sortOrder": instance.sort_order,
            "isDefault": instance.is_default,
            "marketplaceWbUrl": instance.marketplace_wb_url or "",
            "bitrixCatalogId": instance.bitrix_catalog_id,
            "bitrixXmlId": instance.bitrix_xml_id or "",
            "ozonSku": instance.ozon_sku,
        }


class ProductSpecificationStaffSerializer(serializers.ModelSerializer):
    productId = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True, required=False
    )
    groupName = serializers.CharField(source="group_name", allow_blank=True, required=False)
    sortOrder = serializers.IntegerField(source="sort_order", min_value=0)

    class Meta:
        model = ProductSpecification
        fields = ("id", "productId", "groupName", "name", "value", "sortOrder")
        read_only_fields = ("id",)

    def to_representation(self, instance: ProductSpecification) -> dict[str, Any]:
        return {
            "id": str(instance.pk),
            "productId": str(instance.product_id),
            "groupName": instance.group_name,
            "name": instance.name,
            "value": instance.value,
            "sortOrder": instance.sort_order,
        }


class ProductImageStaffSerializer(serializers.ModelSerializer):
    productId = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True, required=False
    )
    variantId = serializers.PrimaryKeyRelatedField(
        queryset=ProductVariant.objects.all(),
        source="variant",
        allow_null=True,
        required=False,
    )
    imageRelativePath = serializers.CharField(write_only=True, required=False, allow_blank=True)
    sortOrder = serializers.IntegerField(source="sort_order", min_value=0)

    class Meta:
        model = ProductImage
        fields = ("id", "productId", "variantId", "imageRelativePath", "sortOrder")
        read_only_fields = ("id",)

    def to_representation(self, instance: ProductImage) -> dict[str, Any]:
        req = self.context.get("request")
        return {
            "id": str(instance.pk),
            "productId": str(instance.product_id),
            "variantId": str(instance.variant_id) if instance.variant_id else None,
            "imageUrl": _abs_media(req, instance.image),
            "sortOrder": instance.sort_order,
        }

    def create(self, validated_data: dict) -> ProductImage:
        rel = validated_data.pop("imageRelativePath", None)
        instance = ProductImage.objects.create(**validated_data)
        try:
            _apply_image_relative_path(instance, "image", rel, "imageRelativePath")
        except serializers.ValidationError:
            instance.delete()
            raise
        instance.save()
        return instance

    def update(self, instance: ProductImage, validated_data: dict) -> ProductImage:
        rel = validated_data.pop("imageRelativePath", None)
        instance = super().update(instance, validated_data)
        _apply_image_relative_path(instance, "image", rel, "imageRelativePath")
        instance.save()
        return instance


class ProductStaffSerializer(serializers.ModelSerializer):
    categoryId = serializers.PrimaryKeyRelatedField(
        queryset=ProductCategory.objects.all(), source="category"
    )
    priceFrom = serializers.IntegerField(source="price_from", min_value=0)
    showOnHome = serializers.BooleanField(source="show_on_home")
    isPublished = serializers.BooleanField(source="is_published")
    sortOrder = serializers.IntegerField(source="sort_order", min_value=0)
    descriptionHtml = serializers.CharField(source="description_html", allow_blank=True, required=False)
    bitrixCatalogId = serializers.IntegerField(
        source="bitrix_catalog_id", required=False, allow_null=True
    )
    bitrixXmlId = serializers.CharField(
        source="bitrix_xml_id", required=False, allow_blank=True, max_length=191
    )
    ozonSku = serializers.IntegerField(source="ozon_sku", required=False, allow_null=True)
    marketplaceLinks = serializers.JSONField(source="marketplace_links", required=False)
    teasers = serializers.ListField(child=serializers.CharField(), required=False)
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=120)

    class Meta:
        model = Product
        fields = (
            "id",
            "slug",
            "title",
            "excerpt",
            "description",
            "descriptionHtml",
            "categoryId",
            "priceFrom",
            "showOnHome",
            "teasers",
            "marketplaceLinks",
            "isPublished",
            "sortOrder",
            "bitrixCatalogId",
            "bitrixXmlId",
            "ozonSku",
        )
        read_only_fields = ("id",)

    def validate_teasers(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Ожидается массив строк.")
        for t in value:
            if t not in ALLOWED_TEASERS:
                raise serializers.ValidationError(f"Недопустимый тизер: {t}")
        return value

    def validate_marketplaceLinks(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Ожидается объект.")
        allowed = {"wb", "ozon", "ym", "avito"}
        for k in value.keys():
            if k not in allowed:
                raise serializers.ValidationError(f"Недопустимый ключ МП: {k}")
        return value

    def _base_repr(self, instance: Product) -> dict[str, Any]:
        req = self.context.get("request")
        return {
            "id": str(instance.pk),
            "slug": instance.slug,
            "title": instance.title,
            "excerpt": instance.excerpt,
            "description": instance.description,
            "descriptionHtml": instance.description_html,
            "categoryId": str(instance.category_id),
            "priceFrom": instance.price_from,
            "showOnHome": instance.show_on_home,
            "teasers": instance.teasers if isinstance(instance.teasers, list) else [],
            "marketplaceLinks": instance.marketplace_links if isinstance(instance.marketplace_links, dict) else {},
            "isPublished": instance.is_published,
            "sortOrder": instance.sort_order,
            "bitrixCatalogId": instance.bitrix_catalog_id,
            "bitrixXmlId": instance.bitrix_xml_id or "",
            "ozonSku": instance.ozon_sku,
            "createdAt": instance.created_at.isoformat() if instance.created_at else None,
            "updatedAt": instance.updated_at.isoformat() if instance.updated_at else None,
            "capabilities": {"fullEdit": True},
        }

    def to_representation(self, instance: Product) -> dict[str, Any]:
        data = self._base_repr(instance)
        if self.context.get("embed_detail"):
            data["variants"] = [
                ProductVariantStaffSerializer(v, context=self.context).data
                for v in instance.variants.all()
            ]
            data["specifications"] = [
                ProductSpecificationStaffSerializer(s, context=self.context).data
                for s in instance.specifications.all()
            ]
            data["images"] = [
                ProductImageStaffSerializer(im, context=self.context).data
                for im in instance.images_rel.all()
            ]
        return data

    def create(self, validated_data: dict) -> Product:
        teasers_in = validated_data.pop("teasers", None)
        mp = validated_data.pop("marketplace_links", None)
        instance = Product.objects.create(**validated_data)
        if mp is not None:
            instance.marketplace_links = mp
        if teasers_in is not None:
            fake_cleaned = {fname: (key in teasers_in) for key, fname in TEASER_FORM_FIELDS}
            instance.teasers = teasers_list_for_save([], fake_cleaned)
        instance.save()
        return instance

    def update(self, instance: Product, validated_data: dict) -> Product:
        teasers_in = validated_data.pop("teasers", None)
        mp = validated_data.pop("marketplace_links", serializers.empty)
        instance = super().update(instance, validated_data)
        if mp is not serializers.empty and mp is not None:
            instance.marketplace_links = mp
        if teasers_in is not None:
            raw_before = instance.teasers if isinstance(instance.teasers, list) else []
            fake_cleaned = {fname: (key in teasers_in) for key, fname in TEASER_FORM_FIELDS}
            instance.teasers = teasers_list_for_save(raw_before, fake_cleaned)
        instance.save()
        return instance
