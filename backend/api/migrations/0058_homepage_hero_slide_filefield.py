# Hero: слайды — FileField (картинка или видео), вместо ImageField.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0057_home_hero_slide_images")]

    operations = [
        migrations.AlterField(
            model_name="homepagecontent",
            name="hero_slide_1_image",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="home/hero/slides/%Y/%m/",
                max_length=512,
                verbose_name="Hero, слайд 1: изображение или видео (файл)",
            ),
        ),
        migrations.AlterField(
            model_name="homepagecontent",
            name="hero_slide_2_image",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="home/hero/slides/%Y/%m/",
                max_length=512,
                verbose_name="Hero, слайд 2: изображение или видео (файл)",
            ),
        ),
        migrations.AlterField(
            model_name="homepagecontent",
            name="hero_slide_3_image",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="home/hero/slides/%Y/%m/",
                max_length=512,
                verbose_name="Hero, слайд 3: изображение или видео (файл)",
            ),
        ),
        migrations.AlterField(
            model_name="homepagecontent",
            name="hero_slide_4_image",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="home/hero/slides/%Y/%m/",
                max_length=512,
                verbose_name="Hero, слайд 4: изображение или видео (файл)",
            ),
        ),
        migrations.AlterField(
            model_name="homepagecontent",
            name="hero_slide_5_image",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="home/hero/slides/%Y/%m/",
                max_length=512,
                verbose_name="Hero, слайд 5: изображение или видео (файл)",
            ),
        ),
        migrations.AlterField(
            model_name="homepagecontent",
            name="hero_slide_6_image",
            field=models.FileField(
                blank=True,
                null=True,
                upload_to="home/hero/slides/%Y/%m/",
                max_length=512,
                verbose_name="Hero, слайд 6: изображение или видео (файл)",
            ),
        ),
    ]
