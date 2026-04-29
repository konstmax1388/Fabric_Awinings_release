# Добавлены поля блокировки приёма заказов с витрины (режим подготовки).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0072_ozon_seller_legacy_sitesettings_columns"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="checkout_orders_blocked",
            field=models.BooleanField(
                default=False,
                help_text="Если включено: на сайте показывается предупреждение, оформление заказа и «купить в 1 клик» недоступны; API создания заказов отклоняет заявки с тем же текстом (пустое поле сообщения ниже — подставится текст по умолчанию).",
                verbose_name="Витрина: не принимать заказы (режим подготовки)",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="checkout_orders_blocked_message",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Показывается в шапке и на шагах оформления. Пусто — стандартное сообщение о том, что сайт в подготовке и заказы не принимаются.",
                verbose_name="Текст предупреждения (необязательно)",
            ),
        ),
    ]
