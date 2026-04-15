import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="cartorder",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="cart_orders",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Покупатель (аккаунт)",
            ),
        ),
        migrations.AddField(
            model_name="cartorder",
            name="fulfillment_status",
            field=models.CharField(
                choices=[
                    ("received", "Принят с сайта"),
                    ("awaiting_payment", "Ожидает оплаты"),
                    ("paid", "Оплачен"),
                    ("processing", "В обработке"),
                    ("shipped", "Отправлен"),
                    ("delivered", "Доставлен"),
                    ("cancelled", "Отменён"),
                ],
                db_index=True,
                default="received",
                max_length=32,
                verbose_name="Статус выполнения",
            ),
        ),
        migrations.AddField(
            model_name="cartorder",
            name="payment_status",
            field=models.CharField(
                choices=[
                    ("not_required", "Оплата не требовалась"),
                    ("pending", "Ожидает оплаты"),
                    ("authorized", "Предавторизация"),
                    ("captured", "Оплачен"),
                    ("failed", "Ошибка оплаты"),
                    ("refunded", "Возврат"),
                ],
                db_index=True,
                default="not_required",
                max_length=32,
                verbose_name="Оплата",
            ),
        ),
        migrations.AddField(
            model_name="cartorder",
            name="payment_provider",
            field=models.CharField(blank=True, max_length=64, verbose_name="Платёжный провайдер"),
        ),
        migrations.AddField(
            model_name="cartorder",
            name="payment_external_id",
            field=models.CharField(blank=True, max_length=128, verbose_name="ID платежа у провайдера"),
        ),
        migrations.AddField(
            model_name="cartorder",
            name="bitrix_entity_id",
            field=models.CharField(
                blank=True,
                db_index=True,
                max_length=128,
                verbose_name="ID в Битрикс24 (сделка/заказ)",
            ),
        ),
        migrations.AddField(
            model_name="cartorder",
            name="bitrix_sync_status",
            field=models.CharField(
                choices=[
                    ("not_sent", "Не отправляли в Б24"),
                    ("pending", "Очередь / повтор"),
                    ("synced", "В Битрикс24"),
                    ("error", "Ошибка синхронизации"),
                ],
                db_index=True,
                default="not_sent",
                max_length=16,
                verbose_name="Синхронизация Б24",
            ),
        ),
        migrations.AddField(
            model_name="cartorder",
            name="bitrix_sync_error",
            field=models.TextField(blank=True, verbose_name="Ошибка синхронизации Б24"),
        ),
        migrations.AddField(
            model_name="cartorder",
            name="bitrix_sync_attempts",
            field=models.PositiveSmallIntegerField(default=0, verbose_name="Попыток отправки в Б24"),
        ),
        migrations.AddField(
            model_name="cartorder",
            name="delivery_provider",
            field=models.CharField(blank=True, max_length=32, verbose_name="Доставка (код)"),
        ),
        migrations.AddField(
            model_name="cartorder",
            name="delivery_snapshot",
            field=models.JSONField(blank=True, default=dict, verbose_name="Снимок доставки (ПВЗ, тариф)"),
        ),
        migrations.AddField(
            model_name="cartorder",
            name="cdek_tracking",
            field=models.CharField(blank=True, max_length=64, verbose_name="Трек СДЭК"),
        ),
    ]
