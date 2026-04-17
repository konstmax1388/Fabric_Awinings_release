from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0040_latinize_slugs"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="material_map",
            field=models.JSONField(
                blank=True,
                default=dict,
                verbose_name="Карта материалов",
            ),
        ),
    ]
