from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db.models import Q

from api.models import CartOrder
from api.services.cdek_order_create import sync_cdek_order_with_retry


class Command(BaseCommand):
    help = (
        "Повторная отправка заказов в СДЭК (ошибки/ожидание): наложенный платёж (СДЭК) и онлайн после оплаты."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=50,
            help="Сколько заказов обработать за запуск (по умолчанию 50).",
        )

    def handle(self, *args, **options):
        limit = max(1, int(options.get("limit") or 50))
        qs = (
            CartOrder.objects.filter(
                delivery_method=CartOrder.DeliveryMethod.CDEK,
                cdek_sync_status__in=[
                    CartOrder.CdekSyncStatus.PENDING,
                    CartOrder.CdekSyncStatus.ERROR,
                ],
            )
            .filter(
                Q(payment_method=CartOrder.PaymentMethod.COD_CDEK)
                | Q(
                    payment_method=CartOrder.PaymentMethod.CARD_ONLINE,
                    payment_status=CartOrder.PaymentStatus.CAPTURED,
                )
            )
            .order_by("created_at")
        )
        rows = list(qs[:limit])
        ok_cnt = 0
        fail_cnt = 0
        for order in rows:
            ok, err = sync_cdek_order_with_retry(order)
            if ok:
                ok_cnt += 1
                self.stdout.write(self.style.SUCCESS(f"[OK] {order.order_ref}"))
            else:
                fail_cnt += 1
                self.stdout.write(self.style.WARNING(f"[ERR] {order.order_ref}: {err}"))
        self.stdout.write(
            self.style.NOTICE(
                f"Обработано: {len(rows)} | Успех: {ok_cnt} | Ошибки: {fail_cnt}"
            )
        )
