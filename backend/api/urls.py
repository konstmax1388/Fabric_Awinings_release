from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r"products", views.ProductViewSet, basename="product")
router.register(r"portfolio", views.PortfolioViewSet, basename="portfolio")
router.register(r"reviews", views.ReviewViewSet, basename="review")
router.register(r"blog", views.BlogPostViewSet, basename="blog")

urlpatterns = [
    path("health/", views.health, name="health"),
    path("leads/calculator/", views.CalculatorLeadCreateView.as_view(), name="lead-calculator"),
    path("leads/cart/", views.CartOrderCreateView.as_view(), name="lead-cart"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", views.StaffProfileView.as_view(), name="auth_me"),
    path("", include(router.urls)),
]
