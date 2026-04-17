"""
Очистка демо-данных витрины (каталог/портфолио/отзывы/блог + контент главной).

Использование:
  python manage.py clear_public_demo_data --yes
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import BlogPost, HomePageContent, PortfolioProject, ProductCategory, Review


class Command(BaseCommand):
    help = (
        "Удаляет демо-данные публички: категории/товары (через каскад), портфолио, "
        "отзывы, блог и сбрасывает HomePageContent в пустой payload."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Подтверждение выполнения (без этого команда только предупреждает).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not options["yes"]:
            self.stdout.write(
                self.style.WARNING(
                    "Команда удаляет публичные данные без возможности отката. "
                    "Запустите повторно с флагом --yes."
                )
            )
            return

        category_count = ProductCategory.objects.count()
        portfolio_count = PortfolioProject.objects.count()
        review_count = Review.objects.count()
        blog_count = BlogPost.objects.count()

        ProductCategory.objects.all().delete()
        PortfolioProject.objects.all().delete()
        Review.objects.all().delete()
        BlogPost.objects.all().delete()

        home = HomePageContent.get_solo()
        home.payload = {}
        home.hero_background = None
        home.ps0_icon_image = None
        home.ps1_icon_image = None
        home.ps2_icon_image = None
        home.ps3_icon_image = None
        home.save()

        self.stdout.write(
            self.style.SUCCESS(
                "Очищено: "
                f"категорий={category_count}, портфолио={portfolio_count}, "
                f"отзывов={review_count}, статей={blog_count}; "
                "главная сброшена в пустой payload."
            )
        )
