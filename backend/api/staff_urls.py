"""Маршруты Staff API: /api/staff/v1/..."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .staff_auth import StaffTokenObtainPairView, StaffTokenRefreshView
from .staff_uploads import StaffUploadView
from .staff_views import (
    BlogPostStaffViewSet,
    CallbackLeadStaffViewSet,
    PortfolioProjectStaffViewSet,
    ReviewStaffViewSet,
    SiteEmailTemplateStaffViewSet,
    StaffMetricsOverviewView,
)

router = DefaultRouter()
router.register(r"leads/callback", CallbackLeadStaffViewSet, basename="staff-callback-lead")
router.register(r"portfolio-projects", PortfolioProjectStaffViewSet, basename="staff-portfolio")
router.register(r"reviews", ReviewStaffViewSet, basename="staff-reviews")
router.register(r"blog-posts", BlogPostStaffViewSet, basename="staff-blog")
router.register(r"email-templates", SiteEmailTemplateStaffViewSet, basename="staff-email-templates")

urlpatterns = [
    path("auth/token/", StaffTokenObtainPairView.as_view(), name="staff-token-obtain"),
    path("auth/token/refresh/", StaffTokenRefreshView.as_view(), name="staff-token-refresh"),
    path("uploads/", StaffUploadView.as_view(), name="staff-upload"),
    path("metrics/overview/", StaffMetricsOverviewView.as_view(), name="staff-metrics-overview"),
    path("", include(router.urls)),
]
