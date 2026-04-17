"""Staff API: заказы и лиды калькулятора (camelCase)."""

from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import CalculatorLead, CartOrder

User = get_user_model()


class CalculatorLeadStaffSerializer(serializers.ModelSerializer):
    """Только чтение — заявки с калькулятора."""

    class Meta:
        model = CalculatorLead
        fields = (
            "id",
            "name",
            "phone",
            "comment",
            "length_m",
            "width_m",
            "material_id",
            "material_label",
            "options",
            "estimated_price_rub",
            "created_at",
        )
        read_only_fields = fields

    def to_representation(self, instance: CalculatorLead) -> dict[str, Any]:
        return {
            "id": str(instance.pk),
            "name": instance.name,
            "phone": instance.phone,
            "comment": instance.comment,
            "lengthM": str(instance.length_m),
            "widthM": str(instance.width_m),
            "materialId": instance.material_id,
            "materialLabel": instance.material_label,
            "options": instance.options if isinstance(instance.options, list) else [],
            "estimatedPriceRub": instance.estimated_price_rub,
            "createdAt": instance.created_at.isoformat() if instance.created_at else None,
        }


class CartOrderStaffSerializer(serializers.ModelSerializer):
    orderRef = serializers.CharField(source="order_ref", read_only=True)
    lines = serializers.JSONField(read_only=True)
    totalApprox = serializers.IntegerField(source="total_approx", read_only=True)
    managerLetter = serializers.CharField(source="manager_letter", read_only=True)
    clientAck = serializers.CharField(source="client_ack", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    customerName = serializers.CharField(source="customer_name")
    customerPhone = serializers.CharField(source="customer_phone")
    customerEmail = serializers.EmailField(source="customer_email", allow_blank=True, required=False)
    customerComment = serializers.CharField(
        source="customer_comment", allow_blank=True, required=False, default=""
    )
    userId = serializers.PrimaryKeyRelatedField(
        source="user", queryset=User.objects.all(), allow_null=True, required=False
    )
    fulfillmentStatus = serializers.ChoiceField(
        source="fulfillment_status", choices=CartOrder.FulfillmentStatus.choices
    )
    paymentStatus = serializers.ChoiceField(
        source="payment_status", choices=CartOrder.PaymentStatus.choices
    )
    paymentProvider = serializers.CharField(
        source="payment_provider", allow_blank=True, required=False, default=""
    )
    paymentExternalId = serializers.CharField(
        source="payment_external_id", allow_blank=True, required=False, default=""
    )
    deliveryMethod = serializers.ChoiceField(
        source="delivery_method", choices=CartOrder.DeliveryMethod.choices
    )
    paymentMethod = serializers.ChoiceField(
        source="payment_method", choices=CartOrder.PaymentMethod.choices
    )
    deliveryProvider = serializers.CharField(
        source="delivery_provider", allow_blank=True, required=False, default=""
    )
    deliverySnapshot = serializers.JSONField(
        source="delivery_snapshot", required=False, default=dict
    )
    cdekTracking = serializers.CharField(
        source="cdek_tracking", allow_blank=True, required=False, default=""
    )
    acquiringPayload = serializers.JSONField(
        source="acquiring_payload", required=False, default=dict
    )
    bitrixEntityId = serializers.CharField(
        source="bitrix_entity_id", allow_blank=True, required=False, default=""
    )
    bitrixSyncStatus = serializers.ChoiceField(
        source="bitrix_sync_status", choices=CartOrder.BitrixSyncStatus.choices
    )
    bitrixSyncError = serializers.CharField(
        source="bitrix_sync_error", allow_blank=True, required=False, default=""
    )
    bitrixSyncAttempts = serializers.IntegerField(
        source="bitrix_sync_attempts", min_value=0, max_value=32767, required=False
    )

    class Meta:
        model = CartOrder
        fields = (
            "id",
            "orderRef",
            "customerName",
            "customerPhone",
            "customerEmail",
            "customerComment",
            "userId",
            "lines",
            "totalApprox",
            "managerLetter",
            "clientAck",
            "createdAt",
            "fulfillmentStatus",
            "paymentStatus",
            "paymentProvider",
            "paymentExternalId",
            "deliveryMethod",
            "paymentMethod",
            "deliveryProvider",
            "deliverySnapshot",
            "cdekTracking",
            "acquiringPayload",
            "bitrixEntityId",
            "bitrixSyncStatus",
            "bitrixSyncError",
            "bitrixSyncAttempts",
        )
        read_only_fields = ("id",)

    def to_representation(self, instance: CartOrder) -> dict[str, Any]:
        data = super().to_representation(instance)
        data["id"] = str(instance.pk)
        uid = data.get("userId")
        if uid is not None:
            data["userId"] = str(uid)
        if data.get("createdAt"):
            data["createdAt"] = instance.created_at.isoformat() if instance.created_at else None
        return data
