"""Регистрация, профиль, заказы покупателя, адреса, публичные настройки сайта."""

from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .home_defaults import stored_home_payload
from .models import CartOrder, CustomerProfile, HomePageContent, ShippingAddress, SiteSettings, StaticPage
from .permissions import MustNotBePasswordChangeOverdue
from .throttles import AuthRegisterThrottle
from .throttles import AuthLoginThrottle
from .serializers import (
    ChangePasswordSerializer,
    CustomerOrderDetailSerializer,
    CustomerOrderListSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    ShippingAddressSerializer,
    SiteSettingsPublicSerializer,
    StaticPagePublicSerializer,
)


def _user_payload(user: User) -> dict:
    phone = ""
    password_change_deadline = None
    password_change_blocking = False
    if hasattr(user, "customer_profile") and user.customer_profile:
        prof = user.customer_profile
        phone = prof.phone or ""
        dl = prof.password_change_deadline
        if dl is not None:
            password_change_deadline = dl.isoformat()
            password_change_blocking = timezone.now() > dl
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "firstName": user.first_name or "",
        "lastName": user.last_name or "",
        "phone": phone,
        "isStaff": user.is_staff,
        "groups": [g.name for g in user.groups.all()],
        "passwordChangeDeadline": password_change_deadline,
        "passwordChangeBlocking": password_change_blocking,
    }


@method_decorator(ensure_csrf_cookie, name="dispatch")
class SiteSettingsPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        s = SiteSettings.get_solo()
        response = Response(SiteSettingsPublicSerializer(s, context={"request": request}).data)
        # Настройки оформления меняются в админке; не кэшировать у CDN/браузером (иначе остаётся только самовывоз и т.д.).
        response["Cache-Control"] = "no-store, max-age=0, private"
        return response


@method_decorator(ensure_csrf_cookie, name="dispatch")
class HomePageContentPublicView(APIView):
    """Публичные тексты/блоки главной из админки (без демо-дефолтов)."""

    permission_classes = [AllowAny]

    def get(self, request):
        h = HomePageContent.get_solo()
        home = stored_home_payload(h.payload)
        hero = home.setdefault("hero", {})
        slides = hero.get("slides")
        if isinstance(slides, list):
            for i, s in enumerate(slides[:6]):
                if not isinstance(s, dict):
                    continue
                fimg = getattr(h, f"hero_slide_{i + 1}_image", None)
                if fimg:
                    media_url = request.build_absolute_uri(fimg.url)
                    name = (getattr(fimg, "name", None) or "").lower()
                    if name.endswith((".mp4", ".webm", ".ogv", ".ogg", ".mov", ".m4v")):
                        s["videoUrl"] = media_url
                    else:
                        s["imageUrl"] = media_url
        s0 = slides[0] if isinstance(slides, list) and slides and isinstance(slides[0], dict) else None
        if s0 and (s0.get("imageUrl") or "").strip():
            hero["bgImageUrl"] = s0.get("imageUrl", "")
        elif h.hero_background:
            hero["bgImageUrl"] = request.build_absolute_uri(h.hero_background.url)
        else:
            hero["bgImageUrl"] = ""
        ps = home.get("problemSolution")
        if isinstance(ps, dict):
            cards = ps.get("cards")
            if isinstance(cards, list):
                for i, card in enumerate(cards[:4]):
                    if not isinstance(card, dict):
                        continue
                    if card.get("iconKind") != "image":
                        card["iconImageUrl"] = ""
                        continue
                    img = getattr(h, f"ps{i}_icon_image", None)
                    if img:
                        card["iconImageUrl"] = request.build_absolute_uri(img.url)
                    else:
                        card["iconImageUrl"] = ""
        return Response({"home": home})


class StaticPageListPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        rows = StaticPage.objects.filter(is_published=True).order_by("sort_order", "title")
        return Response({"results": StaticPagePublicSerializer(rows, many=True).data})


class StaticPageDetailPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        page = StaticPage.objects.filter(is_published=True, slug=slug).first()
        if not page:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(StaticPagePublicSerializer(page).data)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRegisterThrottle]

    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": _user_payload(user),
            },
            status=status.HTTP_201_CREATED,
        )


class TokenObtainPairThrottledView(TokenObtainPairView):
    throttle_classes = [AuthLoginThrottle]


class ChangePasswordView(APIView):
    """POST: смена пароля (в т.ч. с временного из письма); сбрасывает password_change_deadline."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = ChangePasswordSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        ser.save()
        request.user.refresh_from_db()
        return Response({"ok": True, "user": _user_payload(request.user)})


class CurrentUserView(APIView):
    """GET / PATCH профиль (имя, телефон) для любого авторизованного пользователя."""

    permission_classes = [IsAuthenticated, MustNotBePasswordChangeOverdue]

    def get(self, request):
        return Response(_user_payload(request.user))

    def patch(self, request):
        ser = ProfileUpdateSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        u = request.user
        data = ser.validated_data
        if "firstName" in data:
            u.first_name = (data["firstName"] or "").strip()
        if "lastName" in data:
            u.last_name = (data["lastName"] or "").strip()
        u.save()
        if "phone" in data:
            prof, _ = CustomerProfile.objects.get_or_create(user=u)
            prof.phone = (data["phone"] or "").strip()
            prof.save()
        return Response(_user_payload(u))


class CustomerOrderListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, MustNotBePasswordChangeOverdue]
    serializer_class = CustomerOrderListSerializer
    queryset = CartOrder.objects.none()

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return CartOrder.objects.none()
        u = self.request.user
        base = CartOrder.objects.select_related("user")
        if u.is_staff:
            return base.order_by("-created_at")
        return base.filter(user=u).order_by("-created_at")


class CustomerOrderDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, MustNotBePasswordChangeOverdue]
    serializer_class = CustomerOrderDetailSerializer
    lookup_field = "order_ref"
    queryset = CartOrder.objects.none()

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return CartOrder.objects.none()
        u = self.request.user
        base = CartOrder.objects.select_related("user")
        if u.is_staff:
            return base.all()
        return base.filter(user=u)


class ShippingAddressViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, MustNotBePasswordChangeOverdue]
    serializer_class = ShippingAddressSerializer
    queryset = ShippingAddress.objects.none()

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return ShippingAddress.objects.none()
        return ShippingAddress.objects.filter(user=self.request.user)
