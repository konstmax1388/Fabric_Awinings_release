# Icons: catalog trust strip (site settings) + list row icon (product category).

import django.core.validators
from django.db import migrations, models


def _home_icon_validator():
    return django.core.validators.FileExtensionValidator(
        allowed_extensions=["svg", "png", "webp", "jpg", "jpeg", "gif"]
    )


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0085_catalog_slug_redirect_and_seo_catalog_meta"),
    ]

    operations = [
        migrations.AddField(
            model_name="productcategory",
            name="list_icon",
            field=models.FileField(
                blank=True,
                help_text="Слева от названия на главной (под фото категории). PNG, WebP, JPEG, GIF или SVG. Если пусто — символ по умолчанию на сайте.",
                max_length=96,
                null=True,
                upload_to="categories/list-icons/%Y/%m/",
                validators=[_home_icon_validator()],
                verbose_name="Иконка в блоке «Виды тентов»",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="catalog_trust_return_icon",
            field=models.FileField(
                blank=True,
                help_text="Полоска гарантия/возврат на витрине. PNG, WebP, JPEG, GIF или SVG. Пусто — встроенная иконка. "
                "Короткое имя файла (путь в БД до 64 символов — лимит MySQL для широкой строки настроек).",
                max_length=64,
                null=True,
                upload_to="catalog/trust-icons/%Y/%m/",
                validators=[_home_icon_validator()],
                verbose_name="Каталог: иконка «Возврат» в карточке товара",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="catalog_trust_warranty_icon",
            field=models.FileField(
                blank=True,
                help_text="Полоска гарантия/возврат на витрине. PNG, WebP, JPEG, GIF или SVG. Пусто — встроенная иконка. "
                "Короткое имя файла (путь в БД до 64 символов — лимит MySQL для широкой строки настроек).",
                max_length=64,
                null=True,
                upload_to="catalog/trust-icons/%Y/%m/",
                validators=[_home_icon_validator()],
                verbose_name="Каталог: иконка «Гарантия» в карточке товара",
            ),
        ),
    ]
