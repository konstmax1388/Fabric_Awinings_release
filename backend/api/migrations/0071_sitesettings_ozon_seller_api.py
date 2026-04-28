# Generated manually for Ozon Seller API keys in admin (остатки перед createOrder).

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0070_about_spotlight_gallery_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="ozon_seller_client_id",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Из кабинета seller.ozon.ru (Seller API). Env: OZON_SELLER_CLIENT_ID.",
                max_length=256,
                verbose_name="Ozon Seller API: Client-Id",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="ozon_seller_api_key",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Секретный ключ API (заголовок Api-Key). Env: OZON_SELLER_API_KEY.",
                max_length=512,
                verbose_name="Ozon Seller API: Api-Key",
            ),
        ),
    ]
