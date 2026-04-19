"""Прокси подсказок адреса (Яндекс Suggest) с сервера: из браузера в suggest-maps часто 403/CORS с тем же ключом."""

from __future__ import annotations

import logging
import os
import urllib.parse

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import SiteSettings
from api.services.http_util import HttpJsonError, get_json

logger = logging.getLogger(__name__)

YANDEX_SUGGEST = "https://suggest-maps.yandex.ru/v1/suggest"


def _format_label(row: dict) -> str:
    t = row.get("title")
    ttext = ""
    if isinstance(t, dict) and t.get("text"):
        ttext = str(t["text"]).strip()
    st = row.get("subtitle")
    stext = ""
    if isinstance(st, dict) and st.get("text"):
        stext = str(st["text"]).strip()
    if ttext and stext:
        return f"{ttext}, {stext}"
    return ttext or stext


class CdekYandexAddressSuggestView(APIView):
    """GET ?q=...&city=... — тот же ответ, что Suggest, но { suggestions: [ { label } ] } и без CORS с витрины."""

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request):
        site = SiteSettings.get_solo()
        if not site.cdek_enabled:
            return Response({"suggestions": [], "detail": "СДЭК отключён"}, status=400)
        key = (site.cdek_yandex_map_api_key or os.environ.get("YANDEX_MAPS_API_KEY") or "").strip()
        if not key:
            return Response({"suggestions": []})

        q = (request.GET.get("q") or "").strip()
        if len(q) < 3:
            return Response({"suggestions": []})
        if len(q) > 200:
            return Response({"suggestions": [], "detail": "Слишком длинный запрос"}, status=400)

        city = (request.GET.get("city") or "").strip()
        text = f"{city}, {q}" if city else q
        spn = "&spn=0.35,0.35" if city else ""
        q_text = urllib.parse.urlencode(
            {
                "apikey": key,
                "text": text,
                "types": "geo",
                "lang": "ru_RU",
                "results": "8",
            }
        )
        url = f"{YANDEX_SUGGEST}?{q_text}{spn}"

        try:
            data = get_json(url, timeout=8.0)
        except HttpJsonError as e:
            logger.warning("Yandex address suggest: %s", e)
            return Response({"suggestions": []})
        except Exception as e:
            logger.exception("Yandex address suggest failed: %s", e)
            return Response({"suggestions": []})

        if not isinstance(data, dict):
            return Response({"suggestions": []})

        out: list[dict[str, str]] = []
        for row in data.get("results") or []:
            if not isinstance(row, dict):
                continue
            label = _format_label(row)
            if label:
                out.append({"label": label})
        return Response({"suggestions": out})
