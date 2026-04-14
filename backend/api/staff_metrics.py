"""Агрегаты для Staff dashboard (без ссылок на Django Admin)."""

from __future__ import annotations

from datetime import timedelta
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

    return {
        "schemaVersion": 1,
        "generatedAt": now.isoformat(),
        "calculatorEnabled": calc_on,
        "orders": {
            "total": orders_total,
            "last7Days": orders_7d,
            "newReceived": orders_new,
        },
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
