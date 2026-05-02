from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin

from .models import OzonLogisticsSettings


@admin.register(OzonLogisticsSettings)
class OzonLogisticsSettingsAdmin(ModelAdmin):
    """Одна запись: ключи частного приложения Seller API для Ozon Доставка."""

    list_display = (
        "__str__",
        "client_id_masked",
        "has_api_key",
        "seller_delivery_api_enabled",
        "order_create_only_internal_phones",
    )
    fieldsets = (
        (
            _("Ключи Seller API (частное приложение «Ozon Доставка»)"),
            {
                "fields": ("client_id", "api_key", "seller_api_base_url"),
                "description": _(
                    "Отдельные ключи от «Ozon Seller API (логистика)» в настройках сайта и от Ozon Pay. "
                    "Уровни в Ozon: seller-api.ozon-logistics и связанные (см. инструкцию подключения). "
                    "Приоритет у переменных окружения OZON_LOGISTICS_SELLER_CLIENT_ID и OZON_LOGISTICS_SELLER_API_KEY."
                ),
            },
        ),
        (
            _("Переключение потока и безопасность заказов в Ozon"),
            {
                "fields": (
                    "seller_delivery_api_enabled",
                    "order_create_only_internal_phones",
                    "internal_phones_allowlist",
                ),
                "description": _(
                    "Новый поток (Seller API доставки) можно включать по готовности кода; старый checkout в «api» остаётся. "
                    "Ограничение по телефонам — чтобы на проде не создать реальный заказ в Ozon до завершения тестов."
                ),
            },
        ),
        (_("Заметки"), {"fields": ("internal_notes",)}),
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description=_("Client-Id"))
    def client_id_masked(self, obj: OzonLogisticsSettings):
        s = (obj.client_id or "").strip()
        if len(s) <= 6:
            return "—" if not s else "***"
        return s[:4] + "…" + s[-2:]

    @admin.display(description=_("Api-Key"), boolean=True)
    def has_api_key(self, obj: OzonLogisticsSettings):
        return bool((obj.api_key or "").strip())

    def changelist_view(self, request, extra_context=None):
        return redirect(reverse("admin:ozon_logistics_ozonlogisticssettings_change", args=(1,)))
