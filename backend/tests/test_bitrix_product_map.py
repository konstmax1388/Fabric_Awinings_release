import pytest

from api.models import Product, ProductCategory, ProductVariant
from api.services.bitrix_product_map import resolve_bitrix_catalog_id_for_cart_line


@pytest.mark.django_db
def test_resolve_uses_variant_bitrix_id():
    cat = ProductCategory.objects.create(title="C", slug="c-bx", sort_order=0)
    pr = Product.objects.create(title="P", slug="p-bx", category=cat, price_from=1, is_published=True)
    pr.bitrix_catalog_id = 100
    pr.save(update_fields=["bitrix_catalog_id"])
    v1 = ProductVariant.objects.create(
        product=pr, label="A", price_from=1, sort_order=0, is_default=False, bitrix_catalog_id=200
    )
    ProductVariant.objects.create(
        product=pr, label="B", price_from=2, sort_order=1, is_default=True, bitrix_catalog_id=300
    )
    line = {
        "productId": str(pr.pk),
        "variantId": str(v1.pk),
        "slug": pr.slug,
        "title": "P",
        "priceFrom": 1,
        "qty": 1,
    }
    assert resolve_bitrix_catalog_id_for_cart_line(line) == 200


@pytest.mark.django_db
def test_resolve_falls_back_to_product_when_variant_has_no_id():
    cat = ProductCategory.objects.create(title="C2", slug="c-bx2", sort_order=0)
    pr = Product.objects.create(
        title="P2",
        slug="p-bx2",
        category=cat,
        price_from=1,
        is_published=True,
        bitrix_catalog_id=555,
    )
    ProductVariant.objects.create(
        product=pr, label="V", price_from=1, sort_order=0, is_default=True, bitrix_catalog_id=None
    )
    line = {
        "productId": str(pr.pk),
        "variantId": "",
        "slug": pr.slug,
        "title": "P2",
        "priceFrom": 1,
        "qty": 1,
    }
    assert resolve_bitrix_catalog_id_for_cart_line(line) == 555


@pytest.mark.django_db
def test_resolve_by_slug_if_product_id_missing():
    cat = ProductCategory.objects.create(title="C3", slug="c-bx3", sort_order=0)
    pr = Product.objects.create(
        title="P3", slug="only-slug", category=cat, price_from=1, is_published=True, bitrix_catalog_id=777
    )
    line = {
        "productId": "",
        "variantId": "",
        "slug": "only-slug",
        "title": "P3",
        "priceFrom": 1,
        "qty": 1,
    }
    assert resolve_bitrix_catalog_id_for_cart_line(line) == 777
