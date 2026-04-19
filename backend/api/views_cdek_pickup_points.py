"""Список ПВЗ СДЭК по коду города (для витрины без виджета Яндекса)."""

from __future__ import annotations

import logging
from typing import Any

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import SiteSettings
from api.services.cdek_widget_service import run_cdek_widget_proxy

logger = logging.getLogger(__name__)


def _simplify_point(p: dict[str, Any]) -> dict[str, str] | None:
    if not isinstance(p, dict):
        return None
    code = p.get("code")
    if code is None or code == "":
        return None
    name = (p.get("name") or "")[:400]
    loc = p.get("location") if isinstance(p.get("location"), dict) else {}
    addr = ""
    if loc:
        addr = (str(loc.get("address_full") or "").strip()) or (str(loc.get("address") or "").strip())
    if not addr:
        addr = str(p.get("address_comment") or "").strip()
    return {"code": str(code), "name": name, "address": addr[:800]}


class CdekPickupPointsView(APIView):
    """GET ?city_code=123 — пункты выдачи (тип PVZ) через тот же прокси, что и виджет."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        site = SiteSettings.get_solo()
        if not site.cdek_enabled:
            return Response({"detail": "СДЭК отключён в настройках сайта."}, status=400)

        raw = (request.GET.get("city_code") or "").strip()
        if not raw.isdigit():
            return Response({"detail": "Укажите city_code (числовой код города СДЭК)."}, status=400)
        city_code = int(raw)

        merged: dict[str, Any] = {"action": "offices", "city_code": city_code, "type": "PVZ"}
        status, body = run_cdek_widget_proxy(site, merged)
        if status != 200:
            if isinstance(body, dict):
                return Response(body, status=status)
            return Response({"detail": str(body)}, status=status)

        if not isinstance(body, list):
            logger.warning("CDEK pickup points: unexpected body type: %s", type(body))
            return Response({"detail": "Неожиданный ответ API СДЭК."}, status=502)

        points: list[dict[str, str]] = []
        for row in body:
            if not isinstance(row, dict):
                continue
            sp = _simplify_point(row)
            if sp:
                points.append(sp)

        return Response({"points": points})
