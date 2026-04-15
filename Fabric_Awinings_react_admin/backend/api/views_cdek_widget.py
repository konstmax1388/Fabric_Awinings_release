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
        site = SiteSettings.get_solo()
        merged = merge_cdek_widget_payload(request)
        status, body = run_cdek_widget_proxy(site, merged)
        resp = JsonResponse(body, status=status, safe=False)
        if status == 200:
            resp["X-Service-Version"] = "3.11.1"
        return resp
