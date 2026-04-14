"""ViewSet и вьюхи Staff API (/api/staff/v1/)."""

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter

from .models import CallbackLead
from .permissions import IsStaffUser
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
