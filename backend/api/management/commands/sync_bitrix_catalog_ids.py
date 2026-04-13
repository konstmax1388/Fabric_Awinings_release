"""
Заполнение bitrix_catalog_id по REST каталога Битрикс24 (XML_ID / wb_nm_id / slug).

Требуется входящий вебхук с правом «Каталог (catalog)» и ID инфоблоков каталога.
Инфоблоки: ``catalog.catalog.list`` в Б24 или настройки портала.
"""

from django.core.management.base import BaseCommand, CommandError

from api.services.bitrix24_catalog_sync import run_bitrix24_catalog_sync_job


class Command(BaseCommand):
    help = (
        "Синхронизировать bitrix_catalog_id с каталогом Б24: индекс по XML_ID из "
        "catalog.product.list и catalog.product.offer.list; сопоставление с вариантами "
        "(bitrix_xml_id или wb_nm_id) и товарами (bitrix_xml_id или slug)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--webhook-base",
            type=str,
            default="",
            help="База URL вебхука (приоритет над админкой и BITRIX24_WEBHOOK_BASE).",
        )
        parser.add_argument(
            "--product-iblock-id",
            type=int,
            default=None,
            help="ID инфоблока товаров (приоритет над админкой и env).",
        )
        parser.add_argument(
            "--offer-iblock-id",
            type=int,
            default=None,
            help="ID инфоблока торговых предложений (приоритет над админкой и env).",
        )
        parser.add_argument(
            "--no-products",
            action="store_true",
            help="Не вызывать catalog.product.list.",
        )
        parser.add_argument(
            "--no-offers",
            action="store_true",
            help="Не вызывать catalog.product.offer.list.",
        )
        parser.add_argument(
            "--skip-model-products",
            action="store_true",
            help="Не обновлять bitrix_catalog_id у модели Product (только варианты).",
        )
        parser.add_argument(
            "--skip-model-variants",
            action="store_true",
            help="Не обновлять bitrix_catalog_id у ProductVariant (только товары).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Показать счётчики без записи в БД.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Перезаписать уже заполненный bitrix_catalog_id.",
        )
        parser.add_argument(
            "--timeout",
            type=int,
            default=120,
            help="Таймаут HTTP на один запрос (сек).",
        )

    def handle(self, *args, **options):
        r = run_bitrix24_catalog_sync_job(
            dry_run=bool(options["dry_run"]),
            force=bool(options["force"]),
            no_products=bool(options["no_products"]),
            no_offers=bool(options["no_offers"]),
            skip_model_products=bool(options["skip_model_products"]),
            skip_model_variants=bool(options["skip_model_variants"]),
            timeout=max(10, int(options["timeout"] or 120)),
            webhook_cli=(options["webhook_base"] or "").strip(),
            product_iblock_cli=options["product_iblock_id"],
            offer_iblock_cli=options["offer_iblock_id"],
        )
        if not r.ok:
            raise CommandError(r.error or "Ошибка синхронизации")

        self.stdout.write(f"Записей в индексе XML_ID → id: {r.index_size}")
        for w in r.duplicate_warnings[:50]:
            self.stdout.write(self.style.WARNING(w))
        if len(r.duplicate_warnings) > 50:
            self.stdout.write(
                self.style.WARNING(f"… и ещё предупреждений: {len(r.duplicate_warnings) - 50}")
            )

        if r.applied:
            self.stdout.write(
                f"Варианты: обновлено {r.applied.variants_updated}, "
                f"без ключа {r.applied.variants_skipped_no_key}, нет в Б24 {r.applied.variants_no_match}"
            )
            self.stdout.write(
                f"Товары: обновлено {r.applied.products_updated}, "
                f"без ключа {r.applied.products_skipped_no_key}, нет в Б24 {r.applied.products_no_match}"
            )
        if r.dry_run:
            self.stdout.write(self.style.WARNING("Режим dry-run: база не менялась."))
        else:
            self.stdout.write(self.style.SUCCESS("Готово."))
