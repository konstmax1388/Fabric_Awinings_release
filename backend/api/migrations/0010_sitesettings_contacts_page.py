# Generated manually for contacts page fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0009_site_branding_and_home_content"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="contacts_page_title",
            field=models.CharField(
                default="Контакты",
                max_length=120,
                verbose_name="Страница «Контакты»: заголовок (H1)",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="contacts_intro",
            field=models.TextField(
                blank=True,
                help_text="Необязательно. Показывается под заголовком, до реквизитов и списка контактов.",
                verbose_name="Страница «Контакты»: вводный текст",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="contacts_hours",
            field=models.CharField(
                blank=True,
                default="Пн–Пт 9:00–18:00",
                max_length=200,
                verbose_name="Страница «Контакты»: режим работы",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="contacts_meta_description",
            field=models.CharField(
                blank=True,
                help_text="Пусто — на сайте подставится краткое описание из адреса.",
                max_length=500,
                verbose_name="Страница «Контакты»: описание для SEO (meta description)",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="contacts_back_link_label",
            field=models.CharField(
                blank=True,
                default="← На главную",
                max_length=120,
                verbose_name="Страница «Контакты»: текст ссылки «назад на главную»",
            ),
        ),
    ]
