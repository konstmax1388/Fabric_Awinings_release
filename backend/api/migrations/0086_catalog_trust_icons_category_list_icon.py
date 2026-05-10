# Icons: catalog trust strip (site settings) + list row icon (product category).
# Идемпотентно для MySQL: если предыдущий прогон добавил только list_icon и упал на SiteSettings.

import django.core.validators
from django.db import migrations, models


def _home_icon_validator():
    return django.core.validators.FileExtensionValidator(
        allowed_extensions=["svg", "png", "webp", "jpg", "jpeg", "gif"]
    )


def _column_exists(schema_editor, table: str, column: str) -> bool:
    conn = schema_editor.connection
    if conn.vendor == "mysql":
        with conn.cursor() as cursor:
            cursor.execute(
                (
                    "SELECT 1 FROM information_schema.COLUMNS "
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s LIMIT 1"
                ),
                [table, column],
            )
            return cursor.fetchone() is not None
    if conn.vendor == "sqlite":
        with conn.cursor() as cursor:
            cursor.execute(f'PRAGMA table_info("{table}")')
            return column in {row[1] for row in cursor.fetchall()}
    return False


def _apply_catalog_icon_columns(apps, schema_editor) -> None:
    ProductCategory = apps.get_model("api", "ProductCategory")
    SiteSettings = apps.get_model("api", "SiteSettings")
    pc_table = ProductCategory._meta.db_table
    ss_table = SiteSettings._meta.db_table

    if not _column_exists(schema_editor, pc_table, "list_icon"):
        list_icon = models.FileField(
            upload_to="categories/list-icons/%Y/%m/",
            max_length=96,
            null=True,
            blank=True,
            validators=[_home_icon_validator()],
        )
        list_icon.set_attributes_from_name("list_icon")
        schema_editor.add_field(ProductCategory, list_icon)

    if not _column_exists(schema_editor, ss_table, "catalog_trust_return_icon"):
        ret_field = models.FileField(
            upload_to="catalog/trust-icons/%Y/%m/",
            max_length=64,
            null=True,
            blank=True,
            validators=[_home_icon_validator()],
        )
        ret_field.set_attributes_from_name("catalog_trust_return_icon")
        schema_editor.add_field(SiteSettings, ret_field)

    if not _column_exists(schema_editor, ss_table, "catalog_trust_warranty_icon"):
        war_field = models.FileField(
            upload_to="catalog/trust-icons/%Y/%m/",
            max_length=64,
            null=True,
            blank=True,
            validators=[_home_icon_validator()],
        )
        war_field.set_attributes_from_name("catalog_trust_warranty_icon")
        schema_editor.add_field(SiteSettings, war_field)


def _noop_reverse(apps, schema_editor) -> None:  # pragma: no cover
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0085_catalog_slug_redirect_and_seo_catalog_meta"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name="productcategory",
                    name="list_icon",
                    field=models.FileField(
                        blank=True,
                        help_text=(
                            "Слева от названия на главной (под фото категории). "
                            "PNG, WebP, JPEG, GIF или SVG. Если пусто — символ по умолчанию на сайте."
                        ),
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
                        help_text=(
                            "Полоска гарантия/возврат на витрине. PNG, WebP, JPEG, GIF или SVG. "
                            "Пусто — встроенная иконка. "
                            "Короткое имя файла (путь в БД до 64 символов — лимит MySQL для широкой строки настроек)."
                        ),
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
                        help_text=(
                            "Полоска гарантия/возврат на витрине. PNG, WebP, JPEG, GIF или SVG. "
                            "Пусто — встроенная иконка. "
                            "Короткое имя файла (путь в БД до 64 символов — лимит MySQL для широкой строки настроек)."
                        ),
                        max_length=64,
                        null=True,
                        upload_to="catalog/trust-icons/%Y/%m/",
                        validators=[_home_icon_validator()],
                        verbose_name="Каталог: иконка «Гарантия» в карточке товара",
                    ),
                ),
            ],
            database_operations=[
                migrations.RunPython(_apply_catalog_icon_columns, _noop_reverse),
            ],
        ),
    ]
