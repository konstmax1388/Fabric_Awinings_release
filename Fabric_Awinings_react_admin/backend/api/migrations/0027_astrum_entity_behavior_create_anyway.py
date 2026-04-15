# Каждый заказ с сайта — отдельная сделка в Б24 (Astrum entity_behavior).

from django.db import migrations, models


def upgrade_add_to_existing_to_create_anyway(apps, schema_editor):
    SiteSettings = apps.get_model("api", "SiteSettings")
    SiteSettings.objects.filter(astrum_crm_entity_behavior="ADD_TO_EXISTING").update(
        astrum_crm_entity_behavior="CREATE_ANYWAY"
    )


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0026_sitesettings_bitrix24_catalog"),
    ]

    operations = [
        migrations.AlterField(
            model_name="sitesettings",
            name="astrum_crm_entity_behavior",
            field=models.CharField(
                choices=[
                    ("ADD_TO_EXISTING", "Добавлять к активной сделке/лиду"),
                    ("CREATE_ANYWAY", "Всегда новая сделка/лид"),
                    ("IGNORE_EXISTING", "Не создавать, если уже есть активная"),
                ],
                default="CREATE_ANYWAY",
                help_text="Для интернет-магазина обычно «Всегда новая сделка» — каждый заказ с сайта отдельная сделка в Б24.",
                max_length=32,
                verbose_name="Поведение со сделкой/лидом",
            ),
        ),
        migrations.RunPython(upgrade_add_to_existing_to_create_anyway, migrations.RunPython.noop),
    ]
