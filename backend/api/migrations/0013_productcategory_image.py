# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0012_clear_placeholder_address"),
    ]

    operations = [
        migrations.AddField(
            model_name="productcategory",
            name="image",
            field=models.ImageField(
                blank=True,
                help_text="Карточка «Виды тентов» на главной и боковое меню каталога. Рекомендуется горизонтальное фото.",
                max_length=512,
                null=True,
                upload_to="categories/%Y/%m/",
                verbose_name="Фото для витрины",
            ),
        ),
    ]
