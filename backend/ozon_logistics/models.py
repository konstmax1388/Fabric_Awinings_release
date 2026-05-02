from django.db import models
from django.utils.translation import gettext_lazy as _


class OzonLogisticsSettings(models.Model):
    """
    Singleton (pk=1): ключи частного приложения Seller API для Ozon Доставка.
    Не дублирует и не заменяет `api.OzonSellerApiSettings` (остатки / текущий checkout) —
    это отдельная пара Client-Id / Api-Key под скоупы seller-api.ozon-logistics и смежные.
    """

    client_id = models.CharField(
        _("Client-Id (частное приложение)"),
        max_length=64,
        blank=True,
        default="",
        help_text=_("Заголовок Client-Id. Можно задать через env OZON_LOGISTICS_SELLER_CLIENT_ID — он имеет приоритет."),
    )
    api_key = models.CharField(
        _("Api-Key"),
        max_length=512,
        blank=True,
        default="",
        help_text=_("Заголовок Api-Key. Env: OZON_LOGISTICS_SELLER_API_KEY (приоритет над полем)."),
    )
    seller_api_base_url = models.CharField(
        _("Базовый URL Seller API"),
        max_length=200,
        blank=True,
        default="",
        help_text=_("Пусто — https://api-seller.ozon.ru. Env: OZON_LOGISTICS_SELLER_API_URL."),
    )
    internal_notes = models.TextField(
        _("Внутренние заметки"),
        blank=True,
        default="",
        help_text=_("Не используются в API; для команды."),
    )
    seller_delivery_api_enabled = models.BooleanField(
        _("Использовать Seller API Ozon Доставка (новый поток)"),
        default=False,
        help_text=_(
            "Пока выключено — сайт и оплата работают по прежней схеме в «api». "
            "Когда включите и доработаете вызовы checkout → order_create из приложения ozon_logistics, "
            "можно постепенно переключать ветки кода на эти методы, не отключая старый поток до готовности."
        ),
    )
    order_create_only_internal_phones = models.BooleanField(
        _("Создание заказа в Ozon: только «внутренние» телефоны"),
        default=False,
        help_text=_(
            "Если включено — перед вызовом /v2/order/create проверяется телефон покупателя по списку ниже; "
            "иначе запрос не уходит в Ozon (защита от случайной реальной отгрузки на проде). "
            "Рекомендуется включить на проде, пока идёт тестирование."
        ),
    )
    internal_phones_allowlist = models.TextField(
        _("Список разрешённых телефонов для создания заказа в Ozon"),
        blank=True,
        default="",
        help_text=_(
            "Один номер в строке или через запятую. Форматы: 79001234567, +7 900 123-45-67, 9001234567. "
            "Учитывается только при включённой опции выше."
        ),
    )

    class Meta:
        verbose_name = _("Настройки Ozon Доставка (Seller API)")
        verbose_name_plural = _("Настройки Ozon Доставка (Seller API)")

    def __str__(self) -> str:
        return str(_("Ozon Доставка — настройки"))

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_solo(cls) -> "OzonLogisticsSettings":
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
