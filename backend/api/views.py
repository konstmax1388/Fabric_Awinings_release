from django.db.models import Prefetch
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .filters import ProductFilter
from .models import (
    BlogPost,
    CalculatorLead,
    CallbackLead,
    PortfolioProject,
    Product,
    ProductCategory,
    ProductImage,
    ProductSpecification,
    ProductVariant,
    Review,
)
from .pagination import ProductPagination
from .throttles import LeadSubmissionThrottle
from .serializers import (
    BlogPostDetailSerializer,
    BlogPostListSerializer,
    CalculatorLeadCreateSerializer,
    CallbackLeadCreateSerializer,
    CartOrderCreateSerializer,
    CartOrderResponseSerializer,
    PortfolioSerializer,
    ProductCategoryPublicSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ReviewSubmissionCreateSerializer,
    ReviewSerializer,
)


@ensure_csrf_cookie
@api_view(["GET"])
def health(request):
    return Response(
        {
            "status": "ok",
            "service": "fabric-awnings-api",
            "time": timezone.now().isoformat(),
        }
    )


class ProductCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Категории каталога для витрины (фильтры, меню)."""

    permission_classes = [AllowAny]
    serializer_class = ProductCategoryPublicSerializer
    pagination_class = None
    queryset = ProductCategory.objects.filter(is_published=True).order_by("sort_order", "title")
    lookup_field = "slug"


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    queryset = (
        Product.objects.filter(is_published=True, category__is_published=True)
        .select_related("category")
        .prefetch_related(
            "images_rel",
            Prefetch(
                "variants",
                queryset=ProductVariant.objects.order_by("sort_order", "id").prefetch_related(
                    Prefetch(
                        "images",
                        queryset=ProductImage.objects.order_by("sort_order", "id"),
                    )
                ),
            ),
            Prefetch(
                "specifications",
                queryset=ProductSpecification.objects.order_by("sort_order", "id"),
            ),
        )
        .all()
    )
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ProductFilter
    ordering_fields = ["price_from", "updated_at", "title", "created_at", "sort_order"]
    ordering = ["sort_order", "-updated_at"]
    pagination_class = ProductPagination

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer


class PortfolioViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    queryset = PortfolioProject.objects.filter(is_published=True).all()
    serializer_class = PortfolioSerializer
    lookup_field = "slug"


class ReviewViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    queryset = Review.objects.filter(is_published=True).all()
    serializer_class = ReviewSerializer


class ReviewSubmissionCreateView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [LeadSubmissionThrottle]
    queryset = Review.objects.all()
    serializer_class = ReviewSubmissionCreateSerializer


class BlogPostViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    queryset = BlogPost.objects.filter(is_published=True).all()
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return BlogPostDetailSerializer
        return BlogPostListSerializer


class CalculatorLeadCreateView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    queryset = CalculatorLead.objects.all()
    serializer_class = CalculatorLeadCreateSerializer

    def perform_create(self, serializer):
        lead = serializer.save()
        try:
            from .services.notification_email import notify_calculator_lead

            notify_calculator_lead(lead)
        except Exception:
            import logging

            logging.getLogger(__name__).exception("notify_calculator_lead")


class CallbackLeadCreateView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [LeadSubmissionThrottle]
    queryset = CallbackLead.objects.all()
    serializer_class = CallbackLeadCreateSerializer

    def perform_create(self, serializer):
        lead = serializer.save()
        try:
            from .services.notification_email import notify_callback_lead

            notify_callback_lead(lead)
        except Exception:
            import logging

            logging.getLogger(__name__).exception("notify_callback_lead")


class CartOrderCreateView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    throttle_classes = [LeadSubmissionThrottle]
    queryset = None
    serializer_class = CartOrderCreateSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        try:
            from .services.customer_account_from_order import link_cart_order_to_customer_account

            link_cart_order_to_customer_account(order)
        except Exception:
            import logging

            logging.getLogger(__name__).exception("link_cart_order_to_customer_account")
        try:
            from .services.notification_email import notify_cart_order

            notify_cart_order(order)
        except Exception:
            import logging

            logging.getLogger(__name__).exception("notify_cart_order")
        try:
            from .services.notification_email import send_buyer_order_confirmation_email

            send_buyer_order_confirmation_email(order)
        except Exception:
            import logging

            logging.getLogger(__name__).exception("send_buyer_order_confirmation_email")
        try:
            from .services.astrum_crm import push_cart_order_to_astrum_crm

            push_cart_order_to_astrum_crm(order)
        except Exception:
            import logging

            logging.getLogger(__name__).exception("push_cart_order_to_astrum_crm")
        order.refresh_from_db()
        out = CartOrderResponseSerializer(order)
        return Response(out.data, status=status.HTTP_201_CREATED)
