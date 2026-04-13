"""Повторная отправка заказов в Astrum CRM после ошибки (см. docs/astrum-bitrix-crm.md)."""

from django.core.management.base import BaseCommand

from api.models import CartOrder
from api.services.astrum_crm import astrum_crm_enabled, push_cart_order_to_astrum_crm


class Command(BaseCommand):
    help = "Повторить отправку в Astrum CRM для заказов со статусом ошибки синхронизации."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=50,
            help="Максимум заказов за один запуск (по умолчанию 50).",
        )

    def handle(self, *args, **options):
        if not astrum_crm_enabled():
            self.stderr.write(
                "Интеграция выключена: задайте ASTRUM_CRM_API_KEY и ASTRUM_CRM_ASSIGNED_DEFAULT."
            )
            return

        limit = max(1, int(options["limit"]))
        qs = (
            CartOrder.objects.filter(bitrix_sync_status=CartOrder.BitrixSyncStatus.ERROR)
            .order_by("-created_at")[:limit]
        )
        n = 0
        for order in qs:
            push_cart_order_to_astrum_crm(order)
            n += 1
        self.stdout.write(self.style.SUCCESS(f"Обработано заказов: {n}"))
