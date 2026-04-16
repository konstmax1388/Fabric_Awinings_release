from django.core.management.base import BaseCommand
from django.db import transaction

from ...models import BlogPost, PortfolioProject, Product, ProductCategory, ProductImage, Review
from ...seed_catalog import BLOG_POSTS, PORTFOLIO, PRODUCTS, REVIEWS
from ...seed_media import copy_url_to_image_field


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
                cat = ProductCategory.objects.get(slug=row["category"])
                defaults = {k: v for k, v in row.items() if k not in ("slug", "images", "category")}
                defaults["category"] = cat
                prod, created = Product.objects.update_or_create(
                    slug=row["slug"],
                    defaults=defaults | {"is_published": True},
                )
                if purge or created:
                    prod.images_rel.all().delete()
                if not prod.images_rel.exists():
                    for i, url in enumerate(images):
                        pi = ProductImage(product=prod, sort_order=i * 10)
                        copy_url_to_image_field(
                            pi,
                            "image",
                            url,
                            basename=f"{prod.slug}_{i}",
                        )
                self.stdout.write(f"product {'+' if created else '~'} {prod.slug}")

            for row in PORTFOLIO:
                obj, _ = PortfolioProject.objects.update_or_create(
                    slug=row["slug"],
                    defaults={
                        "title": row["title"],
                        "category": row["category"],
                        "completed_on": row.get("completed_on"),
                        "sort_order": row.get("sort_order", 0),
                        "is_published": True,
                    },
                )
                copy_url_to_image_field(
                    obj,
                    "before_image_file",
                    row["before_image"],
                    basename=f"{row['slug']}_before",
                )
                copy_url_to_image_field(
                    obj,
                    "after_image_file",
                    row["after_image"],
                    basename=f"{row['slug']}_after",
                )
                self.stdout.write(f"portfolio ~ {row['slug']}")

            if purge or not Review.objects.exists():
                if purge:
                    Review.objects.all().delete()
                for r in REVIEWS:
                    rev = Review.objects.create(
                        name=r["name"],
                        text=r["text"],
                        rating=r["rating"],
                        video_url=r.get("video_url", ""),
                        sort_order=r.get("sort_order", 0),
                        is_published=True,
                        publication_consent=True,
                        is_moderated=True,
                    )
                    copy_url_to_image_field(
                        rev,
                        "photo_file",
                        r.get("photo_url", ""),
                        basename=f"review_{rev.pk}",
                    )
                self.stdout.write(f"reviews + {len(REVIEWS)}")

            for row in BLOG_POSTS:
                post, _ = BlogPost.objects.update_or_create(
                    slug=row["slug"],
                    defaults={
                        "title": row["title"],
                        "excerpt": row["excerpt"],
                        "body": row["body"],
                        "published_at": row.get("published_at"),
                        "is_published": True,
                    },
                )
                copy_url_to_image_field(
                    post,
                    "cover_image",
                    row.get("cover_image_url", ""),
                    basename=row["slug"],
                )
                self.stdout.write(f"blog ~ {row['slug']}")

        self.stdout.write(self.style.SUCCESS("seed_demo готово"))
