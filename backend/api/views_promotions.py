"""Публичные акции: список и карточка по слагу."""

from __future__ import annotations

from django.db.models import Prefetch, Q
from django.utils import timezone
from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import Product, Promotion
from .serializers import PromotionDetailSerializer, PromotionListSerializer


def _public_promotions_catalog_queryset():
    """
    Акции для витрины: /sales и карточка по слагу.
    Публикуемые, срок окончания ещё не прошёл (ends_at пусто или в будущем).
    Дата начала может быть в будущем — тогда акция видна на списке и на странице,
    а скидка в корзине включается только после starts_at (см. api.services.promotions).
    """

    now = timezone.now()
    return Promotion.objects.filter(is_published=True).filter(
        Q(ends_at__isnull=True) | Q(ends_at__gte=now)
    ).order_by("sort_order", "-starts_at", "id")


class _NoStorePublicResponseMixin:
    """Не кэшировать ответы CDN/браузером — список должен совпадать с актуальными данными в админке."""

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store, max-age=0, private"
        return response


class ActivePromotionListView(_NoStorePublicResponseMixin, generics.ListAPIView):
    """Опубликованные акции, у которых ещё не истёк срок (см. _public_promotions_catalog_queryset)."""

    permission_classes = [AllowAny]
    serializer_class = PromotionListSerializer

    def get_queryset(self):
        return _public_promotions_catalog_queryset()


class ActivePromotionDetailView(_NoStorePublicResponseMixin, generics.RetrieveAPIView):
    """Детальная страница акции по слагу (тот же набор записей, что и в списке /api/promotions/)."""

    permission_classes = [AllowAny]
    serializer_class = PromotionDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return _public_promotions_catalog_queryset().prefetch_related(
            Prefetch(
                "products",
                queryset=Product.objects.filter(is_published=True, category__is_published=True)
                .select_related("category")
                .prefetch_related("images_rel", "variants"),
            )
        )
