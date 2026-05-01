"""Публичные акции: список и карточка по слагу."""

from __future__ import annotations

from django.db.models import Prefetch, Q
from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import Product, Promotion
from .serializers import PromotionDetailSerializer, PromotionListSerializer


class ActivePromotionListView(generics.ListAPIView):
    """Опубликованные акции в текущем периоде действия."""

    permission_classes = [AllowAny]
    serializer_class = PromotionListSerializer

    def get_queryset(self):
        now = timezone.now()
        return (
            Promotion.objects.filter(is_published=True, starts_at__lte=now)
            .filter(Q(ends_at__isnull=True) | Q(ends_at__gte=now))
            .order_by("sort_order", "-starts_at", "id")
        )


class ActivePromotionDetailView(generics.RetrieveAPIView):
    """Детальная страница акции по слагу (только в периоде действия)."""

    permission_classes = [AllowAny]
    serializer_class = PromotionDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        now = timezone.now()
        return (
            Promotion.objects.filter(is_published=True, starts_at__lte=now)
            .filter(Q(ends_at__isnull=True) | Q(ends_at__gte=now))
            .prefetch_related(
                Prefetch(
                    "products",
                    queryset=Product.objects.filter(is_published=True, category__is_published=True)
                    .select_related("category")
                    .prefetch_related("images_rel", "variants"),
                )
            )
        )
