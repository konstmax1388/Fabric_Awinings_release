"""Маршруты Staff API: /api/staff/v1/..."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .staff_actions_views import (
    StaffBitrix24CatalogSyncView,
    StaffBitrix24WebhookTestView,
    StaffOzonPayTestView,
    StaffSmtpTestView,
    StaffWbImportView,
)
from .staff_auth import StaffTokenObtainPairView, StaffTokenRefreshView
from .staff_catalog_views import (
    ProductCategoryStaffViewSet,
    ProductImageStaffViewSet,
    ProductSpecificationStaffViewSet,
    ProductStaffViewSet,
    ProductVariantStaffViewSet,
)
from .staff_home_views import HomeContentCurrentStaffView, HomeContentSectionStaffView
from .staff_orders_views import CalculatorLeadStaffViewSet, CartOrderStaffViewSet
from .staff_site_settings_views import SiteSettingsCurrentStaffView, SiteSettingsSectionStaffView
from .staff_uploads import StaffUploadView
from .staff_customers_views import CustomerProfileStaffViewSet, ShippingAddressStaffViewSet
from .staff_users_views import GroupStaffViewSet, UserStaffViewSet
from .staff_views import (
    BlogPostStaffViewSet,
    CallbackLeadStaffViewSet,
    PortfolioProjectStaffViewSet,
    ReviewStaffViewSet,
    SiteEmailTemplateStaffViewSet,
    StaffMetricsOverviewView,
)

router = DefaultRouter()
router.register(r"product-categories", ProductCategoryStaffViewSet, basename="staff-product-category")
router.register(r"products", ProductStaffViewSet, basename="staff-product")
router.register(r"product-variants", ProductVariantStaffViewSet, basename="staff-product-variant")
router.register(r"product-images", ProductImageStaffViewSet, basename="staff-product-image")
router.register(r"product-specifications", ProductSpecificationStaffViewSet, basename="staff-product-spec")
router.register(r"leads/callback", CallbackLeadStaffViewSet, basename="staff-callback-lead")
router.register(r"portfolio-projects", PortfolioProjectStaffViewSet, basename="staff-portfolio")
router.register(r"reviews", ReviewStaffViewSet, basename="staff-reviews")
router.register(r"blog-posts", BlogPostStaffViewSet, basename="staff-blog")
router.register(r"email-templates", SiteEmailTemplateStaffViewSet, basename="staff-email-templates")
router.register(r"orders", CartOrderStaffViewSet, basename="staff-orders")
router.register(r"leads/calculator", CalculatorLeadStaffViewSet, basename="staff-calculator-leads")
router.register(r"users", UserStaffViewSet, basename="staff-users")
router.register(r"groups", GroupStaffViewSet, basename="staff-groups")
router.register(r"customer-profiles", CustomerProfileStaffViewSet, basename="staff-customer-profile")
router.register(r"shipping-addresses", ShippingAddressStaffViewSet, basename="staff-shipping-address")

urlpatterns = [
    path("auth/token/", StaffTokenObtainPairView.as_view(), name="staff-token-obtain"),
    path("auth/token/refresh/", StaffTokenRefreshView.as_view(), name="staff-token-refresh"),
    path("uploads/", StaffUploadView.as_view(), name="staff-upload"),
    path("metrics/overview/", StaffMetricsOverviewView.as_view(), name="staff-metrics-overview"),
    path("site-settings/current/", SiteSettingsCurrentStaffView.as_view(), name="staff-site-settings-current"),
    path(
        "site-settings/sections/<slug:slug>/",
        SiteSettingsSectionStaffView.as_view(),
        name="staff-site-settings-section",
    ),
    path("home-content/current/", HomeContentCurrentStaffView.as_view(), name="staff-home-content-current"),
    path(
        "home-content/sections/<slug:slug>/",
        HomeContentSectionStaffView.as_view(),
        name="staff-home-content-section",
    ),
    path("actions/wb-import/", StaffWbImportView.as_view(), name="staff-action-wb-import"),
    path("actions/smtp-test/", StaffSmtpTestView.as_view(), name="staff-action-smtp-test"),
    path(
        "actions/bitrix24-webhook-test/",
        StaffBitrix24WebhookTestView.as_view(),
        name="staff-action-b24-webhook-test",
    ),
    path(
        "actions/bitrix24-catalog-sync/",
        StaffBitrix24CatalogSyncView.as_view(),
        name="staff-action-b24-catalog-sync",
    ),
    path("actions/ozon-pay-test/", StaffOzonPayTestView.as_view(), name="staff-action-ozon-pay-test"),
    path("", include(router.urls)),
]
