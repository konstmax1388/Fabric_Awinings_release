# Bitrix24 REST catalog fields on SiteSettings (admin + sync_bitrix_catalog_ids)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0025_product_bitrix_xml_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="bitrix24_webhook_base",
            field=models.CharField(
                blank=True,
                default="",
                help_text="До секрета включительно, без завершающего слэша, например https://портал.bitrix24.ru/rest/1/код. Права вебхука: «Каталог». Используется командой sync_bitrix_catalog_ids. Пусто — переменная BITRIX24_WEBHOOK_BASE в .env.",
                max_length=512,
                verbose_name="База URL входящего вебхука REST (каталог Б24)",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="bitrix24_catalog_product_iblock_id",
            field=models.PositiveIntegerField(
                blank=True,
                help_text="Пусто — BITRIX24_CATALOG_PRODUCT_IBLOCK_ID из .env.",
                null=True,
                verbose_name="ID инфоблока товаров (catalog.product.list)",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="bitrix24_catalog_offer_iblock_id",
            field=models.PositiveIntegerField(
                blank=True,
                help_text="Пусто — BITRIX24_CATALOG_OFFER_IBLOCK_ID из .env.",
                null=True,
                verbose_name="ID инфоблока торговых предложений (catalog.product.offer.list)",
            ),
        ),
    ]
