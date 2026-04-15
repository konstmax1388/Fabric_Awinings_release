"""
URL configuration for config project.

Когда DJANGO_ADMIN_ENABLED=False, маршрут admin/ в Django не регистрируется:
панель менеджеров — отдельный SPA (admin-ui) под префиксом /staff/ на Vite/nginx; Django Admin при включении — на /admin/.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from api.views_seo import robots_txt_view, sitemap_xml_view

from config.admin_captcha import apply_admin_login_form

apply_admin_login_form()

urlpatterns = [
    path("captcha/", include("captcha.urls")),
]

if getattr(settings, "DJANGO_ADMIN_ENABLED", True):
    urlpatterns.append(path("admin/", admin.site.urls))
elif getattr(settings, "DJANGO_ADMIN_REDIRECT_URL", None):
    urlpatterns.append(
        re_path(
            r"^admin/.*$",
            RedirectView.as_view(
                url=settings.DJANGO_ADMIN_REDIRECT_URL,
                permanent=False,
            ),
        )
    )

urlpatterns += [
    path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path(
        "api/schema/swagger/",
        SpectacularSwaggerView.as_view(url_name="api-schema"),
        name="api-schema-swagger",
    ),
    path("api/", include("api.urls")),
    path("sitemap.xml", sitemap_xml_view, name="sitemap"),
    path("robots.txt", robots_txt_view, name="robots"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
