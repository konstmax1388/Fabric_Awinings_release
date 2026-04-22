import time

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from api.models import SiteSettings
from api.services.cdek_widget_service import merge_cdek_widget_payload, run_cdek_widget_proxy


@method_decorator(csrf_exempt, name="dispatch")
class CdekWidgetServiceView(View):
    """Публичный endpoint для виджета СДЭК v3 (servicePath). Без сессии; CORS — из django-cors-headers."""

    def get(self, request, *args, **kwargs):
        return self._handle(request)

    def post(self, request, *args, **kwargs):
        return self._handle(request)

    def _handle(self, request):
        if self._is_rate_limited(request):
            return JsonResponse({"detail": "Слишком много запросов. Повторите позже."}, status=429)
        site = SiteSettings.get_solo()
        merged = merge_cdek_widget_payload(request)
        status, body = run_cdek_widget_proxy(site, merged)
        resp = JsonResponse(body, status=status, safe=False)
        if status == 200:
            resp["X-Service-Version"] = "3.11.1"
        return resp

    def _is_rate_limited(self, request) -> bool:
        limit = int(getattr(settings, "CDEK_WIDGET_SERVICE_RATE_LIMIT", 60))
        window = int(getattr(settings, "CDEK_WIDGET_SERVICE_RATE_WINDOW_SEC", 60))
        if limit <= 0 or window <= 0:
            return False
        ip = (request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0] or request.META.get("REMOTE_ADDR") or "").strip()
        if not ip:
            return False
        now = int(time.time())
        bucket = now // window
        key = f"cdek_widget_rl:{ip}:{bucket}"
        current = cache.get(key, 0)
        if current >= limit:
            return True
        cache.set(key, current + 1, timeout=window + 5)
        return False
