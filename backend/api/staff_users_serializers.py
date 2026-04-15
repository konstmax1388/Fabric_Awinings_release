"""Staff API: пользователи и группы."""

from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import serializers

User = get_user_model()


class GroupStaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ("id", "name")
        read_only_fields = ("id",)

    def to_representation(self, instance: Group) -> dict[str, Any]:
        return {"id": str(instance.pk), "name": instance.name}


class UserStaffSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source="first_name", allow_blank=True, required=False, max_length=150)
    lastName = serializers.CharField(source="last_name", allow_blank=True, required=False, max_length=150)
    isActive = serializers.BooleanField(source="is_active", required=False, default=True)
    isStaff = serializers.BooleanField(source="is_staff", required=False, default=False)
    isSuperuser = serializers.BooleanField(source="is_superuser", required=False, default=False)
    groupIds = serializers.PrimaryKeyRelatedField(
        source="groups", queryset=Group.objects.all(), many=True, required=False
    )
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
    dateJoined = serializers.DateTimeField(source="date_joined", read_only=True)
    lastLogin = serializers.DateTimeField(source="last_login", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "firstName",
            "lastName",
            "isActive",
            "isStaff",
            "isSuperuser",
            "groupIds",
            "password",
            "dateJoined",
            "lastLogin",
        )
        read_only_fields = ("id", "dateJoined", "lastLogin")

    def create(self, validated_data: dict) -> Any:
        groups = validated_data.pop("groups", [])
        password = validated_data.pop("password", None)
        if not password or not str(password).strip():
            raise serializers.ValidationError({"password": ["Укажите пароль (не короче 8 символов)."]})
        u = User.objects.create_user(password=password, **validated_data)
        if groups:
            u.groups.set(groups)
        return u

    def update(self, instance: Any, validated_data: dict) -> Any:
        groups = validated_data.pop("groups", None)
        password = validated_data.pop("password", None)
        instance = super().update(instance, validated_data)
        if groups is not None:
            instance.groups.set(groups)
        if password and str(password).strip():
            instance.set_password(password)
            instance.save()
        return instance

    def to_representation(self, instance: Any) -> dict[str, Any]:
        return {
            "id": str(instance.pk),
            "username": instance.username,
            "email": instance.email or "",
            "firstName": instance.first_name or "",
            "lastName": instance.last_name or "",
            "isActive": instance.is_active,
            "isStaff": instance.is_staff,
            "isSuperuser": instance.is_superuser,
            "groupIds": [str(g.pk) for g in instance.groups.all()],
            "dateJoined": instance.date_joined.isoformat() if instance.date_joined else None,
            "lastLogin": instance.last_login.isoformat() if instance.last_login else None,
        }


class SetPasswordStaffSerializer(serializers.Serializer):
    newPassword = serializers.CharField(min_length=8, write_only=True)
