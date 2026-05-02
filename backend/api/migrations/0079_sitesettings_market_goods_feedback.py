# Generated manually.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0078_review_product_photo_file"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="market_goods_feedback_enabled",
            field=models.BooleanField(
                default=False,
                help_text="Если включено и заданы businessId и переменная окружения YANDEX_MARKET_PARTNER_API_KEY, на /reviews подгружаются отзывы через POST /v2/businesses/{id}/goods-feedback.",
                verbose_name="Маркет: отзывы о товарах на сайте (Partner API)",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="market_goods_feedback_business_id",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Числовой идентификатор кабинета в Partner API (см. GET /v2/campaigns в документации). Не путать с произвольным числом из URL витрины — сверьте в кабинете продавца.",
                max_length=32,
                verbose_name="Маркет: businessId (идентификатор кабинета)",
            ),
        ),
    ]
