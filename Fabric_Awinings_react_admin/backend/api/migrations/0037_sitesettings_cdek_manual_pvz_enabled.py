# Generated manually: toggle manual PVZ input on checkout.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0036_sitesettings_map_iframe_help_text"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="cdek_manual_pvz_enabled",
            field=models.BooleanField(
                default=True,
                help_text="Если выключено, на витрине покупатель сможет выбрать ПВЗ только через виджет (без ручного кода).",
                verbose_name="СДЭК: разрешить ручной ввод ПВЗ",
            ),
        ),
    ]
