from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0033_product_ozon_sku"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="cdek_yandex_map_api_key",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Ключ JavaScript API Яндекс.Карт (виджет СДЭК v3). В кабинете разработчика Яндекса задайте HTTP Referrer вашего сайта.",
                max_length=128,
                verbose_name="СДЭК: ключ API Яндекс.Карт (виджет)",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="cdek_widget_sender_city",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Город или адрес отправления для виджета (параметр from). Пусто — первая часть адреса самовывоза до запятой, иначе «Москва».",
                max_length=200,
                verbose_name="СДЭК: город отправления (виджет)",
            ),
        ),
    ]
