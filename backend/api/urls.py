from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views
from .views_checkout import OzonPayWebhookView
from .views_cdek_cities import CdekSuggestCitiesView
from .views_cdek_widget import CdekWidgetServiceView
from .views_optimized_image import ImageVariantView
from .views_account import (
    ChangePasswordView,
    CurrentUserView,
    CustomerOrderDetailView,
    CustomerOrderListView,
    HomePageContentPublicView,
    RegisterView,
    ShippingAddressViewSet,
    SiteSettingsPublicView,
)

router = DefaultRouter()
router.register(r"product-categories", views.ProductCategoryViewSet, basename="product-category")
router.register(r"products", views.ProductViewSet, basename="product")
router.register(r"portfolio", views.PortfolioViewSet, basename="portfolio")
router.register(r"reviews", views.ReviewViewSet, basename="review")
router.register(r"blog", views.BlogPostViewSet, basename="blog")
router.register(r"addresses", ShippingAddressViewSet, basename="address")

urlpatterns = [
    path("health/", views.health, name="health"),
    path("image-variant/", ImageVariantView.as_view(), name="image-variant"),
    path("site-settings/", SiteSettingsPublicView.as_view(), name="site-settings"),
    path("cdek-widget/service/", CdekWidgetServiceView.as_view(), name="cdek-widget-service"),
    path("cdek/suggest-cities/", CdekSuggestCitiesView.as_view(), name="cdek-suggest-cities"),
    path("home-content/", HomePageContentPublicView.as_view(), name="home-content"),
    path("leads/calculator/", views.CalculatorLeadCreateView.as_view(), name="lead-calculator"),
    path("leads/callback/", views.CallbackLeadCreateView.as_view(), name="lead-callback"),
    path("leads/cart/", views.CartOrderCreateView.as_view(), name="lead-cart"),
    path("webhooks/ozon-pay/", OzonPayWebhookView.as_view(), name="webhook-ozon-pay"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", CurrentUserView.as_view(), name="auth_me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="auth_change_password"),
    path("orders/", CustomerOrderListView.as_view(), name="orders-list"),
    path("orders/<str:order_ref>/", CustomerOrderDetailView.as_view(), name="orders-detail"),
    path("", include(router.urls)),
]
