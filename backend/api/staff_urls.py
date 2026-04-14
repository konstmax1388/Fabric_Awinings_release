"""Маршруты Staff API: /api/staff/v1/..."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .staff_auth import StaffTokenObtainPairView, StaffTokenRefreshView
from .staff_views import CallbackLeadStaffViewSet, StaffMetricsOverviewView

router = DefaultRouter()
router.register(r"leads/callback", CallbackLeadStaffViewSet, basename="staff-callback-lead")

urlpatterns = [
    path("auth/token/", StaffTokenObtainPairView.as_view(), name="staff-token-obtain"),
    path("auth/token/refresh/", StaffTokenRefreshView.as_view(), name="staff-token-refresh"),
    path("metrics/overview/", StaffMetricsOverviewView.as_view(), name="staff-metrics-overview"),
    path("", include(router.urls)),
]
