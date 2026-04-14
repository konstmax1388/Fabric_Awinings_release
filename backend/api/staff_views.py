"""ViewSet и вьюхи Staff API (/api/staff/v1/)."""

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BlogPost, CallbackLead, PortfolioProject, Review, SiteEmailTemplate
from .permissions import IsStaffUser
from .staff_content_serializers import (
    BlogPostStaffSerializer,
    PortfolioProjectStaffSerializer,
    ReviewStaffSerializer,
    SiteEmailTemplateStaffSerializer,
)
from .staff_metrics import build_staff_metrics_overview
from .staff_pagination import StaffPageNumberPagination
from .staff_serializers import CallbackLeadStaffSerializer


@extend_schema(tags=["staff"])
class StaffMetricsOverviewView(APIView):
    """Сводные метрики для дашборда панели персонала."""

    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        return Response(build_staff_metrics_overview())


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Список заявок «обратный звонок»"),
    retrieve=extend_schema(tags=["staff"], summary="Заявка «обратный звонок»"),
)
class CallbackLeadStaffViewSet(viewsets.ReadOnlyModelViewSet):
    """Список и просмотр заявок «обратный звонок»."""

    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = CallbackLeadStaffSerializer
    queryset = CallbackLead.objects.all()
    pagination_class = StaffPageNumberPagination
    filter_backends = [OrderingFilter]
    ordering_fields = ("created_at", "id")
    ordering = ("-created_at",)


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Портфолио: список"),
    create=extend_schema(tags=["staff"], summary="Портфолио: создать"),
    retrieve=extend_schema(tags=["staff"], summary="Портфолио: просмотр"),
    update=extend_schema(tags=["staff"], summary="Портфолио: заменить"),
    partial_update=extend_schema(tags=["staff"], summary="Портфолио: частично обновить"),
    destroy=extend_schema(tags=["staff"], summary="Портфолио: удалить"),
)
class PortfolioProjectStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = PortfolioProjectStaffSerializer
    queryset = PortfolioProject.objects.all()
    pagination_class = StaffPageNumberPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ("title", "slug", "category")
    ordering_fields = ("sort_order", "created_at", "id", "title")
    ordering = ("sort_order", "-created_at")


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Отзывы: список"),
    create=extend_schema(tags=["staff"], summary="Отзывы: создать"),
    retrieve=extend_schema(tags=["staff"], summary="Отзывы: просмотр"),
    update=extend_schema(tags=["staff"], summary="Отзывы: заменить"),
    partial_update=extend_schema(tags=["staff"], summary="Отзывы: частично обновить"),
    destroy=extend_schema(tags=["staff"], summary="Отзывы: удалить"),
)
class ReviewStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = ReviewStaffSerializer
    queryset = Review.objects.all()
    pagination_class = StaffPageNumberPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ("name", "text")
    ordering_fields = ("sort_order", "created_at", "id", "rating")
    ordering = ("sort_order", "-created_at")


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Блог: список"),
    create=extend_schema(tags=["staff"], summary="Блог: создать"),
    retrieve=extend_schema(tags=["staff"], summary="Блог: просмотр"),
    update=extend_schema(tags=["staff"], summary="Блог: заменить"),
    partial_update=extend_schema(tags=["staff"], summary="Блог: частично обновить"),
    destroy=extend_schema(tags=["staff"], summary="Блог: удалить"),
)
class BlogPostStaffViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = BlogPostStaffSerializer
    queryset = BlogPost.objects.all()
    pagination_class = StaffPageNumberPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ("title", "slug", "excerpt", "body")
    ordering_fields = ("published_at", "created_at", "id", "title")
    ordering = ("-published_at", "-created_at")


@extend_schema_view(
    list=extend_schema(tags=["staff"], summary="Шаблоны писем: список"),
    retrieve=extend_schema(tags=["staff"], summary="Шаблон письма: просмотр"),
    update=extend_schema(tags=["staff"], summary="Шаблон письма: заменить"),
    partial_update=extend_schema(tags=["staff"], summary="Шаблон письма: частично обновить"),
)
class SiteEmailTemplateStaffViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated, IsStaffUser]
    serializer_class = SiteEmailTemplateStaffSerializer
    queryset = SiteEmailTemplate.objects.all()
    pagination_class = StaffPageNumberPagination
    filter_backends = [OrderingFilter, SearchFilter]
    search_fields = ("key", "subject")
    ordering_fields = ("key", "id")
    ordering = ("key",)
