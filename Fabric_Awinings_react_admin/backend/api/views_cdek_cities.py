"""Публичные подсказки городов для оформления заказа (СДЭК)."""

from __future__ import annotations

import logging

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import SiteSettings
from api.services.cdek_http import CdekAuthError
from api.services.cdek_locations import search_cdek_cities

logger = logging.getLogger(__name__)


class CdekSuggestCitiesView(APIView):
    """GET ?q=ив — список городов из API СДЭК (нужны включённый СДЭК и учётные данные)."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        q = (request.GET.get("q") or "").strip()
        if len(q) < 2:
            return Response({"results": []})
        if len(q) > 120:
            return Response({"detail": "Слишком длинный запрос"}, status=400)

        site = SiteSettings.get_solo()
        if not site.cdek_enabled:
            return Response({"detail": "Доставка СДЭК отключена"}, status=400)

        try:
            results = search_cdek_cities(site, q)
        except CdekAuthError as e:
            logger.warning("CDEK suggest cities auth: %s", e)
            return Response({"detail": str(e)}, status=502)
        except Exception as e:
            logger.exception("CDEK suggest cities failed")
            return Response({"detail": str(e)}, status=502)

        return Response({"results": results})
