# Generated manually for map block on storefront (SiteSettings).

from django.db import migrations, models


def copy_map_from_home_payload(apps, schema_editor):
    SiteSettings = apps.get_model("api", "SiteSettings")
    HomePageContent = apps.get_model("api", "HomePageContent")
    ss = SiteSettings.objects.filter(pk=1).first()
    hc = HomePageContent.objects.filter(pk=1).first()
    if not ss or not hc:
        return
    payload = hc.payload if isinstance(hc.payload, dict) else {}
    mf = payload.get("mapForm") or {}
    if not isinstance(mf, dict):
        return

    def set_if_empty(attr: str, val):
        cur = getattr(ss, attr, "") or ""
        if cur.strip():
            return
        if isinstance(val, str) and val.strip():
            setattr(ss, attr, val.strip())

    set_if_empty("map_heading", mf.get("heading"))
    set_if_empty("map_subheading", mf.get("subheading"))
    set_if_empty("map_iframe_src", mf.get("mapIframeSrc"))
    set_if_empty("map_title", mf.get("mapTitle"))
    set_if_empty("map_form_name_label", mf.get("formNameLabel"))
    set_if_empty("map_form_phone_label", mf.get("formPhoneLabel"))
    set_if_empty("map_form_comment_label", mf.get("formCommentLabel"))
    set_if_empty("map_name_placeholder", mf.get("namePlaceholder"))
    set_if_empty("map_phone_placeholder", mf.get("phonePlaceholder"))
    set_if_empty("map_comment_placeholder", mf.get("commentPlaceholder"))
    set_if_empty("map_submit_button", mf.get("submitButton"))
    set_if_empty("map_submitting", mf.get("submitting"))
    set_if_empty("map_success_message", mf.get("successMessage"))
    ss.save()


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0034_sitesettings_cdek_widget_v3"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="map_heading",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Пусто — берётся из контента главной (JSON).",
                max_length=200,
                verbose_name="Карта на главной: заголовок блока",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="map_subheading",
            field=models.TextField(blank=True, default="", verbose_name="Карта на главной: подзаголовок"),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="map_iframe_src",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Вставьте адрес из кода встраивания карты. Пусто — из контента главной.",
                verbose_name="Карта: URL iframe (Яндекс/Google и т.д.)",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="map_title",
            field=models.CharField(
                blank=True,
                default="",
                max_length=200,
                verbose_name="Карта: title у iframe (доступность)",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="map_form_name_label",
            field=models.CharField(blank=True, default="", max_length=80, verbose_name="Форма: подпись «имя»"),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="map_form_phone_label",
            field=models.CharField(blank=True, default="", max_length=80, verbose_name="Форма: подпись «телефон»"),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="map_form_comment_label",
            field=models.CharField(blank=True, default="", max_length=80, verbose_name="Форма: подпись «комментарий»"),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="map_name_placeholder",
            field=models.CharField(blank=True, default="", max_length=120, verbose_name="Плейсхолдер: имя"),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="map_phone_placeholder",
            field=models.CharField(blank=True, default="", max_length=80, verbose_name="Плейсхолдер: телефон"),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="map_comment_placeholder",
            field=models.CharField(blank=True, default="", max_length=200, verbose_name="Плейсхолдер: комментарий"),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="map_submit_button",
            field=models.CharField(blank=True, default="", max_length=80, verbose_name="Текст кнопки отправки"),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="map_submitting",
            field=models.CharField(blank=True, default="", max_length=80, verbose_name="Текст при отправке"),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="map_success_message",
            field=models.TextField(blank=True, default="", verbose_name="Сообщение после успешной отправки"),
        ),
        migrations.RunPython(copy_map_from_home_payload, noop_reverse),
    ]
