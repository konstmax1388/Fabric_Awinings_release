# SEO: отдельные meta description для листингов /blog и /portfolio.

from django.db import migrations, models


def _seed_blog_portfolio_listing_meta(apps, schema_editor):
    SiteSettings = apps.get_model("api", "SiteSettings")
    ss = SiteSettings.objects.filter(pk=1).first()
    if not ss:
        return
    updates: list[str] = []
    if not (getattr(ss, "seo_blog_listing_meta_description", None) or "").strip():
        ss.seo_blog_listing_meta_description = (
            "Статьи и советы о тканях, замере, монтаже и уходе за тентами и навесами. "
            "Практические материалы для заказчиков и монтажников."
        )
        updates.append("seo_blog_listing_meta_description")
    if not (getattr(ss, "seo_portfolio_listing_meta_description", None) or "").strip():
        ss.seo_portfolio_listing_meta_description = (
            "Фото реализованных проектов: тенты, навесы, террасы и сезонные укрытия. "
            "Примеры до и после монтажа на объектах клиентов."
        )
        updates.append("seo_portfolio_listing_meta_description")
    if updates:
        ss.save(update_fields=updates)


def _noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0086_catalog_trust_icons_category_list_icon"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="seo_blog_listing_meta_description",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Сниппет для страницы списка статей. Пусто — «мета-описание по умолчанию».",
                verbose_name="SEO: meta description листинга блога (/blog)",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="seo_portfolio_listing_meta_description",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Сниппет для страницы портфолио. Пусто — «мета-описание по умолчанию».",
                verbose_name="SEO: meta description листинга портфолио (/portfolio)",
            ),
        ),
        migrations.RunPython(_seed_blog_portfolio_listing_meta, _noop),
    ]
