# Generated manually for about page manufacturer media uploads.

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0065_staticpage_about_payload_help_text"),
    ]

    operations = [
        migrations.AddField(
            model_name="staticpage",
            name="about_manufacturer_image",
            field=models.ImageField(
                blank=True,
                help_text="Слева от текста «Мы производитель». Если задано — подменяет внешний URL фото из макета.",
                null=True,
                upload_to="static_pages/about_mnf/%Y/%m/",
                verbose_name="Производитель: фото (файл)",
                max_length=512,
            ),
        ),
        migrations.AddField(
            model_name="staticpage",
            name="about_manufacturer_video",
            field=models.FileField(
                blank=True,
                help_text="Слева от текста. MP4/WebM; на сайте встроенное видео. Если задано — подменяет ссылку на видео из макета.",
                null=True,
                upload_to="static_pages/about_mnf/%Y/%m/",
                validators=[django.core.validators.FileExtensionValidator(allowed_extensions=["mp4", "webm", "ogv", "ogg"])],
                verbose_name="Производитель: видео (файл)",
                max_length=512,
            ),
        ),
    ]
