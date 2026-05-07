"""Нормализация URL товаров каталога: ЧПУ из названия + id, редиректы со старых слагов (wb-r…)."""

from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import CatalogProductSlugRedirect, Product
from api.slug_utils import product_catalog_slug


class Command(BaseCommand):
    help = (
        "Для каждого товара выставить слаг вида «транслит-названия-{id}» и при смене создать "
        "301-редирект в CatalogProductSlugRedirect. Используйте на проде, если остались wb-r… "
        "или после ручных правок БД. Сначала: --dry-run."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Только показать, что будет сделано, без записи в БД.",
        )
        parser.add_argument(
            "--only-wildberries",
            action="store_true",
            help="Обрабатывать только товары, у которых текущий слаг начинается с wb- или wb-r.",
        )

    def handle(self, *args, **options):
        dry: bool = options["dry_run"]
        only_wb: bool = options["only_wildberries"]
        changed = 0
        skipped_conflict = 0
        skipped_wb_filter = 0

        qs = Product.objects.all().order_by("id")
        total = qs.count()

        # Два прохода: на MySQL итерация по queryset + UPDATE той же таблицы может давать пропуски строк.
        planned: list[tuple[int, str, str]] = []
        for p in qs.iterator(chunk_size=500):
            old = (p.slug or "").strip()
            new = product_catalog_slug(title=p.title, pk=int(p.pk), max_length=120)

            if only_wb:
                low = old.lower()
                if not low.startswith("wb-"):
                    skipped_wb_filter += 1
                    continue

            if old != new:
                planned.append((int(p.pk), old, new))

        for pk, old, new in planned:
            if dry:
                self.stdout.write(f"[dry-run] pk={pk} {old!r} -> {new!r}")
                changed += 1
                continue

            with transaction.atomic():
                redir = CatalogProductSlugRedirect.objects.filter(old_slug=old).first()
                if redir is not None and redir.product_id != pk:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Пропуск pk={pk}: old_slug={old!r} уже указывает на product_id={redir.product_id}"
                        )
                    )
                    skipped_conflict += 1
                    continue
                if redir is None:
                    CatalogProductSlugRedirect.objects.create(old_slug=old, product_id=pk)
                Product.objects.filter(pk=pk).update(slug=new)
            changed += 1

        self.stdout.write(
            f"Готово. Всего строк: {total}, обновлено слагов: {changed}, "
            f"пропущено по --only-wildberries: {skipped_wb_filter}, конфликтов редиректа: {skipped_conflict}."
        )
        if dry:
            self.stdout.write(self.style.WARNING("Режим --dry-run: в БД ничего не записано."))
