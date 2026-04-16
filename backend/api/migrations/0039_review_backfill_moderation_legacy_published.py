from django.db import migrations
from django.db.models import F


def forwards(apps, schema_editor):
    """После 0038 у уже опубликованных отзывов новые булевы поля могли остаться False.

    Иначе модель оказывается в недопустимом состоянии (на сайте, но без согласия/модерации),
    что ломает сохранение в админке и может давать 500 на операциях валидации.
    """
    Review = apps.get_model("api", "Review")
    Review.objects.filter(is_published=True).update(
        publication_consent=True,
        is_moderated=True,
        moderated_at=F("created_at"),
    )


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0038_review_city_review_is_moderated_review_moderated_at_and_more"),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
