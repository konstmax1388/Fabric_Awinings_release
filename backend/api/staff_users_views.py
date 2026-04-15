"""Staff API: пользователи и группы."""

from __future__ import annotations

from django.contrib.auth.models import Group
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.contrib.auth import get_user_model

from .permissions import IsStaffUser
from .staff_pagination import StaffPageNumberPagination
from .staff_users_serializers import GroupStaffSerializer, SetPasswordStaffSerializer, UserStaffSerializer

User = get_user_model()


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Пользователи: список"),
    create=extend_schema(tags=["staff"], summary="Пользователи: создать"),
    retrieve=extend_schema(tags=["staff"], summary="Пользователи: просмотр"),
    update=extend_schema(tags=["staff"], summary="Пользователи: заменить"),
    partial_update=extend_schema(tags=["staff"], summary="Пользователи: частично обновить"),
    destroy=extend_schema(tags=["staff"], summary="Пользователи: удалить"),
)
class UserStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = UserStaffSerializer
    queryset = User.objects.all().order_by("-date_joined")
    pagination_class = StaffPageNumberPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ("username", "email", "first_name", "last_name")
    ordering_fields = ("date_joined", "last_login", "username", "id")
    ordering = ("-date_joined",)

    def perform_destroy(self, instance: User) -> None:
        if instance.pk == self.request.user.pk:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Нельзя удалить свою учётную запись.")
        super().perform_destroy(instance)

    @extend_schema(tags=["staff"], summary="Установить пароль пользователя")
    @action(detail=True, methods=["post"], url_path="set-password")
    def set_password(self, request, pk=None):
        user = self.get_object()
        ser = SetPasswordStaffSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user.set_password(ser.validated_data["newPassword"])
        user.save(update_fields=["password"])
        return Response({"ok": True}, status=status.HTTP_200_OK)


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Группы: список"),
    create=extend_schema(tags=["staff"], summary="Группы: создать"),
    retrieve=extend_schema(tags=["staff"], summary="Группы: просмотр"),
    update=extend_schema(tags=["staff"], summary="Группы: заменить"),
    partial_update=extend_schema(tags=["staff"], summary="Группы: частично обновить"),
    destroy=extend_schema(tags=["staff"], summary="Группы: удалить"),
)
class GroupStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = GroupStaffSerializer
    queryset = Group.objects.all().order_by("name")
    pagination_class = StaffPageNumberPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ("name",)
    ordering_fields = ("name", "id")
    ordering = ("name",)
