"""Публичная выдача отзывов о товарах с Яндекс.Маркета (Partner API)."""

from __future__ import annotations

import os

from django.core.cache import cache
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SiteSettings
from .services.yandex_market_goods_feedback import fetch_goods_feedbacks
from .throttles import MarketGoodsFeedbackThrottle


class MarketGoodsFeedbacksPublicView(APIView):
    """
    GET /api/market-goods-feedbacks/?limit=20&min_rating=4&page_token=…

    Требует в админке: включить «Маркет: отзывы о товарах», указать businessId.
    Секрет: переменная окружения YANDEX_MARKET_PARTNER_API_KEY (Api-Key в Partner API).
    """

    permission_classes = [AllowAny]
    throttle_classes = [MarketGoodsFeedbackThrottle]

    def get(self, request):
        site = SiteSettings.get_solo()
        if not site.market_goods_feedback_enabled:
            return Response(
                {
                    "active": False,
                    "items": [],
                    "nextPageToken": None,
                    "error": None,
                }
            )

        api_key = (os.environ.get("YANDEX_MARKET_PARTNER_API_KEY") or "").strip()
        raw_bid = (site.market_goods_feedback_business_id or "").strip()
        if not api_key or not raw_bid:
            return Response(
                {
                    "active": False,
                    "items": [],
                    "nextPageToken": None,
                    "error": None,
                }
            )

        try:
            business_id = int(raw_bid)
        except ValueError:
            return Response(
                {
                    "active": True,
                    "items": [],
                    "nextPageToken": None,
                    "error": "invalid_business_id",
                },
                status=400,
            )

        try:
            limit = int(request.query_params.get("limit", "20"))
        except (TypeError, ValueError):
            limit = 20
        limit = max(1, min(50, limit))

        page_token = (request.query_params.get("page_token") or "").strip() or None

        min_rating = request.query_params.get("min_rating") or request.query_params.get("minRating")
        min_r: int | None = None
        if min_rating is not None and str(min_rating).strip() != "":
            try:
                min_r = int(str(min_rating).strip())
            except ValueError:
                min_r = None
            if min_r is not None and (min_r < 1 or min_r > 5):
                min_r = None

        cache_key = f"market_gf:v1:{business_id}:{limit}:{page_token or ''}:{min_r or 0}"
        cached = cache.get(cache_key)
        if isinstance(cached, dict) and "items" in cached:
            return Response(cached)

        items, next_tok, err = fetch_goods_feedbacks(
            business_id,
            api_key,
            limit=limit,
            page_token=page_token,
            min_rating=min_r,
        )

        payload = {
            "active": True,
            "items": items,
            "nextPageToken": next_tok,
            "error": err,
        }
        ttl = 300 if err is None else 60
        cache.set(cache_key, payload, ttl)
        return Response(payload)
