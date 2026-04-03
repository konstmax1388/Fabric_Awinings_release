from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .filters import ProductFilter
from .models import BlogPost, CalculatorLead, PortfolioProject, Product, Review
from .pagination import ProductPagination
from .serializers import (
    BlogPostDetailSerializer,
    BlogPostListSerializer,
    CalculatorLeadCreateSerializer,
    CartOrderCreateSerializer,
    CartOrderResponseSerializer,
    PortfolioSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ReviewSerializer,
)


@api_view(["GET"])
def health(request):
    return Response(
        {
            "status": "ok",
            "service": "fabric-awnings-api",
            "time": timezone.now().isoformat(),
        }
    )


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    queryset = (
        Product.objects.filter(is_published=True)
        .prefetch_related("images_rel")
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


class CartOrderCreateView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    queryset = None
    serializer_class = CartOrderCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        out = CartOrderResponseSerializer(order)
        return Response(out.data, status=status.HTTP_201_CREATED)


class StaffProfileView(APIView):
    """GET /api/auth/me/ — профиль по JWT (staff / manager)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        return Response(
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "is_staff": u.is_staff,
                "groups": [g.name for g in u.groups.all()],
            }
        )
