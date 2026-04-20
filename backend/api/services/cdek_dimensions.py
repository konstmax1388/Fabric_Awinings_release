from __future__ import annotations

from collections.abc import Iterable

from api.models import Product, SiteSettings


def normalize_cdek_package(raw: dict[str, int] | None) -> dict[str, int]:
    data = raw or {}
    try:
        weight = int(data.get("weight") or 0)
    except (TypeError, ValueError):
        weight = 0
    try:
        length = int(data.get("length") or 0)
    except (TypeError, ValueError):
        length = 0
    try:
        width = int(data.get("width") or 0)
    except (TypeError, ValueError):
        width = 0
    try:
        height = int(data.get("height") or 0)
    except (TypeError, ValueError):
        height = 0
    return {
        "weight": max(1, weight),
        "length": max(1, length),
        "width": max(1, width),
        "height": max(1, height),
    }


def cdek_default_package(settings: SiteSettings) -> dict[str, int]:
    weight = int(settings.cdek_default_weight_grams or 0) or 3000
    length = int(settings.cdek_default_length_cm or 0) or 30
    width = int(settings.cdek_default_width_cm or 0) or 20
    height = int(settings.cdek_default_height_cm or 0) or 20
    return normalize_cdek_package(
        {"weight": weight, "length": length, "width": width, "height": height}
    )


def cdek_package_for_product(product: Product, settings: SiteSettings) -> dict[str, int]:
    fallback = cdek_default_package(settings)
    weight = int(product.cdek_weight_grams or 0) or fallback["weight"]
    length = int(product.cdek_length_cm or 0) or fallback["length"]
    width = int(product.cdek_width_cm or 0) or fallback["width"]
    height = int(product.cdek_height_cm or 0) or fallback["height"]
    return normalize_cdek_package(
        {"weight": weight, "length": length, "width": width, "height": height}
    )


def cdek_widget_goods_for_lines(lines: Iterable[dict], settings: SiteSettings) -> list[dict[str, int]]:
    product_ids: set[int] = set()
    for line in lines:
        try:
            pid = int((line or {}).get("productId") or 0)
        except (TypeError, ValueError):
            continue
        if pid > 0:
            product_ids.add(pid)
    products_map = Product.objects.in_bulk(product_ids)
    fallback = cdek_default_package(settings)
    goods: list[dict[str, int]] = []
    for line in lines:
        raw = line or {}
        qty_raw = raw.get("qty")
        try:
            qty = int(qty_raw)
        except (TypeError, ValueError):
            qty = 1
        qty = min(max(1, qty), 50)
        product = None
        try:
            pid = int(raw.get("productId") or 0)
            product = products_map.get(pid)
        except (TypeError, ValueError):
            product = None
        pack = cdek_package_for_product(product, settings) if product else fallback
        for _ in range(qty):
            goods.append(dict(pack))
    return goods or [dict(fallback)]
