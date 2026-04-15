# Generated manually for Ozon Логистика (createOrder items.sku).

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0032_checkout_delivery_ozon_cdek"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="ozon_sku",
            field=models.BigIntegerField(
                blank=True,
                help_text="SKU товара в Ozon для createOrder при доставке Ozon Логистика (если у варианта пусто — берётся отсюда).",
                null=True,
                verbose_name="Ozon SKU (товар)",
            ),
        ),
        migrations.AddField(
            model_name="productvariant",
            name="ozon_sku",
            field=models.BigIntegerField(
                blank=True,
                help_text="SKU в Ozon для этого варианта; приоритет над SKU товара.",
                null=True,
                verbose_name="Ozon SKU (вариант)",
            ),
        ),
    ]
