"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from api.views_storefront_shell import storefront_shell_view

from api.views_seo import robots_txt_view, sitemap_xml_view

from config.admin_captcha import apply_admin_login_form

apply_admin_login_form()

urlpatterns = [
    path("captcha/", include("captcha.urls")),
]

if getattr(settings, "DJANGO_ADMIN_ENABLED", True):
    # Без завершающего «/» путь не попадает в admin.site.urls, а ловится catch-all
    # витрины → 404 HTML «Страница не найдена». Редирект как у стандартного APPEND_SLASH.
    urlpatterns.append(
        path("admin", RedirectView.as_view(url="/admin/", permanent=True)),
    )
    urlpatterns.append(path("admin/", admin.site.urls))

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

urlpatterns.append(
    re_path(r"^(?P<_path>.*)\Z", storefront_shell_view, name="storefront-shell"),
)

