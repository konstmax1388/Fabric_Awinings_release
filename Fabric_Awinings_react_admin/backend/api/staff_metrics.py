"""Агрегаты для Staff dashboard (без ссылок на Django Admin)."""

from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta
from typing import Any

from django.utils import timezone

from .models import CallbackLead, CalculatorLead, CartOrder, Product, SiteSettings


def build_staff_metrics_overview() -> dict[str, Any]:
    site = SiteSettings.get_solo()
    now = timezone.now()
    d7 = now - timedelta(days=7)
    d30 = now - timedelta(days=30)

    orders_total = CartOrder.objects.count()
    orders_7d = CartOrder.objects.filter(created_at__gte=d7).count()
    orders_new = CartOrder.objects.filter(
        fulfillment_status=CartOrder.FulfillmentStatus.RECEIVED
    ).count()

    calc_on = site.show_calculator
    calc_total = CalculatorLead.objects.count() if calc_on else 0
    calc_30 = CalculatorLead.objects.filter(created_at__gte=d30).count() if calc_on else 0

    cb_total = CallbackLead.objects.count()
    cb_30 = CallbackLead.objects.filter(created_at__gte=d30).count()

    products_pub = Product.objects.filter(is_published=True, category__is_published=True).count()
    products_all = Product.objects.count()

    orders_by_day = _orders_count_by_day_last_14_days()
    top_products = _top_products_from_order_lines_last_days(30)

    return {
        "schemaVersion": 2,
        "generatedAt": now.isoformat(),
        "calculatorEnabled": calc_on,
        "orders": {
            "total": orders_total,
            "last7Days": orders_7d,
            "newReceived": orders_new,
            "byDay": orders_by_day,
        },
        "topProducts": top_products,
        "calculatorLeads": {
            "total": calc_total,
            "last30Days": calc_30,
        },
        "callbackLeads": {
            "total": cb_total,
            "last30Days": cb_30,
        },
        "products": {
            "published": products_pub,
            "totalInDb": products_all,
        },
    }


def _orders_count_by_day_last_14_days() -> list[dict[str, Any]]:
    """14 дней включая сегодня: дата ISO и число заказов (по локальной дате сервера)."""
    start = timezone.localdate() - timedelta(days=13)
    counts: dict[date, int] = defaultdict(int)
    for created_at in CartOrder.objects.filter(created_at__date__gte=start).values_list(
        "created_at", flat=True
    ):
        d = timezone.localtime(created_at).date()
        counts[d] += 1
    out: list[dict[str, Any]] = []
    for i in range(14):
        d = start + timedelta(days=i)
        out.append({"date": d.isoformat(), "count": counts.get(d, 0)})
    return out


def _top_products_from_order_lines_last_days(days: int, limit: int = 8) -> list[dict[str, Any]]:
    """Агрегация по JSON lines заказов: productId/slug + title + суммарное qty."""
    since = timezone.now() - timedelta(days=days)
    by_key: dict[str, dict[str, Any]] = {}
    for lines in CartOrder.objects.filter(created_at__gte=since).values_list("lines", flat=True):
        if not isinstance(lines, list):
            continue
        for line in lines:
            if not isinstance(line, dict):
                continue
            key = str(line.get("productId") or line.get("slug") or "").strip()
            if not key:
                continue
            qty = line.get("qty")
            try:
                n = int(qty) if qty is not None else 1
            except (TypeError, ValueError):
                n = 1
            if n < 1:
                n = 1
            title = (line.get("title") or key)[:200]
            if key not in by_key:
                by_key[key] = {"productId": key, "title": title, "qty": 0}
            by_key[key]["qty"] += n
            if title and by_key[key]["title"] == key:
                by_key[key]["title"] = title
    ranked = sorted(by_key.values(), key=lambda x: -x["qty"])
    return ranked[:limit]
