# Убрать заглушку адреса из дефолта и из уже сохранённых настроек.

from django.db import migrations, models

_PLACEHOLDER = "г. Москва, производственная зона (адрес уточняется)"


def clear_placeholder(apps, schema_editor):
    SiteSettings = apps.get_model("api", "SiteSettings")
    SiteSettings.objects.filter(address=_PLACEHOLDER).update(address="")


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0011_sitesettings_show_calculator"),
    ]

    operations = [
        migrations.AlterField(
            model_name="sitesettings",
            name="address",
            field=models.CharField(
                blank=True,
                default="",
                max_length=400,
                verbose_name="Адрес (текст)",
            ),
        ),
        migrations.RunPython(clear_placeholder, migrations.RunPython.noop),
    ]
