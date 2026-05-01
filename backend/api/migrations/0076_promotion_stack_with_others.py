from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0075_header_nav_promotions_after_catalog"),
    ]

    operations = [
        migrations.AddField(
            model_name="promotion",
            name="stack_with_others",
            field=models.BooleanField(
                default=False,
                verbose_name="Суммировать с другими акциями",
                help_text="Если включено, процент этой акции складывается с другими такими же акциями на товар. "
                "Если выключено — для товара берётся максимум среди «несуммируемых» акций, затем к нему добавляются все «суммируемые».",
            ),
        ),
    ]
