"""Staff API: каталог — ViewSet."""

from __future__ import annotations

from django.db.models.deletion import ProtectedError
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from .models import Product, ProductCategory, ProductImage, ProductSpecification, ProductVariant
from .permissions import IsStaffUser
from .staff_catalog_serializers import (
    ProductCategoryStaffSerializer,
    ProductImageStaffSerializer,
    ProductSpecificationStaffSerializer,
    ProductStaffSerializer,
    ProductVariantStaffSerializer,
)
from .staff_pagination import StaffPageNumberPagination


class ProductCategoryFilter(filters.FilterSet):
    class Meta:
        model = ProductCategory
        fields = ("is_published",)


class ProductFilter(filters.FilterSet):
    categoryId = filters.NumberFilter(field_name="category_id")

    class Meta:
        model = Product
        fields = ("is_published",)


class ProductVariantFilter(filters.FilterSet):
    productId = filters.NumberFilter(field_name="product_id")

    class Meta:
        model = ProductVariant
        fields = ()


class ProductImageFilter(filters.FilterSet):
    productId = filters.NumberFilter(field_name="product_id")

    class Meta:
        model = ProductImage
        fields = ()


class ProductSpecificationFilter(filters.FilterSet):
    productId = filters.NumberFilter(field_name="product_id")

    class Meta:
        model = ProductSpecification
        fields = ()


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Категории: список"),
    create=extend_schema(tags=["staff"], summary="Категории: создать"),
    retrieve=extend_schema(tags=["staff"], summary="Категории: просмотр"),
    update=extend_schema(tags=["staff"], summary="Категории: заменить"),
    partial_update=extend_schema(tags=["staff"], summary="Категории: частично обновить"),
    destroy=extend_schema(tags=["staff"], summary="Категории: удалить"),
)
class ProductCategoryStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = ProductCategoryStaffSerializer
    queryset = ProductCategory.objects.all()
    pagination_class = StaffPageNumberPagination
    filter_backends = [filters.DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductCategoryFilter
    search_fields = ("title", "slug")
    ordering_fields = ("sort_order", "title", "id")
    ordering = ("sort_order", "title")

    def destroy(self, request, *args, **kwargs):
        """FK Product.category — PROTECT: понятная ошибка вместо 500."""
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "Нельзя удалить категорию: к ней привязаны товары. "
                        "Перенесите товары в другую категорию или удалите их."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Товары: список"),
    create=extend_schema(tags=["staff"], summary="Товары: создать"),
    retrieve=extend_schema(tags=["staff"], summary="Товары: просмотр (с вариантами, фото, характеристиками)"),
    update=extend_schema(tags=["staff"], summary="Товары: заменить"),
    partial_update=extend_schema(tags=["staff"], summary="Товары: частично обновить"),
    destroy=extend_schema(tags=["staff"], summary="Товары: удалить"),
)
class ProductStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = ProductStaffSerializer
    queryset = (
        Product.objects.select_related("category")
        .prefetch_related("variants", "specifications", "images_rel")
        .all()
    )
    pagination_class = StaffPageNumberPagination
    filter_backends = [filters.DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ("title", "slug", "excerpt")
    ordering_fields = ("sort_order", "updated_at", "created_at", "title", "id")
    ordering = ("sort_order", "-updated_at")

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        if getattr(self, "action", None) == "retrieve":
            ctx["embed_detail"] = True
        return ctx

    @extend_schema(tags=["staff"], summary="Переупорядочить варианты товара")
    @action(detail=True, methods=["post"], url_path="reorder-variants")
    def reorder_variants(self, request, pk=None):
        product = self.get_object()
        raw = request.data.get("orderedIds")
        if not isinstance(raw, list):
            return Response(
                {"detail": "Поле orderedIds должно быть массивом id вариантов."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ids: list[int] = []
        for x in raw:
            try:
                ids.append(int(x))
            except (TypeError, ValueError):
                return Response(
                    {"detail": "Каждый элемент orderedIds должен быть числом."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        want = set(product.variants.values_list("pk", flat=True))
        got = set(ids)
        if len(ids) != len(want) or got != want:
            return Response(
                {"detail": "orderedIds должен содержать ровно все id вариантов этого товара, без лишних."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        for order, vid in enumerate(ids):
            ProductVariant.objects.filter(pk=vid, product_id=product.pk).update(sort_order=order)
        return Response({"ok": True})

    @extend_schema(tags=["staff"], summary="Переупорядочить изображения товара")
    @action(detail=True, methods=["post"], url_path="reorder-images")
    def reorder_images(self, request, pk=None):
        product = self.get_object()
        raw = request.data.get("orderedIds")
        if not isinstance(raw, list):
            return Response(
                {"detail": "Поле orderedIds должно быть массивом id изображений."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ids: list[int] = []
        for x in raw:
            try:
                ids.append(int(x))
            except (TypeError, ValueError):
                return Response(
                    {"detail": "Каждый элемент orderedIds должен быть числом."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        want = set(product.images_rel.values_list("pk", flat=True))
        got = set(ids)
        if len(ids) != len(want) or got != want:
            return Response(
                {"detail": "orderedIds должен содержать ровно все id изображений этого товара."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        for order, iid in enumerate(ids):
            ProductImage.objects.filter(pk=iid, product_id=product.pk).update(sort_order=order)
        return Response({"ok": True})


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Варианты товара: список"),
    create=extend_schema(tags=["staff"], summary="Варианты: создать"),
    retrieve=extend_schema(tags=["staff"], summary="Варианты: просмотр"),
    update=extend_schema(tags=["staff"], summary="Варианты: заменить"),
    partial_update=extend_schema(tags=["staff"], summary="Варианты: частично обновить"),
    destroy=extend_schema(tags=["staff"], summary="Варианты: удалить"),
)
class ProductVariantStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = ProductVariantStaffSerializer
    queryset = ProductVariant.objects.select_related("product").all()
    pagination_class = StaffPageNumberPagination
    filter_backends = [filters.DjangoFilterBackend, OrderingFilter]
    filterset_class = ProductVariantFilter
    ordering_fields = ("sort_order", "id", "label")
    ordering = ("sort_order", "id")


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Изображения товара: список"),
    create=extend_schema(tags=["staff"], summary="Изображения: создать"),
    retrieve=extend_schema(tags=["staff"], summary="Изображения: просмотр"),
    update=extend_schema(tags=["staff"], summary="Изображения: заменить"),
    partial_update=extend_schema(tags=["staff"], summary="Изображения: частично обновить"),
    destroy=extend_schema(tags=["staff"], summary="Изображения: удалить"),
)
class ProductImageStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = ProductImageStaffSerializer
    queryset = ProductImage.objects.select_related("product", "variant").all()
    pagination_class = StaffPageNumberPagination
    filter_backends = [filters.DjangoFilterBackend, OrderingFilter]
    filterset_class = ProductImageFilter
    ordering_fields = ("sort_order", "id")
    ordering = ("sort_order", "id")


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Характеристики товара: список"),
    create=extend_schema(tags=["staff"], summary="Характеристики: создать"),
    retrieve=extend_schema(tags=["staff"], summary="Характеристики: просмотр"),
    update=extend_schema(tags=["staff"], summary="Характеристики: заменить"),
    partial_update=extend_schema(tags=["staff"], summary="Характеристики: частично обновить"),
    destroy=extend_schema(tags=["staff"], summary="Характеристики: удалить"),
)
class ProductSpecificationStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = ProductSpecificationStaffSerializer
    queryset = ProductSpecification.objects.select_related("product").all()
    pagination_class = StaffPageNumberPagination
    filter_backends = [filters.DjangoFilterBackend, OrderingFilter]
    filterset_class = ProductSpecificationFilter
    ordering_fields = ("sort_order", "id", "name")
    ordering = ("sort_order", "id")
