from django.core.management.base import BaseCommand, CommandError

from api.models import ProductCategory
from api.product_wb_import import WbImportError, import_one_from_wb_url


class Command(BaseCommand):
    help = (
        "Создать товар(ы) из ссылок Wildberries: варианты, характеристики, фото на диск, описание HTML."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "urls",
            nargs="+",
            help="Ссылки вида https://www.wildberries.ru/catalog/НОМЕР/detail.aspx",
        )
        parser.add_argument(
            "--category",
            required=True,
            dest="category_slug",
            help="Слаг категории ProductCategory (например truck, warehouse).",
        )
        parser.add_argument(
            "--publish",
            action="store_true",
            help="Сразу is_published=True (по умолчанию черновик).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Только показать, что будет импортировано, без записи в БД.",
        )

    def handle(self, *args, **options):
        slug_cat = options["category_slug"]
        try:
            category = ProductCategory.objects.get(slug=slug_cat)
        except ProductCategory.DoesNotExist as e:
            raise CommandError(f'Категория со слагом "{slug_cat}" не найдена.') from e

        dry = options["dry_run"]
        publish = options["publish"]

        for raw in options["urls"]:
            try:
                preview, p, wb_warnings = import_one_from_wb_url(
                    raw,
                    category=category,
                    publish=publish,
                    dry_run=dry,
                )
            except WbImportError as e:
                raise CommandError(f"{raw!r}: {e}") from e

            for w in wb_warnings:
                self.stdout.write(self.style.WARNING(f"{raw}: {w}"))

            if dry:
                assert preview is not None
                b = preview
                n_img = sum(len(v.image_urls) for v in b.variants)
                self.stdout.write(
                    f"seed_nm={b.seed_nm} variants={len(b.variants)} "
                    f"specs={len(b.specifications)} title={b.title[:70]!r} "
                    f"price_from_min={b.price_from_min} remote_images≈{n_img}"
                )
                continue

            assert p is not None
            self.stdout.write(self.style.SUCCESS(f"Создан товар id={p.pk} slug={p.slug}"))
