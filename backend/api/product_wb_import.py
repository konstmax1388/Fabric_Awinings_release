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
    create_variants: bool = True,
    price_source_mode: str = "auto",
    title_override: str | None = None,
    price_from_override: int | None = None,
    marketplace_links_extra: dict[str, str] | None = None,
    product_ozon_sku: int | None = None,
    excel_import: bool = False,
):
    """
    Возвращает (preview, product, warnings).
    warnings — предупреждения (пропущенные варианты WB и т.п.).
    При dry_run: (WbImportBundle, None, warnings). После импорта: (None, Product, warnings).

    title_override / price_from_override / marketplace_links_extra / product_ozon_sku —
    для импорта из Excel (название и цена с файла, ссылки МП; при заданном price_from_override
    цена товара и вариантов на сайте — из файла, не с WB).

    excel_import: не добавлять в warnings справку про источник цены WB; при override — текст про цену из Excel.
    """
    seed_nm = parse_nm_from_url(raw_url)
    try:
        bundle = fetch_wb_import_bundle(seed_nm, price_source_mode=price_source_mode)
    except WbImportError:
        raise

    warnings = list(bundle.warnings)
    if not excel_import:
        warnings.append(
            f"Цена WB: источник={bundle.price_from_min_source}, режим={bundle.price_source_mode}, цена_от={bundle.price_from_min} ₽"
        )
    title_for_product = (title_override or "").strip() or bundle.title
    if (title_override or "").strip():
        warnings.append("Название на сайте будет взято из файла (не с WB).")
    price_main = bundle.price_from_min if price_from_override is None else int(price_from_override)
    if price_from_override is not None:
        if excel_import:
            warnings.append(
                f"Цена на сайте из файла Excel: {price_main} ₽ (цены Wildberries не используются)."
            )
        else:
            warnings.append(
                f"Цена «от» и цены вариантов на сайте будут из файла: {price_main} ₽ (цены WB не используются)."
            )

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
        if marketplace_links_extra:
            for k, v in marketplace_links_extra.items():
                vv = (v or "").strip()
                if vv:
                    mp[str(k)] = vv

        create_kwargs: dict = dict(
            slug=slug,
            title=title_for_product,
            excerpt=bundle.excerpt,
            description=bundle.description_plain,
            description_html=bundle.description_html,
            category=category,
            price_from=price_main,
            is_published=publish,
            marketplace_links=mp,
        )
        if product_ozon_sku is not None:
            create_kwargs["ozon_sku"] = product_ozon_sku
        p = Product.objects.create(**create_kwargs)

        for gname, name, value, sort_order in bundle.specifications:
            ProductSpecification.objects.create(
                product=p,
                group_name=gname,
                name=name,
                value=value,
                sort_order=sort_order,
            )

        variants_to_create = bundle.variants
        if not create_variants:
            seed_variant = next(
                (v for v in bundle.variants if v.nm == bundle.seed_nm),
                bundle.variants[0] if bundle.variants else None,
            )
            variants_to_create = [seed_variant] if seed_variant is not None else []

        for order, vd in enumerate(variants_to_create):
            is_def = vd.nm == bundle.seed_nm
            variant_price = vd.price_from if price_from_override is None else int(price_from_override)
            v = ProductVariant.objects.create(
                product=p,
                label=vd.label,
                wb_nm_id=vd.nm,
                price_from=variant_price,
                sort_order=order,
                is_default=is_def,
                marketplace_wb_url=vd.marketplace_wb_url,
            )
            _save_variant_images(p, v, vd.image_urls)

    return None, p, warnings


__all__ = ["WbImportError", "import_one_from_wb_url"]
