from django.db import migrations


def create_about_page(apps, schema_editor):
    StaticPage = apps.get_model("api", "StaticPage")
    if StaticPage.objects.filter(slug="o-nas").exists():
        return
    StaticPage.objects.create(
        slug="o-nas",
        title="О нас",
        meta_title="",
        meta_description="",
        body="<p>Отредактируйте текст в разделе «Статичные страницы» в админке.</p>",
        is_published=True,
        show_in_header=False,
        show_in_footer=True,
        header_link_label="",
        footer_link_label="",
        sort_order=5,
    )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0062_catalog_filter_keys"),
    ]

    operations = [
        migrations.RunPython(create_about_page, noop_reverse),
    ]
