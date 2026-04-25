"""Настраиваемые фильтры каталога по характеристикам (ProductSpecification)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.db.models import Q, QuerySet

if TYPE_CHECKING:
    from django.http import HttpRequest

from .models import CatalogFilterKey


def apply_catalog_spec_filters(request: HttpRequest, qs: QuerySet) -> QuerySet:
    """AND по выбранным ключам; внутри ключа — OR по значениям (query: f_<id>=v1&f_<id>=v2)."""
    if not request:
        return qs
    for key in request.query_params:
        if not key.startswith("f_") or len(key) < 3:
            continue
        suffix = key[2:]
        if not suffix.isdigit():
            continue
        try:
            fk_id = int(suffix)
        except ValueError:
            continue
        try:
            cfk = CatalogFilterKey.objects.get(id=fk_id, is_enabled=True)
        except CatalogFilterKey.DoesNotExist:
            continue
        values = [v.strip() for v in request.query_params.getlist(key) if (v or "").strip()]
        if not values:
            continue
        row = Q()
        for v in values:
            row |= Q(
                specifications__group_name=cfk.group_name,
                specifications__name=cfk.name,
                specifications__value__iexact=v,
            )
        qs = qs.filter(row).distinct()
    return qs


def rebuild_catalog_filter_keys_from_products() -> dict[str, int]:
    """
    Сканирует опубликованные товары, считает (группа, параметр) и upsert в CatalogFilterKey.
    Новые — с is_enabled=False. product_count обновляется у всех.
    """
    from collections import defaultdict

    from .models import Product, ProductSpecification

    pids = list(
        Product.objects.filter(is_published=True, category__is_published=True).values_list("id", flat=True)
    )
    if not pids:
        CatalogFilterKey.objects.update(product_count=0)
        return {"created": 0, "updated": 0, "pairs": 0}

    by_pair: dict[tuple[str, str], set[int]] = defaultdict(set)
    for s in (
        ProductSpecification.objects.filter(product_id__in=pids)
        .only("product_id", "group_name", "name")
        .iterator(chunk_size=2000)
    ):
        g = (s.group_name or "").strip()
        n = (s.name or "").strip()
        if not n:
            continue
        by_pair[(g, n)].add(s.product_id)

    created_n = 0
    for (g, n), pset in sorted(by_pair.items(), key=lambda x: (-len(x[1]), x[0][0], x[0][1])):
        obj, was_created = CatalogFilterKey.objects.update_or_create(
            group_name=g,
            name=n,
            defaults={"product_count": len(pset)},
        )
        if was_created:
            created_n += 1

    # Пары, которых больше нет в данных
    present_ids: set[tuple[str, str]] = set(by_pair.keys())
    for row in CatalogFilterKey.objects.all():
        if (row.group_name, row.name) not in present_ids:
            CatalogFilterKey.objects.filter(pk=row.pk).update(product_count=0)

    return {"created": created_n, "pairs": len(by_pair)}
