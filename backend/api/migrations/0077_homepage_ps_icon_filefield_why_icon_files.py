# Generated manually for SVG-capable home block icons.

import django.core.validators
from django.db import migrations, models


def _home_icon_validator():
    return django.core.validators.FileExtensionValidator(
        allowed_extensions=["svg", "png", "webp", "jpg", "jpeg", "gif"]
    )


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0076_promotion_stack_with_others"),
    ]

    operations = [
        migrations.AlterField(
            model_name="homepagecontent",
            name="ps0_icon_image",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="home/ps_icons/%Y/%m/",
                max_length=512,
                verbose_name="Карточка «Проблема—решение» 1: файл иконки (PNG, WebP, JPEG, GIF или SVG)",
                validators=[_home_icon_validator()],
            ),
        ),
        migrations.AlterField(
            model_name="homepagecontent",
            name="ps1_icon_image",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="home/ps_icons/%Y/%m/",
                max_length=512,
                verbose_name="Карточка «Проблема—решение» 2: файл иконки (PNG, WebP, JPEG, GIF или SVG)",
                validators=[_home_icon_validator()],
            ),
        ),
        migrations.AlterField(
            model_name="homepagecontent",
            name="ps2_icon_image",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="home/ps_icons/%Y/%m/",
                max_length=512,
                verbose_name="Карточка «Проблема—решение» 3: файл иконки (PNG, WebP, JPEG, GIF или SVG)",
                validators=[_home_icon_validator()],
            ),
        ),
        migrations.AlterField(
            model_name="homepagecontent",
            name="ps3_icon_image",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="home/ps_icons/%Y/%m/",
                max_length=512,
                verbose_name="Карточка «Проблема—решение» 4: файл иконки (PNG, WebP, JPEG, GIF или SVG)",
                validators=[_home_icon_validator()],
            ),
        ),
        migrations.AddField(
            model_name="homepagecontent",
            name="why_c0_icon_file",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="home/why_icons/%Y/%m/",
                max_length=512,
                verbose_name="«Почему мы», колонка 1: файл иконки (PNG, WebP, JPEG, GIF или SVG)",
                validators=[_home_icon_validator()],
            ),
        ),
        migrations.AddField(
            model_name="homepagecontent",
            name="why_c1_icon_file",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="home/why_icons/%Y/%m/",
                max_length=512,
                verbose_name="«Почему мы», колонка 2: файл иконки (PNG, WebP, JPEG, GIF или SVG)",
                validators=[_home_icon_validator()],
            ),
        ),
        migrations.AddField(
            model_name="homepagecontent",
            name="why_c2_icon_file",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="home/why_icons/%Y/%m/",
                max_length=512,
                verbose_name="«Почему мы», колонка 3: файл иконки (PNG, WebP, JPEG, GIF или SVG)",
                validators=[_home_icon_validator()],
            ),
        ),
        migrations.AddField(
            model_name="homepagecontent",
            name="why_c3_icon_file",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="home/why_icons/%Y/%m/",
                max_length=512,
                verbose_name="«Почему мы», колонка 4: файл иконки (PNG, WebP, JPEG, GIF или SVG)",
                validators=[_home_icon_validator()],
            ),
        ),
    ]
