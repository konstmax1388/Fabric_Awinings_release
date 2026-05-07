"""301 со старых URL каталога (wb-r… и др.) на текущий ЧПУ-слаг товара."""

from __future__ import annotations

from django.http import HttpResponsePermanentRedirect

from api.models import CatalogProductSlugRedirect


class LegacyCatalogProductRedirectMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method in ("GET", "HEAD"):
            path = (request.path or "/").rstrip("/")
            parts = [p for p in path.split("/") if p]
            if len(parts) == 2 and parts[0] == "catalog":
                slug = parts[1]
                row = (
                    CatalogProductSlugRedirect.objects.select_related("product", "product__category")
                    .filter(old_slug=slug)
                    .first()
                )
                if row and row.product.is_published and row.product.category.is_published:
                    target = request.build_absolute_uri(f"/catalog/{row.product.slug}/")
                    return HttpResponsePermanentRedirect(target)
        return self.get_response(request)
