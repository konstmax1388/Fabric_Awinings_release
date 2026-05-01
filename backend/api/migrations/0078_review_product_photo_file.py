# Generated manually.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0077_homepage_ps_icon_filefield_why_icon_files"),
    ]

    operations = [
        migrations.AddField(
            model_name="review",
            name="product_photo_file",
            field=models.ImageField(
                blank=True,
                help_text="Необязательно: скрин или фото позиции из заказа (как на маркетплейсе).",
                null=True,
                upload_to="reviews/products/%Y/%m/",
                max_length=512,
                verbose_name="Фото товара (к заказу)",
            ),
        ),
    ]
