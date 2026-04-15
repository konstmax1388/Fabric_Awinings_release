"""JWT только для пользователей с is_staff=True."""

from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .staff_throttles import StaffAuthThrottle


class StaffTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs: dict) -> dict:
        data = super().validate(attrs)
        user = self.user
        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "Учётная запись отключена."},
                code="authorization",
            )
        if not user.is_staff:
            raise serializers.ValidationError(
                {"detail": "Нет прав доступа к панели персонала (нужен статус staff)."},
                code="authorization",
            )
        return data


@extend_schema(tags=["staff"], summary="Получить пару JWT (staff)")
class StaffTokenObtainPairView(TokenObtainPairView):
    serializer_class = StaffTokenObtainPairSerializer
    throttle_classes = [StaffAuthThrottle]


@extend_schema(tags=["staff"], summary="Обновить access JWT (staff)")
class StaffTokenRefreshView(TokenRefreshView):
    """Тот же refresh, что и у публичного API; доступ к Staff API проверяется через IsStaffUser."""

    pass
