from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0021_callback_lead"),
    ]

    operations = [
        migrations.AddField(
            model_name="homepagecontent",
            name="ps0_icon_image",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="home/ps_icons/%Y/%m/",
                max_length=512,
                verbose_name="Карточка «Проблема—решение» 1: картинка вместо значка",
            ),
        ),
        migrations.AddField(
            model_name="homepagecontent",
            name="ps1_icon_image",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="home/ps_icons/%Y/%m/",
                max_length=512,
                verbose_name="Карточка «Проблема—решение» 2: картинка вместо значка",
            ),
        ),
        migrations.AddField(
            model_name="homepagecontent",
            name="ps2_icon_image",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="home/ps_icons/%Y/%m/",
                max_length=512,
                verbose_name="Карточка «Проблема—решение» 3: картинка вместо значка",
            ),
        ),
        migrations.AddField(
            model_name="homepagecontent",
            name="ps3_icon_image",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="home/ps_icons/%Y/%m/",
                max_length=512,
                verbose_name="Карточка «Проблема—решение» 4: картинка вместо значка",
            ),
        ),
    ]
