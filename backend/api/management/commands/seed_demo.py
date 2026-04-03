from django.core.management.base import BaseCommand
from django.db import transaction

from ...models import BlogPost, PortfolioProject, Product, ProductImage, Review
from ...seed_catalog import BLOG_POSTS, PORTFOLIO, PRODUCTS, REVIEWS


class Command(BaseCommand):
    help = "Загрузить демо-данные (товары, портфолио, отзывы, блог). Идемпотентно по slug."

    def add_arguments(self, parser):
        parser.add_argument(
            "--purge",
            action="store_true",
            help="Удалить существующие демо-записи с теми же slug перед загрузкой",
        )

    def handle(self, *args, **options):
        purge = options["purge"]
        with transaction.atomic():
            if purge:
                Product.objects.filter(slug__in=[p["slug"] for p in PRODUCTS]).delete()
                PortfolioProject.objects.filter(
                    slug__in=[p["slug"] for p in PORTFOLIO]
                ).delete()
                BlogPost.objects.filter(slug__in=[b["slug"] for b in BLOG_POSTS]).delete()
                Review.objects.all().delete()

            for row in PRODUCTS:
                images = row["images"]
                defaults = {k: v for k, v in row.items() if k not in ("slug", "images")}
                prod, created = Product.objects.update_or_create(
                    slug=row["slug"],
                    defaults=defaults | {"is_published": True},
                )
                if purge or created:
                    prod.images_rel.all().delete()
                if not prod.images_rel.exists():
                    for i, url in enumerate(images):
                        ProductImage.objects.create(
                            product=prod, url=url, sort_order=i * 10
                        )
                self.stdout.write(f"product {'+' if created else '~'} {prod.slug}")

            for row in PORTFOLIO:
                PortfolioProject.objects.update_or_create(
                    slug=row["slug"],
                    defaults={
                        "title": row["title"],
                        "category": row["category"],
                        "before_image": row["before_image"],
                        "after_image": row["after_image"],
                        "completed_on": row.get("completed_on"),
                        "sort_order": row.get("sort_order", 0),
                        "is_published": True,
                    },
                )
                self.stdout.write(f"portfolio ~ {row['slug']}")

            if purge or not Review.objects.exists():
                if purge:
                    Review.objects.all().delete()
                for r in REVIEWS:
                    Review.objects.create(
                        name=r["name"],
                        text=r["text"],
                        rating=r["rating"],
                        photo_url=r.get("photo_url", ""),
                        video_url=r.get("video_url", ""),
                        sort_order=r.get("sort_order", 0),
                        is_published=True,
                    )
                self.stdout.write(f"reviews + {len(REVIEWS)}")

            for row in BLOG_POSTS:
                BlogPost.objects.update_or_create(
                    slug=row["slug"],
                    defaults={
                        "title": row["title"],
                        "excerpt": row["excerpt"],
                        "body": row["body"],
                        "cover_image_url": row.get("cover_image_url", ""),
                        "published_at": row.get("published_at"),
                        "is_published": True,
                    },
                )
                self.stdout.write(f"blog ~ {row['slug']}")

        self.stdout.write(self.style.SUCCESS("seed_demo готово"))
