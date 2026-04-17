from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0041_product_material_map"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="material_map_image",
            field=models.ImageField(
                blank=True,
                help_text="Фоновая схема для блока «Карта материалов» в карточке товара.",
                max_length=512,
                null=True,
                upload_to="products/material-map/%Y/%m/",
                verbose_name="Карта материалов (фон)",
            ),
        ),
    ]
