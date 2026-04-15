"""Staff API: заказы и лиды калькулятора."""

from __future__ import annotations

from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from .models import CalculatorLead, CartOrder
from .permissions import IsStaffUser
from .staff_orders_serializers import CalculatorLeadStaffSerializer, CartOrderStaffSerializer
from .staff_pagination import StaffPageNumberPagination


class CartOrderStaffFilter(filters.FilterSet):
    class Meta:
        model = CartOrder
        fields = ("fulfillment_status", "payment_status", "bitrix_sync_status")


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Заказы: список"),
    retrieve=extend_schema(tags=["staff"], summary="Заказы: просмотр"),
    update=extend_schema(tags=["staff"], summary="Заказы: заменить (поля обработки)"),
    partial_update=extend_schema(tags=["staff"], summary="Заказы: частично обновить"),
)
class CartOrderStaffViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = CartOrderStaffSerializer
    queryset = CartOrder.objects.select_related("user").all()
    pagination_class = StaffPageNumberPagination
    filter_backends = [filters.DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CartOrderStaffFilter
    search_fields = ("order_ref", "customer_name", "customer_phone", "customer_email", "bitrix_entity_id")
    ordering_fields = ("created_at", "total_approx", "id", "order_ref")
    ordering = ("-created_at",)


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Заявки калькулятора: список"),
    retrieve=extend_schema(tags=["staff"], summary="Заявки калькулятора: просмотр"),
)
class CalculatorLeadStaffViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = CalculatorLeadStaffSerializer
    queryset = CalculatorLead.objects.all()
    pagination_class = StaffPageNumberPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ("name", "phone", "material_id", "material_label")
    ordering_fields = ("created_at", "estimated_price_rub", "id")
    ordering = ("-created_at",)
