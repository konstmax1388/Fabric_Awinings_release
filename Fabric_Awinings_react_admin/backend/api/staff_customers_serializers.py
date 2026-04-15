"""Staff API: профили покупателей и адреса доставки (camelCase)."""

from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import CustomerProfile, ShippingAddress

User = get_user_model()


class CustomerProfileStaffSerializer(serializers.ModelSerializer):
    userId = serializers.PrimaryKeyRelatedField(source="user", queryset=User.objects.all())
    passwordChangeDeadline = serializers.DateTimeField(
        source="password_change_deadline", allow_null=True, required=False
    )
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = CustomerProfile
        fields = ("id", "userId", "phone", "passwordChangeDeadline", "updatedAt")
        read_only_fields = ("id", "updatedAt")

    def to_representation(self, instance: CustomerProfile) -> dict[str, Any]:
        d = instance.password_change_deadline
        return {
            "id": str(instance.pk),
            "userId": str(instance.user_id),
            "phone": instance.phone or "",
            "passwordChangeDeadline": d.isoformat() if d else None,
            "updatedAt": instance.updated_at.isoformat() if instance.updated_at else None,
        }


class ShippingAddressStaffSerializer(serializers.ModelSerializer):
    userId = serializers.PrimaryKeyRelatedField(source="user", queryset=User.objects.all())
    postalCode = serializers.CharField(source="postal_code", allow_blank=True, required=False, default="")
    recipientName = serializers.CharField(source="recipient_name", allow_blank=True, required=False, default="")
    recipientPhone = serializers.CharField(source="recipient_phone", allow_blank=True, required=False, default="")
    isDefault = serializers.BooleanField(source="is_default", required=False, default=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = ShippingAddress
        fields = (
            "id",
            "userId",
            "label",
            "city",
            "street",
            "building",
            "apartment",
            "postalCode",
            "recipientName",
            "recipientPhone",
            "isDefault",
            "createdAt",
        )
        read_only_fields = ("id", "createdAt")

    def to_representation(self, instance: ShippingAddress) -> dict[str, Any]:
        return {
            "id": str(instance.pk),
            "userId": str(instance.user_id),
            "label": instance.label,
            "city": instance.city,
            "street": instance.street,
            "building": instance.building or "",
            "apartment": instance.apartment or "",
            "postalCode": instance.postal_code or "",
            "recipientName": instance.recipient_name or "",
            "recipientPhone": instance.recipient_phone or "",
            "isDefault": instance.is_default,
            "createdAt": instance.created_at.isoformat() if instance.created_at else None,
        }
