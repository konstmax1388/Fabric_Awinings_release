"""
Боковое меню Unfold: группы «как на публичном сайте», без дублирования списка приложений.
"""

from django.urls import reverse_lazy
from django.utils.functional import SimpleLazyObject
from django.utils.translation import gettext_lazy as _

from config.homepage_nav import SECTION_ORDER as HP_SECTION_ORDER, homepage_sidebar_block_items
from config.sitesettings_nav import site_settings_sidebar_block_items


def _cart_order_crm_errors_url() -> str:
    from django.urls import reverse

    return reverse("admin:api_cartorder_changelist") + "?bitrix_sync_status=error"


def _bitrix24_catalog_sync_admin_url() -> str:
    from django.urls import reverse

    return reverse("admin:api_sitesettings_bitrix24_catalog_sync")


def show_calculator_leads_menu(request):
    """Не показывать заявки калькулятора в меню, если блок на витрине выключен."""
    try:
        from api.models import SiteSettings

        return SiteSettings.get_solo().show_calculator
    except Exception:
        return True


def build_unfold_sidebar() -> list[dict]:
    """Ссылка «Открыть сайт» вынесена в templates/unfold/helpers/navigation.html (над поиском); URL — UNFOLD SITE_URL."""
    cart_crm_errors_url = SimpleLazyObject(_cart_order_crm_errors_url)
    bitrix24_catalog_sync_url = SimpleLazyObject(_bitrix24_catalog_sync_admin_url)
    return [
        {
            "title": _("Обзор"),
            "collapsible": False,
            "items": [
                {
                    "title": _("Панель управления"),
                    "icon": "dashboard",
                    "link": reverse_lazy("admin:index"),
                },
            ],
        },
        {
            "title": _("Контент на сайте"),
            "separator": True,
            "collapsible": True,
            "items": [
                {
                    "title": _("Категории каталога"),
                    "icon": "category",
                    "link": reverse_lazy("admin:api_productcategory_changelist"),
                },
                {
                    "title": _("Товары"),
                    "icon": "inventory_2",
                    "link": reverse_lazy("admin:api_product_changelist"),
                },
                {
                    "title": _("Импорт с Wildberries"),
                    "icon": "link",
                    "link": reverse_lazy("admin:api_product_import_wb"),
                },
                {
                    "title": _("Портфолио"),
                    "icon": "photo_camera",
                    "link": reverse_lazy("admin:api_portfolioproject_changelist"),
                },
                {
                    "title": _("Отзывы"),
                    "icon": "reviews",
                    "link": reverse_lazy("admin:api_review_changelist"),
                },
                {
                    "title": _("Блог"),
                    "icon": "article",
                    "link": reverse_lazy("admin:api_blogpost_changelist"),
                },
            ],
        },
        {
            "title": _("Настройки сайта"),
            "separator": True,
            "collapsible": True,
            "items": [
                *site_settings_sidebar_block_items(),
                {
                    "title": _("Шаблоны писем"),
                    "icon": "description",
                    "link": reverse_lazy("admin:api_siteemailtemplate_changelist"),
                },
                {
                    "title": _("Проверка отправки почты (SMTP)"),
                    "icon": "send",
                    "link": reverse_lazy("admin:api_sitesettings_smtp_test"),
                },
                {
                    "title": _("Проверка вебхука Битрикс24 (каталог)"),
                    "icon": "wifi_tethering",
                    "link": reverse_lazy("admin:api_sitesettings_bitrix24_catalog_test"),
                },
                {
                    "title": _("Сопоставление каталога с Б24 (товары)"),
                    "icon": "sync_alt",
                    "link": bitrix24_catalog_sync_url,
                },
            ],
        },
        {
            "title": _("Главная страница (контент)"),
            "separator": True,
            "collapsible": True,
            "items": [
                {
                    "title": _("Тексты и блоки"),
                    "icon": "web",
                    "link": reverse_lazy(
                        "admin:api_homepagecontent_section",
                        kwargs={"slug": HP_SECTION_ORDER[0]},
                    ),
                    "items": homepage_sidebar_block_items(),
                },
            ],
        },
        {
            "title": _("Заказы и заявки"),
            "separator": True,
            "collapsible": True,
            "items": [
                {
                    "title": _("Заказы с сайта (корзина)"),
                    "icon": "shopping_cart",
                    "link": reverse_lazy("admin:api_cartorder_changelist"),
                },
                {
                    "title": _("Заказы: ошибка отправки в CRM"),
                    "icon": "sync_disabled",
                    "link": cart_crm_errors_url,
                },
                {
                    "title": _("Заявки с калькулятора"),
                    "icon": "calculate",
                    "link": reverse_lazy("admin:api_calculatorlead_changelist"),
                    "permission": "config.unfold_sidebar.show_calculator_leads_menu",
                },
                {
                    "title": _("Обратный звонок"),
                    "icon": "phone_callback",
                    "link": reverse_lazy("admin:api_callbacklead_changelist"),
                },
            ],
        },
        {
            "title": _("Покупатели"),
            "separator": True,
            "collapsible": True,
            "items": [
                {
                    "title": _("Профили"),
                    "icon": "person",
                    "link": reverse_lazy("admin:api_customerprofile_changelist"),
                },
                {
                    "title": _("Адреса доставки"),
                    "icon": "location_on",
                    "link": reverse_lazy("admin:api_shippingaddress_changelist"),
                },
            ],
        },
        {
            "title": _("Доступ в админку"),
            "separator": True,
            "collapsible": True,
            "items": [
                {
                    "title": _("Пользователи"),
                    "icon": "manage_accounts",
                    "link": reverse_lazy("admin:auth_user_changelist"),
                },
                {
                    "title": _("Группы прав"),
                    "icon": "lock",
                    "link": reverse_lazy("admin:auth_group_changelist"),
                },
            ],
        },
    ]
