# Generated manually for per-slide hero images.

from django.db import migrations, models


def copy_hero_bg_to_slide1(apps, schema_editor):
    Home = apps.get_model("api", "HomePageContent")
    h = Home.objects.filter(pk=1).first()
    if not h or not h.hero_background or h.hero_slide_1_image:
        return
    h.hero_slide_1_image = h.hero_background
    h.save(update_fields=["hero_slide_1_image"])


class Migration(migrations.Migration):
    dependencies = [("api", "0056_consentlog")]

    operations = [
        migrations.AddField(
            model_name="homepagecontent",
            name="hero_slide_1_image",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="home/hero/slides/%Y/%m/",
                max_length=512,
                verbose_name="Hero, слайд 1: изображение",
            ),
        ),
        migrations.AddField(
            model_name="homepagecontent",
            name="hero_slide_2_image",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="home/hero/slides/%Y/%m/",
                max_length=512,
                verbose_name="Hero, слайд 2: изображение",
            ),
        ),
        migrations.AddField(
            model_name="homepagecontent",
            name="hero_slide_3_image",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="home/hero/slides/%Y/%m/",
                max_length=512,
                verbose_name="Hero, слайд 3: изображение",
            ),
        ),
        migrations.AddField(
            model_name="homepagecontent",
            name="hero_slide_4_image",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="home/hero/slides/%Y/%m/",
                max_length=512,
                verbose_name="Hero, слайд 4: изображение",
            ),
        ),
        migrations.AddField(
            model_name="homepagecontent",
            name="hero_slide_5_image",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="home/hero/slides/%Y/%m/",
                max_length=512,
                verbose_name="Hero, слайд 5: изображение",
            ),
        ),
        migrations.AddField(
            model_name="homepagecontent",
            name="hero_slide_6_image",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="home/hero/slides/%Y/%m/",
                max_length=512,
                verbose_name="Hero, слайд 6: изображение",
            ),
        ),
        migrations.AlterField(
            model_name="homepagecontent",
            name="hero_background",
            field=models.ImageField(
                blank=True,
                help_text="Устаревшее поле: раньше один фон на весь hero. Сейчас — картинки в блоках «Hero, слайд 1…6».",
                max_length=512,
                null=True,
                upload_to="home/hero/%Y/%m/",
                verbose_name="Фон героя (первый экран) — устар., см. слайд 1",
            ),
        ),
        migrations.RunPython(copy_hero_bg_to_slide1, reverse_code=migrations.RunPython.noop),
    ]
