# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0010_sitesettings_contacts_page"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="show_calculator",
            field=models.BooleanField(
                default=True,
                verbose_name="Показывать калькулятор на главной",
            ),
        ),
    ]
