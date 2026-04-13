"""
Данные для главной страницы админки (панель управления): сайт, заявки, заказы.
"""

from __future__ import annotations

import os
from datetime import timedelta
from email.utils import parseaddr
from typing import Any

from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext as _

from config.homepage_nav import SECTION_ORDER as HP_SECTION_ORDER
from config.sitesettings_nav import SECTION_ORDER as SS_SECTION_ORDER

from api.models import (
    CallbackLead,
    CalculatorLead,
    CartOrder,
    CustomerProfile,
    Product,
    SiteSettings,
)
from api.services.notification_email import outbound_from_address, parse_recipient_list


def _dashboard_smtp_from_email(site: SiteSettings) -> str:
    """Email из фактического From (как при отправке писем), без SMTP-хоста."""
    raw = (outbound_from_address(site) or "").strip()
    if not raw:
        return ""
    _name, addr = parseaddr(raw)
    if addr and "@" in addr:
        return addr.strip()
    if "@" in raw:
        return raw.strip()
    return raw


def admin_dashboard_callback(request, context: dict[str, Any]) -> dict[str, Any]:
    if not getattr(request.user, "is_staff", False):
        return context

    site = SiteSettings.get_solo()
    public_url = (os.environ.get("DJANGO_PUBLIC_SITE_URL", "") or "").strip().rstrip("/") or None
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
    customers_n = CustomerProfile.objects.count()

    recipient_n = len(parse_recipient_list(site.notification_recipients or ""))

    recent_orders: list[dict[str, Any]] = []
    for o in CartOrder.objects.order_by("-created_at")[:8]:
        recent_orders.append(
            {
                "change_url": reverse("admin:api_cartorder_change", args=[o.pk]),
                "order_ref": o.order_ref,
                "customer_name": o.customer_name,
                "customer_phone": o.customer_phone,
                "total_approx": o.total_approx,
                "fulfillment_status": o.fulfillment_status,
                "status_label": o.get_fulfillment_status_display(),
                "created_at": o.created_at,
            }
        )

    recent_calc: list[dict[str, Any]] = []
    if calc_on:
        for lead in CalculatorLead.objects.order_by("-created_at")[:5]:
            recent_calc.append(
                {
                    "change_url": reverse("admin:api_calculatorlead_change", args=[lead.pk]),
                    "name": lead.name,
                    "phone": lead.phone,
                    "created_at": lead.created_at,
                }
            )

    recent_cb: list[dict[str, Any]] = []
    for lead in CallbackLead.objects.order_by("-created_at")[:5]:
        recent_cb.append(
            {
                "change_url": reverse("admin:api_callbacklead_change", args=[lead.pk]),
                "name": lead.name,
                "phone": lead.phone,
                "created_at": lead.created_at,
            }
        )

    stat_cards: list[dict[str, Any]] = [
        {
            "label": _("Заказы (корзина)"),
            "value": orders_total,
            "hint": _("Новых (статус «принят»): %(n)s · за 7 дней: %(d)s")
            % {"n": orders_new, "d": orders_7d},
            "url": reverse("admin:api_cartorder_changelist"),
            "icon": "shopping_cart",
        },
    ]
    if calc_on:
        stat_cards.append(
            {
                "label": _("Заявки калькулятора"),
                "value": calc_total,
                "hint": _("за 30 дней: %(n)s") % {"n": calc_30},
                "url": reverse("admin:api_calculatorlead_changelist"),
                "icon": "calculate",
            }
        )
    stat_cards.extend(
        [
            {
                "label": _("Обратный звонок"),
                "value": cb_total,
                "hint": _("за 30 дней: %(n)s") % {"n": cb_30},
                "url": reverse("admin:api_callbacklead_changelist"),
                "icon": "phone_callback",
            },
            {
                "label": _("Товары на витрине"),
                "value": products_pub,
                "hint": _("всего в базе: %(n)s") % {"n": products_all},
                "url": reverse("admin:api_product_changelist"),
                "icon": "inventory_2",
            },
        ]
    )

    quick_links = [
        {
            "title": _("Настройки сайта"),
            "url": reverse(
                "admin:api_sitesettings_section",
                kwargs={"slug": SS_SECTION_ORDER[0]},
            ),
            "icon": "store",
        },
        {
            "title": _("Главная страница (контент)"),
            "url": reverse(
                "admin:api_homepagecontent_section",
                kwargs={"slug": HP_SECTION_ORDER[0]},
            ),
            "icon": "web",
        },
        {
            "title": _("Категории каталога"),
            "url": reverse("admin:api_productcategory_changelist"),
            "icon": "category",
        },
        {
            "title": _("Импорт Wildberries"),
            "url": reverse("admin:api_product_import_wb"),
            "icon": "link",
        },
        {
            "title": _("Портфолио"),
            "url": reverse("admin:api_portfolioproject_changelist"),
            "icon": "photo_camera",
        },
        {
            "title": _("Покупатели"),
            "url": reverse("admin:api_customerprofile_changelist"),
            "icon": "person",
        },
    ]

    context.update(
        {
            "dashboard_site": {
                "name": site.site_name,
                "tagline": site.site_tagline,
                "phone": site.phone_display,
                "email": site.email,
                "public_url": public_url,
                "calculator_on": site.show_calculator,
                "smtp_on": site.smtp_enabled,
                "smtp_from": _dashboard_smtp_from_email(site),
                "recipient_n": recipient_n,
            },
            "dashboard_stat_cards": stat_cards,
            "dashboard_recent_orders": recent_orders,
            "dashboard_recent_calc": recent_calc,
            "dashboard_recent_cb": recent_cb,
            "dashboard_quick_links": quick_links,
            "dashboard_customers_n": customers_n,
        }
    )
    return context
