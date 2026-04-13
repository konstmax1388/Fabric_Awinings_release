# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0013_productcategory_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="show_social_links",
            field=models.BooleanField(
                default=False,
                help_text="Если выключено, раздел «Соцсети» в подвале не отображается (ссылки можно заранее заполнить).",
                verbose_name="Показывать блок соцсетей на сайте",
            ),
        ),
    ]
