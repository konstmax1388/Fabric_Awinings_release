from datetime import datetime

from django.db.models import Prefetch
from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .catalog_filters import apply_catalog_spec_filters
from .filters import ProductFilter
from .models import (
    BlogPost,
    CalculatorLead,
    CallbackLead,
    CatalogFilterKey,
    PortfolioProject,
    Product,
    ProductCategory,
    ProductImage,
    ProductSpecification,
    ProductVariant,
    Review,
    ConsentLog,
    SiteSettings,
)
from .pagination import ProductPagination
from .throttles import ConsentLogThrottle, LeadSubmissionThrottle
from .serializers import (
    BlogPostDetailSerializer,
    BlogPostListSerializer,
    CalculatorLeadCreateSerializer,
    CallbackLeadCreateSerializer,
    CartOrderCreateSerializer,
    CartOrderResponseSerializer,
    OneClickOrderCreateSerializer,
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
            "version": getattr(settings, "APP_VERSION", "0.0.0"),
            "gitSha": str(getattr(settings, "GIT_SHA", "") or ""),
            "builtAt": str(getattr(settings, "BUILD_TIME", "") or ""),
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
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["title", "slug", "variants__wb_nm_id", "bitrix_xml_id", "variants__bitrix_xml_id"]
    ordering_fields = ["price_from", "updated_at", "title", "created_at", "sort_order"]
    ordering = ["sort_order", "-updated_at"]
    pagination_class = ProductPagination

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("search"):
            return qs.distinct()
        return qs

    def filter_queryset(self, queryset):
        qs = super().filter_queryset(queryset)
        return apply_catalog_spec_filters(self.request, qs)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["site_settings"] = SiteSettings.get_solo()
        return ctx

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def catalog_filter_facets(request):
    """
    Включённые параметры фильтра + список значений по опубликованным товарам
    (с учётом ?category=slug, если задан).
    """
    category = (request.query_params.get("category") or "").strip()
    products = Product.objects.filter(is_published=True, category__is_published=True)
    if category:
        products = products.filter(category__slug=category)
    keys = CatalogFilterKey.objects.filter(is_enabled=True).order_by("sort_order", "id")
    out: list[dict[str, object]] = []
    for k in keys:
        values_qs = (
            ProductSpecification.objects.filter(
                product__in=products,
                group_name=k.group_name,
                name=k.name,
            )
            .values_list("value", flat=True)
            .order_by("value")
        )
        seen_lower: set[str] = set()
        value_list: list[str] = []
        for v in values_qs:
            t = (v or "").strip()
            if not t:
                continue
            lo = t.lower()
            if lo in seen_lower:
                continue
            seen_lower.add(lo)
            value_list.append(t)
        if not value_list:
            continue
        label = (k.label or "").strip() or k.name
        out.append(
            {
                "id": k.id,
                "label": label,
                "groupName": k.group_name,
                "name": k.name,
                "values": value_list,
            }
        )
    return Response({"keys": out})


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
    throttle_classes = [LeadSubmissionThrottle]
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
            from .services.cdek_order_create import sync_cdek_order_with_retry

            # Для онлайн-оплаты накладную создаём только после webhook "Completed".
            if not (
                order.delivery_method == order.DeliveryMethod.CDEK
                and order.payment_method == order.PaymentMethod.CARD_ONLINE
            ):
                sync_cdek_order_with_retry(order)
        except Exception:
            import logging

            logging.getLogger(__name__).exception("sync_cdek_order_with_retry")
        order.refresh_from_db()
        try:
            from .services.notification_email import notify_cart_order

            notify_cart_order(order)
        except Exception:
            import logging

            logging.getLogger(__name__).exception("notify_cart_order")
        try:
            from .services.notification_email import send_buyer_order_confirmation_email

            # При CDEK+CARD_ONLINE письмо подтверждения отправится после оплаты вместе с треком.
            if not (
                order.delivery_method == order.DeliveryMethod.CDEK
                and order.payment_method == order.PaymentMethod.CARD_ONLINE
            ):
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


class OneClickOrderCreateView(generics.CreateAPIView):
    """Заказ в 1 клик: контакт + позиции (с карточки товара или из корзины)."""

    permission_classes = [AllowAny]
    throttle_classes = [LeadSubmissionThrottle]
    queryset = None
    serializer_class = OneClickOrderCreateSerializer

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

            logging.getLogger(__name__).exception("link_cart_order_to_customer_account (one click)")
        order.refresh_from_db()
        try:
            from .services.notification_email import notify_cart_order

            notify_cart_order(order)
        except Exception:
            import logging

            logging.getLogger(__name__).exception("notify_cart_order (one click)")
        try:
            from .services.notification_email import send_buyer_order_confirmation_email

            send_buyer_order_confirmation_email(order)
        except Exception:
            import logging

            logging.getLogger(__name__).exception("send_buyer_order_confirmation_email (one click)")
        try:
            from .services.astrum_crm import push_cart_order_to_astrum_crm

            push_cart_order_to_astrum_crm(order)
        except Exception:
            import logging

            logging.getLogger(__name__).exception("push_cart_order_to_astrum_crm (one click)")
        order.refresh_from_db()
        out = CartOrderResponseSerializer(order)
        return Response(out.data, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(["POST"])
def log_consent(request):
    if request.headers.get("X-Requested-With") != "XMLHttpRequest":
        return Response({"detail": "X-Requested-With required."}, status=status.HTTP_400_BAD_REQUEST)

    throttle = ConsentLogThrottle()
    if not throttle.allow_request(request, log_consent):
        return Response({"detail": "Too many requests."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    payload = request.data if isinstance(request.data, dict) else {}
    consent_value = payload.get("consent")
    policy_version = str(payload.get("policy_version") or "").strip()[:20]
    url = str(payload.get("url") or "").strip()[:500]
    timestamp_raw = str(payload.get("timestamp") or "").strip()
    if not isinstance(consent_value, bool):
        return Response({"detail": "consent must be boolean."}, status=status.HTTP_400_BAD_REQUEST)
    if not policy_version:
        return Response({"detail": "policy_version is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not url:
        return Response({"detail": "url is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        client_ts = datetime.fromisoformat(timestamp_raw.replace("Z", "+00:00"))
        if timezone.is_naive(client_ts):
            client_ts = timezone.make_aware(client_ts, timezone.get_current_timezone())
    except Exception:
        client_ts = timezone.now()

    xff = str(request.META.get("HTTP_X_FORWARDED_FOR") or "").strip()
    ip_address = (xff.split(",")[0].strip() if xff else "") or str(request.META.get("REMOTE_ADDR") or "").strip()
    ip_address = ip_address[:45]
    user_agent = str(request.META.get("HTTP_USER_AGENT") or "").strip()
    session_id = ""
    try:
        session_id = str(getattr(request.session, "session_key", "") or "")
    except Exception:
        session_id = ""

    ConsentLog.objects.create(
        ip_address=ip_address or "unknown",
        user_agent=user_agent,
        consent_value=consent_value,
        timestamp=client_ts,
        policy_version=policy_version,
        url=url,
        session_id=session_id[:128],
    )
    return Response({"ok": True}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def current_policy_version(request):
    return Response({"version": str(getattr(settings, "CURRENT_POLICY_VERSION", "") or "")})
