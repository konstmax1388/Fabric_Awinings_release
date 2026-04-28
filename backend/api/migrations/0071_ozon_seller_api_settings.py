# Ключи Ozon Seller API вынесены в отдельную таблицу: на `api_sitesettings` в MySQL
# не хватает лимита строки (1118 Row size too large) при добавлении ещё полей.
# Если у вас локально применялась старая миграция `0071_sitesettings_ozon_seller_api` (два поля
# в `api_sitesettings`), удалите её из django_migrations, дропните эти колонки при
# необходимости, затем migrate — сработают 0071 и 0072.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0070_about_spotlight_gallery_image"),
    ]

    operations = [
        migrations.CreateModel(
            name="OzonSellerApiSettings",
            fields=[
                (
                    "site",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        related_name="ozon_seller_api",
                        serialize=False,
                        to="api.sitesettings",
                    ),
                ),
                (
                    "client_id",
                    models.TextField(
                        blank=True,
                        default="",
                        help_text="Кабинет seller.ozon.ru — права: Product read-only, Warehouse (или Admin read-only). "
                        "Нужен для проверки остатков перед оплатой с доставкой Ozon. Env: OZON_SELLER_CLIENT_ID.",
                        verbose_name="Ozon Seller API: Client-Id",
                    ),
                ),
                (
                    "api_key",
                    models.TextField(
                        blank=True,
                        default="",
                        help_text="Секрет API (заголовок Api-Key). Env: OZON_SELLER_API_KEY.",
                        verbose_name="Ozon Seller API: Api-Key",
                    ),
                ),
            ],
            options={
                "verbose_name": "Ozon Seller API (логистика)",
                "verbose_name_plural": "Ozon Seller API (логистика)",
            },
        ),
    ]
