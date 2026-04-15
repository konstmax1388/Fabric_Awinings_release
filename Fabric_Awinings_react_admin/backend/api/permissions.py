"""Права доступа для API."""

from rest_framework.permissions import BasePermission


class IsStaffUser(BasePermission):
    """Доступ только для аутентифицированных пользователей с is_staff=True."""

    message = "Требуются права персонала (staff)."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and user.is_staff)


class MustNotBePasswordChangeOverdue(BasePermission):
    """Блокирует доступ, если не сменили временный пароль после дедлайна (кроме смены пароля)."""

    message = "Срок смены временного пароля истёк. Укажите старый пароль из письма и новый пароль в профиле."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return True
        if user.is_staff:
            return True
        view_cls = view.__class__.__name__
        if view_cls in ("TokenObtainPairView", "TokenRefreshView"):
            return True
        if view_cls == "ChangePasswordView":
            return True
        if view_cls == "CurrentUserView" and request.method == "GET":
            return True
        from .models import CustomerProfile

        try:
            prof = user.customer_profile
        except CustomerProfile.DoesNotExist:
            return True
        deadline = getattr(prof, "password_change_deadline", None)
        if deadline is None:
            return True
        from django.utils import timezone

        if timezone.now() <= deadline:
            return True
        return False
