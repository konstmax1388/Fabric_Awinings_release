from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class OzonLogisticsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ozon_logistics"
    verbose_name = _("Ozon Доставка (Seller API)")
