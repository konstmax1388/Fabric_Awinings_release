"""Создание Product + варианты + характеристики + файлы изображений из Wildberries."""

from __future__ import annotations

import urllib.error

from django.core.files.base import ContentFile
from django.db import transaction

from .models import (
    Product,
    ProductCategory,
    ProductImage,
    ProductSpecification,
    ProductVariant,
)
from .wb_import import WbImportError, download_url_bytes, fetch_wb_import_bundle, parse_nm_from_url


def unique_slug_for_bundle(root_id: int | None, seed_nm: int) -> str:
    base = f"wb-r{root_id}" if root_id else f"wb-{seed_nm}"
    slug = base
    n = 1
    while Product.objects.filter(slug=slug).exists():
        n += 1
        slug = f"{base}-{n}"
    return slug


def _save_variant_images(
    product: Product,
    variant: ProductVariant,
    urls: list[str],
) -> None:
    for i, u in enumerate(urls):
        try:
            data = download_url_bytes(u)
        except (WbImportError, urllib.error.URLError, OSError, ValueError):
            continue
        ext = "webp"
        if ".jpg" in u.lower() or ".jpeg" in u.lower():
            ext = "jpg"
        name = f"wb_{variant.wb_nm_id or variant.pk}_{i + 1}.{ext}"
        img = ProductImage(product=product, variant=variant, sort_order=i)
        img.image.save(name, ContentFile(data), save=True)


def import_one_from_wb_url(
    raw_url: str,
    *,
    category: ProductCategory,
    publish: bool,
    dry_run: bool,
):
    """
    Возвращает (preview, product, warnings).
    warnings — предупреждения (пропущенные варианты WB и т.п.).
    При dry_run: (WbImportBundle, None, warnings). После импорта: (None, Product, warnings).
    """
    seed_nm = parse_nm_from_url(raw_url)
    try:
        bundle = fetch_wb_import_bundle(seed_nm)
    except WbImportError:
        raise

    warnings = list(bundle.warnings)

    if dry_run:
        return bundle, None, warnings

    slug = unique_slug_for_bundle(bundle.root_id, bundle.seed_nm)

    with transaction.atomic():
        seed_v = next(
            (v for v in bundle.variants if v.nm == bundle.seed_nm),
            bundle.variants[0] if bundle.variants else None,
        )
        mp: dict = {}
        if seed_v and seed_v.marketplace_wb_url:
            mp["wb"] = seed_v.marketplace_wb_url

        p = Product.objects.create(
            slug=slug,
            title=bundle.title,
            excerpt=bundle.excerpt,
            description=bundle.description_plain,
            description_html=bundle.description_html,
            category=category,
            price_from=bundle.price_from_min,
            is_published=publish,
            marketplace_links=mp,
        )

        for gname, name, value, sort_order in bundle.specifications:
            ProductSpecification.objects.create(
                product=p,
                group_name=gname,
                name=name,
                value=value,
                sort_order=sort_order,
            )

        for order, vd in enumerate(bundle.variants):
            is_def = vd.nm == bundle.seed_nm
            v = ProductVariant.objects.create(
                product=p,
                label=vd.label,
                wb_nm_id=vd.nm,
                price_from=vd.price_from,
                sort_order=order,
                is_default=is_def,
                marketplace_wb_url=vd.marketplace_wb_url,
            )
            _save_variant_images(p, v, vd.image_urls)

    return None, p, warnings


__all__ = ["WbImportError", "import_one_from_wb_url"]
