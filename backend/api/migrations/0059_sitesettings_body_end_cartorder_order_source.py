# Generated manually for order source + body end widget

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0058_homepage_hero_slide_filefield"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="body_end_snippet",
            field=models.TextField(
                blank=True,
                default="",
                help_text="HTML/JS, в конец <body> на витрине (например, код кнопки с сайта Битрикс24).",
                verbose_name="Сниппет перед </body> (виджет CRM, онлайн-чат)",
            ),
        ),
        migrations.AddField(
            model_name="cartorder",
            name="order_source",
            field=models.CharField(
                choices=[("checkout", "Оформление (корзина)"), ("one_click", "Заказ в 1 клик")],
                db_index=True,
                default="checkout",
                max_length=20,
                verbose_name="Источник заказа",
            ),
        ),
    ]
