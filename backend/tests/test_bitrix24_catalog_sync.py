import pytest
from django.test import override_settings

from api.models import Product, ProductCategory, ProductVariant, SiteSettings
from api.services.bitrix24_catalog_sync import (
    apply_bitrix_catalog_ids,
    merge_xml_id_index,
    product_match_key,
    resolve_bitrix24_catalog_config,
    rows_from_bitrix_list_response,
    run_bitrix24_catalog_sync_job,
    variant_match_key,
)


def test_rows_from_bitrix_list_response_list_result():
    rows = rows_from_bitrix_list_response({"result": [{"id": 1, "xmlId": "a"}]})
    assert len(rows) == 1
    assert rows[0]["xmlId"] == "a"


def test_rows_from_bitrix_list_response_products_key():
    rows = rows_from_bitrix_list_response(
        {"result": {"products": [{"id": 2, "xmlId": "b"}]}}
    )
    assert rows[0]["id"] == 2


def test_merge_xml_id_index_duplicate_warning():
    idx: dict[str, int] = {}
    warns: list[str] = []
    merge_xml_id_index(
        idx,
        [{"id": 1, "xmlId": "x"}, {"id": 2, "xmlId": "x"}],
        source_label="test",
        duplicate_warnings=warns,
    )
    assert idx["x"] == 2
    assert len(warns) == 1


@pytest.mark.django_db
def test_variant_match_key_xml_then_wb():
    cat = ProductCategory.objects.create(title="C", slug="c")
    p = Product.objects.create(title="P", slug="p", category=cat)
    v = ProductVariant.objects.create(product=p, label="V", wb_nm_id=12345)
    assert variant_match_key(v) == "12345"
    v.bitrix_xml_id = "SKU-1"
    v.save(update_fields=["bitrix_xml_id"])
    v.refresh_from_db()
    assert variant_match_key(v) == "SKU-1"


@pytest.mark.django_db
def test_apply_bitrix_catalog_ids_variant_and_product():
    cat = ProductCategory.objects.create(title="C", slug="c")
    p = Product.objects.create(title="P", slug="prod-slug", category=cat)
    v = ProductVariant.objects.create(
        product=p, label="V", wb_nm_id=999, bitrix_catalog_id=None
    )
    m = {"999": 101, "prod-slug": 202}
    r = apply_bitrix_catalog_ids(m, dry_run=False, force=False)
    assert r.variants_updated == 1
    assert r.products_updated == 1
    v.refresh_from_db()
    p.refresh_from_db()
    assert v.bitrix_catalog_id == 101
    assert p.bitrix_catalog_id == 202


@pytest.mark.django_db
def test_apply_respects_only_empty_without_force():
    cat = ProductCategory.objects.create(title="C", slug="c")
    p = Product.objects.create(title="P", slug="same", category=cat, bitrix_catalog_id=1)
    ProductVariant.objects.create(
        product=p, label="V", wb_nm_id=1, bitrix_catalog_id=50
    )
    m = {"1": 999, "same": 888}
    r = apply_bitrix_catalog_ids(m, dry_run=False, force=False)
    assert r.variants_updated == 0
    assert r.products_updated == 0


@pytest.mark.django_db
def test_product_match_key_prefers_bitrix_xml_id():
    cat = ProductCategory.objects.create(title="C", slug="c")
    p = Product.objects.create(
        title="P", slug="slug", category=cat, bitrix_xml_id="ext-1"
    )
    assert product_match_key(p) == "ext-1"


@pytest.mark.django_db
def test_resolve_bitrix24_catalog_config_admin_over_env():
    s = SiteSettings.get_solo()
    s.bitrix24_webhook_base = "https://db.example/rest/1/secret"
    s.bitrix24_catalog_product_iblock_id = 10
    s.bitrix24_catalog_offer_iblock_id = 20
    s.save()

    with override_settings(
        BITRIX24_WEBHOOK_BASE="https://env.example/rest/1/x",
        BITRIX24_CATALOG_PRODUCT_IBLOCK_ID=99,
        BITRIX24_CATALOG_OFFER_IBLOCK_ID=88,
    ):
        c = resolve_bitrix24_catalog_config()
    assert c.webhook_base == "https://db.example/rest/1/secret"
    assert c.product_iblock_id == 10
    assert c.offer_iblock_id == 20

    c2 = resolve_bitrix24_catalog_config(webhook_cli="https://cli/rest/1/z")
    assert c2.webhook_base == "https://cli/rest/1/z"


@pytest.mark.django_db
def test_run_bitrix24_catalog_sync_job_fails_without_webhook():
    s = SiteSettings.get_solo()
    s.bitrix24_webhook_base = ""
    s.save()
    with override_settings(BITRIX24_WEBHOOK_BASE=""):
        r = run_bitrix24_catalog_sync_job(dry_run=True, force=False)
    assert r.ok is False
    assert r.error
    assert r.applied is None


@pytest.mark.django_db
def test_resolve_bitrix24_catalog_config_falls_back_to_env():
    s = SiteSettings.get_solo()
    s.bitrix24_webhook_base = ""
    s.bitrix24_catalog_product_iblock_id = None
    s.bitrix24_catalog_offer_iblock_id = None
    s.save()

    with override_settings(
        BITRIX24_WEBHOOK_BASE="https://env.only/rest/1/a",
        BITRIX24_CATALOG_PRODUCT_IBLOCK_ID=7,
        BITRIX24_CATALOG_OFFER_IBLOCK_ID=None,
    ):
        c = resolve_bitrix24_catalog_config()
    assert c.webhook_base == "https://env.only/rest/1/a"
    assert c.product_iblock_id == 7
    assert c.offer_iblock_id is None
