"""Staff API: профили покупателей и адреса доставки."""

from __future__ import annotations

from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from .models import CustomerProfile, ShippingAddress
from .permissions import IsStaffUser
from .staff_customers_serializers import CustomerProfileStaffSerializer, ShippingAddressStaffSerializer
from .staff_pagination import StaffPageNumberPagination


class CustomerProfileStaffFilter(filters.FilterSet):
    userId = filters.NumberFilter(field_name="user_id")

    class Meta:
        model = CustomerProfile
        fields: list[str] = []


class ShippingAddressStaffFilter(filters.FilterSet):
    userId = filters.NumberFilter(field_name="user_id")
    is_default = filters.BooleanFilter()

    class Meta:
        model = ShippingAddress
        fields: list[str] = []


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Профили покупателей: список"),
    retrieve=extend_schema(tags=["staff"], summary="Профиль: просмотр"),
    create=extend_schema(tags=["staff"], summary="Профиль: создать"),
    update=extend_schema(tags=["staff"], summary="Профиль: заменить"),
    partial_update=extend_schema(tags=["staff"], summary="Профиль: частично обновить"),
    destroy=extend_schema(tags=["staff"], summary="Профиль: удалить"),
)
class CustomerProfileStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = CustomerProfileStaffSerializer
    queryset = CustomerProfile.objects.select_related("user").all()
    pagination_class = StaffPageNumberPagination
    filter_backends = [filters.DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CustomerProfileStaffFilter
    search_fields = ("user__username", "user__email", "phone")
    ordering_fields = ("updated_at", "id", "user_id")
    ordering = ("-updated_at",)


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Адреса доставки: список"),
    retrieve=extend_schema(tags=["staff"], summary="Адрес: просмотр"),
    create=extend_schema(tags=["staff"], summary="Адрес: создать"),
    update=extend_schema(tags=["staff"], summary="Адрес: заменить"),
    partial_update=extend_schema(tags=["staff"], summary="Адрес: частично обновить"),
    destroy=extend_schema(tags=["staff"], summary="Адрес: удалить"),
)
class ShippingAddressStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = ShippingAddressStaffSerializer
    queryset = ShippingAddress.objects.select_related("user").all()
    pagination_class = StaffPageNumberPagination
    filter_backends = [filters.DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ShippingAddressStaffFilter
    search_fields = ("user__username", "city", "street", "label")
    ordering_fields = ("created_at", "id", "city", "is_default")
    ordering = ("-created_at",)
