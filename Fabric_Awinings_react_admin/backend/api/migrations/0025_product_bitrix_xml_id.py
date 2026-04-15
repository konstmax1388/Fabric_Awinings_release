# Generated manually for bitrix_xml_id on Product / ProductVariant

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0024_product_bitrix_catalog_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="bitrix_xml_id",
            field=models.CharField(
                blank=True,
                db_index=True,
                default="",
                help_text="Для массового сопоставления с каталогом: тот же XML_ID, что в Битрикс24 (команда sync_bitrix_catalog_ids).",
                max_length=191,
                verbose_name="Внешний код в Б24 (XML_ID)",
            ),
        ),
        migrations.AddField(
            model_name="productvariant",
            name="bitrix_xml_id",
            field=models.CharField(
                blank=True,
                db_index=True,
                default="",
                help_text="Сопоставление с торговым предложением в Б24; иначе можно использовать артикул WB (см. команду sync_bitrix_catalog_ids).",
                max_length=191,
                verbose_name="Внешний код в Б24 (XML_ID), вариант",
            ),
        ),
    ]
