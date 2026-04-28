from __future__ import annotations

from typing import Any

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models
import re

from .slug_utils import ensure_slug_from_title


class ProductCategory(models.Model):
    """Категории каталога: слаг в URL (?category=) и в API."""

    slug = models.SlugField("Слаг", max_length=64, unique=True, db_index=True)
    title = models.CharField("Название", max_length=120)
    image = models.ImageField(
        "Фото для витрины",
        upload_to="categories/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
        help_text="Карточка «Виды тентов» на главной и боковое меню каталога. Рекомендуется горизонтальное фото.",
    )
    sort_order = models.PositiveIntegerField("Порядок в списках", default=0)
    is_published = models.BooleanField("На сайте", default=True, db_index=True)

    class Meta:
        ordering = ["sort_order", "title"]
        verbose_name = "Категория товара"
        verbose_name_plural = "Категории товаров"

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        ensure_slug_from_title(self)
        super().save(*args, **kwargs)


class Product(models.Model):
    slug = models.SlugField("Слаг", max_length=120, unique=True)
    title = models.CharField("Название", max_length=255)
    excerpt = models.TextField("Кратко", blank=True)
    description = models.TextField("Описание (plain)", blank=True)
    description_html = models.TextField(
        "Описание (HTML)",
        blank=True,
        help_text="Безопасная разметка для витрины. Если пусто — показывается обычное описание.",
    )
    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.PROTECT,
        related_name="products",
        verbose_name="Категория",
    )
    price_from = models.PositiveIntegerField("Цена, ₽", default=0)
    show_on_home = models.BooleanField("Показывать на главной", default=False, db_index=True)
    teasers = models.JSONField("Тизеры", default=list, blank=True)
    material_map = models.JSONField("Карта материалов", default=dict, blank=True)
    material_map_image = models.ImageField(
        "Карта материалов (фон)",
        upload_to="products/material-map/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
        help_text="Фоновая схема для блока «Карта материалов» в карточке товара.",
    )
    marketplace_links = models.JSONField("Ссылки МП", default=dict, blank=True)
    is_published = models.BooleanField("Опубликован", default=True, db_index=True)
    sort_order = models.PositiveIntegerField("Порядок", default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    bitrix_catalog_id = models.PositiveBigIntegerField(
        "ID товара в каталоге Битрикс24",
        null=True,
        blank=True,
        help_text="Если заполнено и у варианта пусто — в CRM (Astrum) подставится этот ID позиции каталога вместо текста без привязки.",
    )
    bitrix_xml_id = models.CharField(
        "Внешний код в Б24 (XML_ID)",
        max_length=191,
        blank=True,
        default="",
        db_index=True,
        help_text="Для массового сопоставления с каталогом: тот же XML_ID, что в Битрикс24 (команда sync_bitrix_catalog_ids).",
    )
    ozon_sku = models.BigIntegerField(
        "Ozon SKU (товар)",
        null=True,
        blank=True,
        help_text="SKU в каталоге Ozon для createOrder при доставке Ozon Логистика; если задан у варианта — используется он.",
    )
    cdek_weight_grams = models.PositiveIntegerField(
        "СДЭК: вес товара, г",
        null=True,
        blank=True,
        help_text=(
            "Фактический вес одной единицы товара для расчёта доставки и создания накладной. "
            "Если не заполнено — используется общий fallback из настроек интеграции СДЭК."
        ),
    )
    cdek_length_cm = models.PositiveIntegerField(
        "СДЭК: длина, см",
        null=True,
        blank=True,
        help_text=(
            "Габарит одной единицы товара. "
            "Если не заполнено — используется общий fallback из настроек интеграции СДЭК."
        ),
    )
    cdek_width_cm = models.PositiveIntegerField(
        "СДЭК: ширина, см",
        null=True,
        blank=True,
        help_text=(
            "Габарит одной единицы товара. "
            "Если не заполнено — используется общий fallback из настроек интеграции СДЭК."
        ),
    )
    cdek_height_cm = models.PositiveIntegerField(
        "СДЭК: высота, см",
        null=True,
        blank=True,
        help_text=(
            "Габарит одной единицы товара. "
            "Если не заполнено — используется общий fallback из настроек интеграции СДЭК."
        ),
    )
    warranty_months = models.PositiveSmallIntegerField(
        "Гарантия, мес (витрина)",
        null=True,
        blank=True,
        help_text="Пусто — на сайте подставляется «Каталог: гарантия по умолчанию» из настроек сайта.",
    )
    return_days = models.PositiveSmallIntegerField(
        "Возврат, дн (витрина)",
        null=True,
        blank=True,
        help_text="Пусто — на сайте подставляется «Каталог: возврат по умолчанию» из настроек сайта.",
    )

    class Meta:
        ordering = ["sort_order", "-updated_at", "id"]
        verbose_name = "Товар"
        verbose_name_plural = "Товары"

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        ensure_slug_from_title(self)
        super().save(*args, **kwargs)


class ProductVariant(models.Model):
    """Торговое предложение (как цвет/размер на WB): одна карточка товара, несколько вариантов."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="variants",
        verbose_name="Товар",
    )
    label = models.CharField("Подпись варианта", max_length=255)
    wb_nm_id = models.BigIntegerField("Артикул WB (nm)", null=True, blank=True, db_index=True)
    price_from = models.PositiveIntegerField("Цена, ₽", default=0)
    sort_order = models.PositiveIntegerField("Порядок", default=0)
    is_default = models.BooleanField("Вариант по умолчанию", default=False, db_index=True)
    marketplace_wb_url = models.URLField(
        "Ссылка на карточку WB этого варианта",
        max_length=2048,
        blank=True,
    )
    bitrix_catalog_id = models.PositiveBigIntegerField(
        "ID в каталоге Б24 (вариант)",
        null=True,
        blank=True,
        help_text="Приоритет над полем товара. ID позиции в каталоге CRM — см. документацию Astrum (product_id).",
    )
    bitrix_xml_id = models.CharField(
        "Внешний код в Б24 (XML_ID), вариант",
        max_length=191,
        blank=True,
        default="",
        db_index=True,
        help_text="Сопоставление с торговым предложением в Б24; иначе можно использовать артикул WB (см. команду sync_bitrix_catalog_ids).",
    )
    ozon_sku = models.BigIntegerField(
        "Ozon SKU (вариант)",
        null=True,
        blank=True,
        help_text="SKU в Ozon для этого предложения (приоритет над SKU товара).",
    )

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Вариант товара"
        verbose_name_plural = "Варианты товара"

    def __str__(self) -> str:
        return f"{self.product_id}: {self.label}"


class ProductSpecification(models.Model):
    """Характеристика на карточке (группа + имя + значение)."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="specifications",
        verbose_name="Товар",
    )
    group_name = models.CharField("Группа", max_length=255, blank=True)
    name = models.CharField("Параметр", max_length=255)
    value = models.CharField("Значение", max_length=2048)
    sort_order = models.PositiveIntegerField("Порядок", default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Характеристика"
        verbose_name_plural = "Характеристики"

    def __str__(self) -> str:
        return f"{self.name}: {self.value[:40]}"


class CatalogFilterKey(models.Model):
    """
    Какой параметр (группа + имя) участвует в фильтре каталога.
    Список кандидатов и счётчики — кнопка «Сформировать» в админке; включение — вручную.
    """

    group_name = models.CharField("Группа (как в товаре)", max_length=255, blank=True, default="")
    name = models.CharField("Параметр (как в товаре)", max_length=255, db_index=True)
    label = models.CharField(
        "Подпись в витрине",
        max_length=255,
        blank=True,
        help_text="Пусто — показывать «Параметр»; иначе этот текст (например, короткий заголовок).",
    )
    is_enabled = models.BooleanField("Показывать в фильтре каталога", default=False, db_index=True)
    sort_order = models.PositiveIntegerField("Порядок", default=0, db_index=True)
    product_count = models.PositiveIntegerField(
        "Товаров с параметром (последний разбор)",
        default=0,
        editable=True,
        help_text="Сколько опубликованных товаров содержат эту характеристику — после «Сформировать из товаров».",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Параметр фильтра каталога"
        verbose_name_plural = "Фильтр каталога: параметры"
        ordering = ("sort_order", "id")
        constraints = [
            models.UniqueConstraint(
                fields=["group_name", "name"],
                name="api_catalogfilterkey_group_name_name_uniq",
            ),
        ]

    def __str__(self) -> str:
        g = (self.group_name or "").strip()
        n = (self.name or "").strip()
        if g and n:
            return f"{g} — {n}"
        return n or f"#{self.pk}"

    def clean(self) -> None:
        self.group_name = (self.group_name or "").strip()
        self.name = (self.name or "").strip()
        if not self.name:
            from django.core.exceptions import ValidationError

            raise ValidationError({"name": "Параметр обязателен."})


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images_rel"
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name="images",
        verbose_name="Вариант",
        null=True,
        blank=True,
    )
    image = models.ImageField(
        "Файл на сайте",
        upload_to="products/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    sort_order = models.PositiveIntegerField("Порядок", default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Изображение товара"
        verbose_name_plural = "Изображения товаров"


class PortfolioProject(models.Model):
    slug = models.SlugField("Слаг", max_length=120, unique=True)
    title = models.CharField("Название", max_length=255)
    category = models.CharField("Категория / подпись", max_length=64, blank=True)
    before_image_file = models.ImageField(
        "Фото «до»",
        upload_to="portfolio/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    after_image_file = models.ImageField(
        "Фото «после»",
        upload_to="portfolio/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    completed_on = models.DateField("Дата завершения", null=True, blank=True)
    is_published = models.BooleanField("На сайте", default=True, db_index=True)
    sort_order = models.PositiveIntegerField("Порядок", default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]
        verbose_name = "Проект портфолио"
        verbose_name_plural = "Портфолио"

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        ensure_slug_from_title(self)
        super().save(*args, **kwargs)


class Review(models.Model):
    name = models.CharField("Имя", max_length=120)
    city = models.CharField("Город", max_length=120, blank=True)
    reviewed_on = models.DateField("Дата отзыва", null=True, blank=True)
    text = models.TextField("Текст")
    rating = models.PositiveSmallIntegerField("Оценка (1–5)", default=5)
    publication_consent = models.BooleanField("Согласие на публикацию", default=False)
    is_moderated = models.BooleanField("Проверено менеджером", default=False, db_index=True)
    moderated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="moderated_reviews",
        verbose_name="Кто подтвердил",
    )
    moderated_at = models.DateTimeField("Когда подтверждено", null=True, blank=True)
    submitted_from_site = models.BooleanField("Отправлен с сайта", default=False, db_index=True)
    photo_file = models.ImageField(
        "Фото",
        upload_to="reviews/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    video_url = models.URLField("Видео (URL)", max_length=2048, blank=True)
    is_published = models.BooleanField("На сайте", default=False, db_index=True)
    sort_order = models.PositiveIntegerField("Порядок", default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]
        verbose_name = "Отзыв"
        verbose_name_plural = "Отзывы"

    def __str__(self) -> str:
        return self.name

    def clean(self):
        super().clean()
        if self.is_published and not self.publication_consent:
            raise ValidationError({"publication_consent": "Без согласия клиента публиковать отзыв нельзя."})
        if self.is_published and not self.is_moderated:
            raise ValidationError({"is_moderated": "Сначала подтвердите отзыв менеджером."})


class BlogPost(models.Model):
    slug = models.SlugField("Слаг", max_length=160, unique=True)
    title = models.CharField("Заголовок", max_length=255)
    excerpt = models.TextField("Анонс", blank=True)
    body = models.TextField("Текст статьи", blank=True)
    cover_image = models.ImageField(
        "Обложка",
        upload_to="blog/covers/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    published_at = models.DateField("Дата публикации", null=True, blank=True)
    is_published = models.BooleanField("На сайте", default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]
        verbose_name = "Статья блога"
        verbose_name_plural = "Блог"

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        ensure_slug_from_title(self)
        super().save(*args, **kwargs)


class CalculatorLead(models.Model):
    name = models.CharField("Имя", max_length=120)
    phone = models.CharField("Телефон", max_length=40)
    comment = models.TextField("Комментарий", blank=True)
    length_m = models.DecimalField("Длина, м", max_digits=8, decimal_places=2)
    width_m = models.DecimalField("Ширина, м", max_digits=8, decimal_places=2)
    material_id = models.CharField("ID материала (код)", max_length=64)
    material_label = models.CharField("Материал (подпись)", max_length=255, blank=True)
    options = models.JSONField("Опции (JSON)", default=list, blank=True)
    estimated_price_rub = models.PositiveIntegerField("Оценка, ₽", default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Заявка (калькулятор)"
        verbose_name_plural = "Заявки калькулятора"

    def __str__(self) -> str:
        return f"{self.name} {self.created_at:%Y-%m-%d}"


class CallbackLead(models.Model):
    """Заявка на обратный звонок (например с Hero на главной)."""

    class Source(models.TextChoices):
        HERO = "hero", "Главная (Hero)"
        OTHER = "other", "Другое"

    name = models.CharField("Имя", max_length=120)
    phone = models.CharField("Телефон", max_length=40)
    comment = models.TextField("Комментарий", blank=True)
    source = models.CharField(
        "Источник",
        max_length=32,
        choices=Source.choices,
        default=Source.HERO,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Заявка (обратный звонок)"
        verbose_name_plural = "Заявки: обратный звонок"

    def __str__(self) -> str:
        return f"{self.name} {self.created_at:%Y-%m-%d}"


class CartOrder(models.Model):
    """Локальное зеркало заказа. Синхронизация с Б24: приложение Astrum «Заявки с сайта» (см. docs/astrum-bitrix-crm.md)."""

    class OrderSource(models.TextChoices):
        CHECKOUT = "checkout", "Оформление (корзина)"
        ONE_CLICK = "one_click", "Заказ в 1 клик"

    class FulfillmentStatus(models.TextChoices):
        RECEIVED = "received", "Принят с сайта"
        AWAITING_PAYMENT = "awaiting_payment", "Ожидает оплаты"
        PAID = "paid", "Оплачен"
        PROCESSING = "processing", "В обработке"
        SHIPPED = "shipped", "Отправлен"
        DELIVERED = "delivered", "Доставлен"
        CANCELLED = "cancelled", "Отменён"

    class BitrixSyncStatus(models.TextChoices):
        NOT_SENT = "not_sent", "Не отправляли в Б24"
        PENDING = "pending", "Очередь / повтор"
        SYNCED = "synced", "В Битрикс24"
        ERROR = "error", "Ошибка синхронизации"

    class PaymentStatus(models.TextChoices):
        NOT_REQUIRED = "not_required", "Оплата не требовалась"
        PENDING = "pending", "Ожидает оплаты"
        AUTHORIZED = "authorized", "Предавторизация"
        CAPTURED = "captured", "Оплачен"
        FAILED = "failed", "Ошибка оплаты"
        REFUNDED = "refunded", "Возврат"

    class CdekSyncStatus(models.TextChoices):
        NOT_REQUIRED = "not_required", "Не требуется"
        PENDING = "pending", "Ожидает отправки"
        SUCCESS = "success", "Успешно отправлено"
        ERROR = "error", "Ошибка отправки"

    order_ref = models.CharField("Номер заказа", max_length=40, unique=True, db_index=True)
    order_source = models.CharField(
        "Источник заказа",
        max_length=20,
        choices=OrderSource.choices,
        default=OrderSource.CHECKOUT,
        db_index=True,
    )
    customer_name = models.CharField("Имя покупателя", max_length=120)
    customer_phone = models.CharField("Телефон", max_length=40)
    customer_email = models.EmailField("Email", blank=True)
    customer_comment = models.TextField("Комментарий покупателя", blank=True)
    lines = models.JSONField(
        "Позиции заказа (данные с сайта)",
        default=list,
        help_text=(
            "Список товарных строк из корзины. В каждой позиции: наименование (title), количество (qty), "
            "ориентировочная цена (priceFrom), ссылка на карточку в каталоге (slug), "
            "идентификаторы товара и варианта на сайте (productId, variantId)."
        ),
    )
    total_approx = models.PositiveIntegerField(
        "Сумма заказа (ориентир)",
        default=0,
        help_text="Итого к оплате: товары и доставка (ориентировочно).",
    )
    goods_subtotal_approx = models.PositiveIntegerField(
        "Сумма товаров (ориентир)",
        default=0,
        help_text="Сумма по товарным строкам без доставки.",
    )
    delivery_price_rub = models.PositiveIntegerField(
        "Стоимость доставки, ₽",
        default=0,
        help_text="Доставка к оплате по этому заказу (с учётом порога бесплатной доставки в настройках).",
    )
    manager_letter = models.TextField("Текст письма менеджеру", blank=True)
    client_ack = models.TextField("Текст для клиента (подтверждение)", blank=True)
    created_at = models.DateTimeField("Дата создания", auto_now_add=True)

    user = models.ForeignKey(
        "auth.User",
        verbose_name="Покупатель (аккаунт)",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="cart_orders",
    )
    fulfillment_status = models.CharField(
        "Статус выполнения",
        max_length=32,
        choices=FulfillmentStatus.choices,
        default=FulfillmentStatus.RECEIVED,
        db_index=True,
    )
    payment_status = models.CharField(
        "Оплата",
        max_length=32,
        choices=PaymentStatus.choices,
        default=PaymentStatus.NOT_REQUIRED,
        db_index=True,
    )
    payment_provider = models.CharField("Платёжный провайдер", max_length=64, blank=True)
    payment_external_id = models.CharField("ID платежа у провайдера", max_length=128, blank=True)

    bitrix_entity_id = models.CharField(
        "ID в Битрикс24 (сделка/заказ)", max_length=128, blank=True, db_index=True
    )
    bitrix_sync_status = models.CharField(
        "Синхронизация Б24",
        max_length=16,
        choices=BitrixSyncStatus.choices,
        default=BitrixSyncStatus.NOT_SENT,
        db_index=True,
    )
    bitrix_sync_error = models.TextField("Ошибка синхронизации Б24", blank=True)
    bitrix_sync_attempts = models.PositiveSmallIntegerField("Попыток отправки в Б24", default=0)

    class DeliveryMethod(models.TextChoices):
        PICKUP = "pickup", "Самовывоз со склада"
        CDEK = "cdek", "СДЭК (ПВЗ / курьер)"
        OZON_LOGISTICS = "ozon_logistics", "Логистика Ozon"

    class PaymentMethod(models.TextChoices):
        CASH_PICKUP = "cash_pickup", "Наличные при самовывозе"
        COD_CDEK = "cod_cdek", "Наложенный платёж (СДЭК)"
        CARD_ONLINE = "card_online", "Онлайн-оплата (эквайринг Ozon Pay)"

    delivery_method = models.CharField(
        "Способ доставки",
        max_length=32,
        choices=DeliveryMethod.choices,
        default=DeliveryMethod.PICKUP,
        db_index=True,
    )
    payment_method = models.CharField(
        "Способ оплаты",
        max_length=32,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH_PICKUP,
        db_index=True,
    )
    acquiring_payload = models.JSONField(
        "Данные эквайринга (ссылка на оплату, id заказа Ozon Pay и т.д.)",
        default=dict,
        blank=True,
    )

    delivery_provider = models.CharField("Доставка (код, legacy)", max_length=32, blank=True)
    delivery_snapshot = models.JSONField("Снимок доставки (ПВЗ, тариф)", default=dict, blank=True)
    cdek_tracking = models.CharField("Трек СДЭК", max_length=64, blank=True)
    cdek_sync_status = models.CharField(
        "Синхронизация СДЭК",
        max_length=24,
        choices=CdekSyncStatus.choices,
        default=CdekSyncStatus.NOT_REQUIRED,
        db_index=True,
    )
    cdek_sync_attempts = models.PositiveSmallIntegerField("Попыток отправки в СДЭК", default=0)
    cdek_sync_error = models.TextField("Ошибка синхронизации СДЭК", blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Заказ (корзина)"
        verbose_name_plural = "Заказы корзины"

    def __str__(self) -> str:
        return self.order_ref


def default_seo_title_templates() -> dict[str, str]:
    """Шаблоны title по умолчанию (см. help_text у SiteSettings.seo_title_templates)."""
    return {
        "home": "",
        "listing": "{title}{suffix}",
        "static": "{title} — {siteName}",
        "article": "{title}{suffix}",
        "emdash": "{title} — {siteName}",
    }


_SEO_TPL_KEYS = frozenset({"home", "listing", "static", "article", "emdash"})
_SEO_TPL_PLACEHOLDERS = frozenset({"title", "siteName", "suffix", "sep"})
_SEO_TPL_BRACE = re.compile(r"\{([^}]+)\}")


def validate_seo_title_templates_value(raw: Any) -> dict[str, str]:
    if raw is None or raw == {}:
        return {}
    if not isinstance(raw, dict):
        raise ValidationError({"seo_title_templates": "Ожидается JSON-объект с ключами шаблонов title."})
    out: dict[str, str] = {}
    for k, v in raw.items():
        ks = str(k).strip()
        if ks not in _SEO_TPL_KEYS:
            raise ValidationError({"seo_title_templates": f"Неизвестный ключ шаблона: {ks}."})
        if not isinstance(v, str):
            raise ValidationError({"seo_title_templates": f"Шаблон «{ks}»: ожидается строка."})
        s = v.strip()
        if len(s) > 500:
            raise ValidationError({"seo_title_templates": f"Шаблон «{ks}»: не длиннее 500 символов."})
        for m in _SEO_TPL_BRACE.finditer(s):
            ph = m.group(1).strip()
            if ph not in _SEO_TPL_PLACEHOLDERS:
                raise ValidationError(
                    {
                        "seo_title_templates": f"Шаблон «{ks}»: недопустимый плейсхолдер. Допустимо: title, siteName, suffix, sep."
                    }
                )
        out[ks] = s
    return out


class SiteSettings(models.Model):
    """Singleton (pk=1): витрина маркетплейсов и глобальные ссылки."""

    class ProductPhotoAspect(models.TextChoices):
        PORTRAIT_3_4 = "portrait_3_4", "Портрет 3:4 (рекомендуется 900×1200 px)"
        SQUARE = "square", "Квадрат 1:1"

    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)

    show_marketplace_wb = models.BooleanField("Показывать Wildberries", default=True)
    show_marketplace_ozon = models.BooleanField("Показывать Ozon", default=True)
    show_marketplace_ym = models.BooleanField("Показывать Яндекс Маркет", default=False)
    show_marketplace_avito = models.BooleanField("Показывать Авито", default=False)

    show_calculator = models.BooleanField(
        "Показывать калькулятор на главной",
        default=True,
        help_text="Если выключено, блок скрыт; кнопка в герое ведёт в каталог. Тексты калькулятора — в «Главная страница (контент)».",
    )
    show_portfolio = models.BooleanField(
        "Показывать блок портфолио на главной",
        default=True,
        help_text="Если выключено, блок портфолио скрыт на главной странице.",
    )

    product_photo_aspect = models.CharField(
        "Формат фото товаров на витрине",
        max_length=32,
        choices=ProductPhotoAspect.choices,
        default=ProductPhotoAspect.PORTRAIT_3_4,
        help_text=(
            "Соотношение сторон рамки каталога и карточки товара. Изображения показываются целиком, без обрезки "
            "(поля под фоном, если пропорции другие). Рекомендуемый размер файлов: 900×1200 для портрета или "
            "квадрат для режима 1:1."
        ),
    )
    catalog_intro = models.TextField(
        "Каталог: текст под заголовком",
        blank=True,
        default=(
            "Тенты, навесы и шатры для транспорта, складов, общепита и мероприятий."
        ),
        help_text="Страница /catalog — абзац под заголовком «Каталог».",
    )
    catalog_warranty_months = models.PositiveSmallIntegerField(
        "Каталог: гарантия по умолчанию, мес.",
        default=3,
        help_text="Показ в карточках товара, если у товара не задана своя гарантия.",
    )
    catalog_return_days = models.PositiveSmallIntegerField(
        "Каталог: возврат по умолчанию, дн.",
        default=14,
        help_text="Показ в карточках товара, если у товара не задан свой срок возврата.",
    )

    global_url_wb = models.URLField("URL витрины WB (общий)", max_length=512, blank=True)
    global_url_ozon = models.URLField("URL витрины Ozon (общий)", max_length=512, blank=True)
    global_url_ym = models.URLField("URL Яндекс Маркет (общий)", max_length=512, blank=True)
    global_url_avito = models.URLField("URL Авито (общий)", max_length=512, blank=True)

    site_name = models.CharField("Название сайта (шапка, подвал)", max_length=120, default="Фабрика Тентов")
    site_tagline = models.CharField(
        "Слоган в подвале",
        max_length=255,
        blank=True,
        default="Тенты на заказ для бизнеса и частных клиентов",
    )
    footer_note = models.CharField(
        "Подвал: текст под слоганом",
        max_length=255,
        blank=True,
        default="Производство и монтаж под ключ.",
    )
    logo = models.FileField(
        "Логотип (SVG, PNG, WebP)",
        upload_to="branding/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    favicon = models.FileField(
        "Фавикон (.ico или PNG)",
        upload_to="branding/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    phone_display = models.CharField("Телефон (как на сайте)", max_length=64, blank=True, default="+7 (800) 000-00-00")
    phone_href = models.CharField("Ссылка tel:", max_length=64, blank=True, default="tel:+78000000000")
    email = models.EmailField("Email", blank=True, default="hello@fabric-awnings.example")
    address = models.CharField(
        "Адрес (текст)",
        max_length=400,
        blank=True,
        default="",
    )
    legal = models.CharField(
        "Реквизиты (кратко)",
        max_length=400,
        blank=True,
        default='ООО «Фабрика Тентов», ИНН 0000000000',
    )
    footer_vk_url = models.URLField("Ссылка «ВКонтакте»", max_length=512, blank=True)
    footer_telegram_url = models.URLField("Ссылка Telegram", max_length=512, blank=True)
    show_social_links = models.BooleanField(
        "Показывать блок соцсетей на сайте",
        default=False,
        help_text="Если выключено, раздел «Соцсети» в подвале не отображается (ссылки можно заранее заполнить).",
    )

    contacts_page_title = models.CharField(
        "Страница «Контакты»: заголовок (H1)",
        max_length=120,
        default="Контакты",
    )
    contacts_intro = models.TextField(
        "Страница «Контакты»: вводный текст",
        blank=True,
        help_text="Необязательно. Показывается под заголовком, до реквизитов и списка контактов.",
    )
    contacts_hours = models.CharField(
        "Страница «Контакты»: режим работы",
        max_length=200,
        blank=True,
        default="Пн–Пт 9:00–18:00",
    )
    contacts_meta_description = models.CharField(
        "Страница «Контакты»: описание для SEO (meta description)",
        max_length=500,
        blank=True,
        help_text="Пусто — на сайте подставится краткое описание из адреса.",
    )
    contacts_back_link_label = models.CharField(
        "Страница «Контакты»: текст ссылки «назад на главную»",
        max_length=120,
        blank=True,
        default="← На главную",
    )
    analytics_yandex_enabled = models.BooleanField(
        "Яндекс Метрика: включить счётчик",
        default=False,
        help_text="Включает загрузку тега Метрики на витрине.",
    )
    analytics_yandex_counter_id = models.CharField(
        "Яндекс Метрика: ID счётчика",
        max_length=32,
        blank=True,
        default="",
        help_text="Только цифры, например 12345678.",
    )
    analytics_head_snippet = models.TextField(
        "Аналитика: сниппет в <head>",
        blank=True,
        default="",
        help_text="HTML/JS, который будет вставлен в начало <head> на витрине.",
    )
    analytics_body_start_snippet = models.TextField(
        "Аналитика: сниппет после <body>",
        blank=True,
        default="",
        help_text="HTML/JS, который будет вставлен в начало <body> на витрине.",
    )
    body_end_snippet = models.TextField(
        "Сниппет перед </body> (виджет CRM, онлайн-чат)",
        blank=True,
        default="",
        help_text="HTML/JS, в конец <body> на витрине (например, код кнопки с сайта Битрикс24).",
    )
    seo_allow_indexing = models.BooleanField(
        "SEO: разрешить индексацию",
        default=True,
        help_text="Если выключено, витрина отдает robots noindex,nofollow.",
    )
    seo_region = models.CharField(
        "SEO: регион",
        max_length=16,
        blank=True,
        default="RU",
        help_text="Код региона для structured data, например RU.",
    )
    seo_default_meta_description = models.TextField(
        "SEO: мета-описание по умолчанию",
        blank=True,
        default="",
        help_text="Используется, если у конкретной страницы нет своего description.",
    )
    seo_title_suffix = models.CharField(
        "SEO: суффикс title",
        max_length=120,
        blank=True,
        default="",
        help_text="Например: «— Фабрика Тентов». Добавляется к заголовкам страниц.",
    )
    seo_locale = models.CharField(
        "SEO: locale",
        max_length=16,
        blank=True,
        default="ru_RU",
        help_text="Open Graph locale, например ru_RU.",
    )
    seo_og_image = models.ImageField(
        "SEO: изображение по умолчанию (og:image)",
        upload_to="branding/seo-og/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
        help_text="Используется в Open Graph, если у страницы нет своего изображения (тематическое 1200×630 или квадрат, до ~2 МБ).",
    )
    seo_meta_description_max = models.PositiveSmallIntegerField(
        "SEO: max длина meta description (символы)",
        default=160,
        help_text="Подсказка для витрины: обрезка автоматически сгенерированных описаний (текст из каталога, блог и т.д.).",
    )
    seo_twitter_card = models.CharField(
        "SEO: Twitter / X card",
        max_length=32,
        blank=True,
        default="summary_large_image",
        help_text="summary или summary_large_image (как у крупных CMS: карточка в соцсетях).",
    )
    seo_title_separator = models.CharField(
        "SEO: разделитель в шаблоне title (плейсхолдер {sep})",
        max_length=16,
        blank=True,
        default=" | ",
        help_text="Например « | » или « — ». Подставляется в шаблоны, где указано {sep}.",
    )
    seo_title_templates = models.JSONField(
        "SEO: шаблоны <title> по типам страниц",
        default=default_seo_title_templates,
        blank=True,
        help_text="JSON. Ключи: home, listing, static, article, emdash. "
        "Плейсхолдеры: {title}, {siteName}, {suffix} (суффикс из поля «суффикс title»), {sep}. "
        "Пустой home — как сейчас: заголовок из контента главной + суффикс. "
        "Перекрытие: у статичных страниц, товаров и блога заполненный в карточке meta title важнее шаблона.",
    )

    # Блок карты + формы на главной (перекрывает mapForm из «Главная страница», если заполнено)
    map_heading = models.CharField(
        "Карта на главной: заголовок блока",
        max_length=200,
        blank=True,
        default="",
        help_text="Пусто — берётся из контента главной (JSON).",
    )
    map_subheading = models.TextField(
        "Карта на главной: подзаголовок",
        blank=True,
        default="",
    )
    map_iframe_src = models.TextField(
        "Карта: URL iframe (Яндекс/Google и т.д.)",
        blank=True,
        default="",
        help_text=(
            "Только полный src из iframe (не ссылку yandex.ru/maps/…). "
            "Яндекс.Карты: в ll и pt — долгота,широта; в URL запятую пишите как %2C, например "
            "…?ll=41.124649%2C56.925095&z=16&pt=41.124649%2C56.925095%2Cpm2rdm. "
            "Если в адресе вместо запятой оказался символ @ (%41) — метка уедет не туда."
        ),
    )
    map_title = models.CharField(
        "Карта: title у iframe (доступность)",
        max_length=200,
        blank=True,
        default="",
    )
    map_form_name_label = models.CharField(
        "Форма: подпись «имя»",
        max_length=80,
        blank=True,
        default="",
    )
    map_form_phone_label = models.CharField(
        "Форма: подпись «телефон»",
        max_length=80,
        blank=True,
        default="",
    )
    map_form_comment_label = models.CharField(
        "Форма: подпись «комментарий»",
        max_length=80,
        blank=True,
        default="",
    )
    map_name_placeholder = models.CharField(
        "Плейсхолдер: имя",
        max_length=120,
        blank=True,
        default="",
    )
    map_phone_placeholder = models.CharField(
        "Плейсхолдер: телефон",
        max_length=80,
        blank=True,
        default="",
    )
    map_comment_placeholder = models.CharField(
        "Плейсхолдер: комментарий",
        max_length=200,
        blank=True,
        default="",
    )
    map_submit_button = models.CharField(
        "Текст кнопки отправки",
        max_length=80,
        blank=True,
        default="",
    )
    map_submitting = models.CharField(
        "Текст при отправке",
        max_length=80,
        blank=True,
        default="",
    )
    map_success_message = models.TextField(
        "Сообщение после успешной отправки",
        blank=True,
        default="",
    )

    notification_recipients = models.TextField(
        "Получатели заявок (email)",
        blank=True,
        help_text="Кому слать письма о заявках с калькулятора и из корзины. Несколько адресов — через запятую или с новой строки.",
    )
    smtp_enabled = models.BooleanField(
        "Включить отправку через SMTP",
        default=False,
        help_text="Если выключено, заявки только сохраняются в админке, письма не отправляются.",
    )
    smtp_host = models.CharField("SMTP сервер", max_length=255, blank=True, default="")
    smtp_port = models.PositiveIntegerField("SMTP порт", default=587)
    smtp_use_tls = models.BooleanField(
        "TLS (STARTTLS)",
        default=True,
        help_text="Для порта 587. Не включайте вместе с «SSL (465)» — при обоих флажках используется только SSL.",
    )
    smtp_use_ssl = models.BooleanField(
        "SSL (порт 465)",
        default=False,
        help_text="Implicit SSL с первого пакета. Если включено, STARTTLS отключается автоматически.",
    )
    smtp_user = models.CharField("SMTP логин", max_length=255, blank=True, default="")
    smtp_password = models.CharField(
        "SMTP пароль",
        max_length=255,
        blank=True,
        default="",
        help_text="Для Яндекс/Google — пароль приложения. Можно не хранить в БД: задайте переменную окружения DJANGO_SMTP_PASSWORD (имеет приоритет).",
    )
    email_outbound_from = models.CharField(
        "Отправитель писем (From)",
        max_length=255,
        blank=True,
        default="",
        help_text="Нужен реальный email. Можно только имя (например «Фабрика Тентов») — тогда к почте из «Контакты на витрине» добавится подпись. Или полностью: «Название» <send@домен.ru>.",
    )

    class AstrumContactBehavior(models.TextChoices):
        SELECT_EXISTING = "SELECT_EXISTING", "Искать контакт по телефону/email, иначе создать"
        CREATE_ANYWAY = "CREATE_ANYWAY", "Всегда создавать новый контакт"

    class AstrumEntityBehavior(models.TextChoices):
        ADD_TO_EXISTING = "ADD_TO_EXISTING", "Добавлять к активной сделке/лиду"
        CREATE_ANYWAY = "CREATE_ANYWAY", "Всегда новая сделка/лид"
        IGNORE_EXISTING = "IGNORE_EXISTING", "Не создавать, если уже есть активная"

    astrum_crm_enabled = models.BooleanField(
        "Включить отправку заказов в Битрикс24 (Astrum)",
        default=False,
        help_text="Заказы из корзины уходят в приложение «Заявки с сайта». Пока выключено — можно задать ключ из .env (ASTRUM_CRM_API_KEY).",
    )
    astrum_crm_api_key = models.CharField(
        "API-ключ Astrum (X-API-Key)",
        max_length=256,
        blank=True,
        default="",
        help_text="Из панели приложения в Битрикс24. Не публикуйте в открытых репозиториях.",
    )
    astrum_crm_assigned_default = models.PositiveIntegerField(
        "ID ответственного в Б24 (assigned_default)",
        null=True,
        blank=True,
        help_text="Числовой ID пользователя Bitrix24. Обязателен при включённой интеграции.",
    )
    astrum_crm_api_url = models.URLField(
        "URL endpoint заказа",
        max_length=512,
        default="https://app-5.astrum.agency/api/order",
        help_text="Обычно не меняйте, если провайдер не дал другой адрес.",
    )
    astrum_crm_contact_behavior = models.CharField(
        "Поведение с контактами",
        max_length=32,
        choices=AstrumContactBehavior.choices,
        default=AstrumContactBehavior.SELECT_EXISTING,
        help_text=(
            "Рекомендуется «Искать по телефону/email»: CRM сопоставляет контакт с существующим по телефону и email "
            "из заказа; если не найден — создаёт нового. На сайте при оформлении email обязателен."
        ),
    )
    astrum_crm_entity_behavior = models.CharField(
        "Поведение со сделкой/лидом",
        max_length=32,
        choices=AstrumEntityBehavior.choices,
        default=AstrumEntityBehavior.CREATE_ANYWAY,
        help_text="Для интернет-магазина обычно «Всегда новая сделка» — каждый заказ с сайта отдельная сделка в Б24.",
    )
    astrum_crm_deal_title_prefix = models.CharField(
        "Префикс названия сделки",
        max_length=120,
        default="Заказ с сайта",
        help_text="В Б24: «{префикс} {номер заказа}», например «Заказ с сайта FAB-…».",
    )
    astrum_crm_timeout_seconds = models.PositiveSmallIntegerField(
        "Таймаут HTTP (сек.)",
        default=15,
        help_text="От 5 до 120. Запрос к Astrum при оформлении заказа.",
    )

    bitrix24_webhook_base = models.CharField(
        "База URL входящего вебхука REST (каталог Б24)",
        max_length=512,
        blank=True,
        default="",
        help_text=(
            "До секрета включительно, без завершающего слэша, например "
            "https://портал.bitrix24.ru/rest/1/код. Права вебхука: «Каталог». "
            "Используется командой sync_bitrix_catalog_ids. Пусто — переменная BITRIX24_WEBHOOK_BASE в .env."
        ),
    )
    bitrix24_catalog_product_iblock_id = models.PositiveIntegerField(
        "ID инфоблока товаров (catalog.product.list)",
        null=True,
        blank=True,
        help_text="Пусто — BITRIX24_CATALOG_PRODUCT_IBLOCK_ID из .env.",
    )
    bitrix24_catalog_offer_iblock_id = models.PositiveIntegerField(
        "ID инфоблока торговых предложений (catalog.product.offer.list)",
        null=True,
        blank=True,
        help_text="Пусто — BITRIX24_CATALOG_OFFER_IBLOCK_ID из .env.",
    )

    # --- Оформление заказа: самовывоз / СДЭК / Ozon (доставка и эквайринг) ---
    checkout_minimum_order_rub = models.PositiveIntegerField(
        "Минимальная сумма заказа (товары), ₽",
        default=0,
        help_text="0 — без ограничения. Иначе оформление возможно, если сумма товарных позиций не ниже этого порога.",
    )
    checkout_free_delivery_from_rub = models.PositiveIntegerField(
        "Бесплатная доставка от суммы товаров, ₽",
        default=0,
        help_text="0 — порог не используется. Если сумма товаров не ниже этого значения, стоимость доставки СДЭК на витрине обнуляется.",
    )
    checkout_pickup_enabled = models.BooleanField(
        "Самовывоз: показывать на сайте",
        default=True,
        help_text="Покупатель может выбрать получение со склада; адрес и режим — поля ниже.",
    )
    pickup_point_title = models.CharField(
        "Самовывоз: название точки",
        max_length=200,
        default="Склад",
        help_text="Например: «Склад», «Производство».",
    )
    pickup_point_address = models.TextField(
        "Самовывоз: полный адрес",
        blank=True,
        default="",
        help_text="Показывается на шаге оформления и в письме клиенту.",
    )
    pickup_point_hours = models.CharField(
        "Самовывоз: режим работы выдачи",
        max_length=255,
        blank=True,
        default="",
    )
    pickup_point_note = models.TextField(
        "Самовывоз: как проехать / комментарий",
        blank=True,
        default="",
    )
    pickup_point_lat = models.DecimalField(
        "Самовывоз: широта (опционально, для карты)",
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    pickup_point_lng = models.DecimalField(
        "Самовывоз: долгота (опционально)",
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    class CdekCheckoutUI(models.TextChoices):
        WIDGET = "widget", "Виджет v3 (карта Яндекса)"
        CUSTOM = "custom", "Свой интерфейс: список ПВЗ по API, без Яндекса"
    
    class CdekRecipientDeliveryFeeMode(models.TextChoices):
        OFF = "off", "Отключено"
        FIXED = "fixed", "Фиксированная сумма (₽)"
        PERCENT = "percent", "Процент от суммы товаров"

    cdek_enabled = models.BooleanField(
        "СДЭК: включить на сайте",
        default=False,
        help_text="Доставка СДЭК; учётная запись API — ниже. Виджет ПВЗ подключается на фронте (см. docs).",
    )
    cdek_checkout_ui = models.CharField(
        "СДЭК: интерфейс выбора ПВЗ на витрине",
        max_length=16,
        choices=CdekCheckoutUI.choices,
        default=CdekCheckoutUI.WIDGET,
        help_text="«Виджет» — официальный виджет cdek-it и ключ Яндекс.Карт. «Свой» — список пунктов из API СДЭК без карты и без ключа Яндекса.",
    )
    cdek_test_mode = models.BooleanField(
        "СДЭК: тестовый контур (api.edu.cdek.ru)",
        default=True,
        help_text="Выкл. — боевой https://api.cdek.ru и боевые ключи.",
    )
    cdek_account = models.CharField(
        "СДЭК: Account (client_id для OAuth)",
        max_length=128,
        blank=True,
        default="",
    )
    cdek_secure_password = models.CharField(
        "СДЭК: Secure password (client_secret)",
        max_length=256,
        blank=True,
        default="",
        help_text="Не публикуйте. Можно задать CDEK_SECURE в .env — приоритет над полем (см. docs).",
    )
    cdek_widget_script_url = models.URLField(
        "СДЭК: URL скрипта виджета",
        max_length=512,
        blank=True,
        default="",
        help_text="Пусто — по умолчанию v3 с jsDelivr: @cdek-it/widget@3. Иначе свой URL (см. wiki cdek-it/widget).",
    )
    cdek_yandex_map_api_key = models.CharField(
        "СДЭК: ключ API Яндекс.Карт (виджет)",
        max_length=128,
        blank=True,
        default="",
        help_text="Ключ JavaScript API Яндекс.Карт (виджет СДЭК v3). В кабинете разработчика Яндекса задайте HTTP Referrer вашего сайта.",
    )
    cdek_widget_sender_city = models.CharField(
        "СДЭК: город отправления (виджет)",
        max_length=200,
        blank=True,
        default="",
        help_text="Город или адрес отправления для виджета (параметр from). Пусто — первая часть адреса самовывоза до запятой, иначе «Москва».",
    )
    cdek_manual_pvz_enabled = models.BooleanField(
        "СДЭК: разрешить ручной ввод ПВЗ",
        default=True,
        help_text="Если выключено, на витрине покупатель сможет выбрать ПВЗ только через виджет (без ручного кода).",
    )
    cdek_tariff_codes_office = models.CharField(
        "СДЭК: коды тарифов для ПВЗ (через запятую)",
        max_length=500,
        blank=True,
        default="",
        help_text="Числовые коды тарифов API СДЭК v2 для доставки в пункт выдачи (виджет). Пусто — доступны все тарифы виджета. Ниже на странице — загрузка списка из API.",
    )
    cdek_tariff_codes_door = models.CharField(
        "СДЭК: коды тарифов для курьера до двери",
        max_length=500,
        blank=True,
        default="",
        help_text="Тарифы для режима «до двери». Пусто — все. Список можно подобрать из API блоком ниже.",
    )
    cdek_tariff_codes_pickup = models.CharField(
        "СДЭК: коды тарифов для постаматов",
        max_length=500,
        blank=True,
        default="",
        help_text="Тарифы для постаматов (если включены в виджете). Пусто — все. Список можно подобрать из API блоком ниже.",
    )
    cdek_default_weight_grams = models.PositiveIntegerField(
        "СДЭК: общий вес по умолчанию, г",
        default=3000,
        help_text=(
            "Используется для расчёта/накладной, если у товара не заполнен вес. "
            "Параметры товара имеют приоритет."
        ),
    )
    cdek_default_length_cm = models.PositiveIntegerField(
        "СДЭК: общая длина по умолчанию, см",
        default=30,
        help_text="Используется, если у товара не заполнена длина.",
    )
    cdek_default_width_cm = models.PositiveIntegerField(
        "СДЭК: общая ширина по умолчанию, см",
        default=20,
        help_text="Используется, если у товара не заполнена ширина.",
    )
    cdek_default_height_cm = models.PositiveIntegerField(
        "СДЭК: общая высота по умолчанию, см",
        default=20,
        help_text="Используется, если у товара не заполнена высота.",
    )
    cdek_recipient_delivery_fee_mode = models.CharField(
        "СДЭК: доп. сбор с получателя за доставку",
        max_length=16,
        choices=CdekRecipientDeliveryFeeMode.choices,
        default=CdekRecipientDeliveryFeeMode.OFF,
        help_text="Передаётся в delivery_recipient_cost.value (наложенный платёж).",
    )
    cdek_recipient_delivery_fee_fixed_rub = models.PositiveIntegerField(
        "СДЭК: доп. сбор с получателя (фикс), ₽",
        default=0,
        help_text="Используется, если выбран режим «Фиксированная сумма».",
    )
    cdek_recipient_delivery_fee_percent = models.DecimalField(
        "СДЭК: доп. сбор с получателя (% от суммы товаров)",
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Используется, если выбран режим «Процент от суммы товаров».",
    )

    class OzonLogisticsDeliveryPayer(models.TextChoices):
        STORE = "store", "Доставка за счёт магазина"
        BUYER = "buyer", "Доставка за счёт покупателя"

    ozon_logistics_enabled = models.BooleanField(
        "Логистика Ozon: показывать способ доставки",
        default=False,
        help_text="Доступна только онлайн-оплата через Ozon Pay (если эквайринг включён). Подключение кабинета — по инструкции Ozon.",
    )
    ozon_logistics_delivery_payer = models.CharField(
        "Логистика Ozon: кто оплачивает доставку (на витрине)",
        max_length=16,
        choices=OzonLogisticsDeliveryPayer.choices,
        default=OzonLogisticsDeliveryPayer.STORE,
        help_text="Показ текста на оформлении заказа. Итог с доставкой считает Ozon Pay при оплате.",
    )
    ozon_logistics_buyer_note = models.TextField(
        "Логистика Ozon: текст для покупателя",
        blank=True,
        default="",
        help_text="Кратко опишите условия; ссылка на справку Ozon при необходимости.",
    )
    ozon_seller_client_id = models.CharField(
        "Ozon Seller API: Client-Id",
        max_length=256,
        blank=True,
        default="",
        help_text="Кабинет seller.ozon.ru — права: Product read-only, Warehouse (или Admin read-only). "
        "Нужен для проверки остатков перед оплатой с доставкой Ozon. Env: OZON_SELLER_CLIENT_ID.",
    )
    ozon_seller_api_key = models.CharField(
        "Ozon Seller API: Api-Key",
        max_length=512,
        blank=True,
        default="",
        help_text="Секрет API (заголовок Api-Key). Env: OZON_SELLER_API_KEY.",
    )

    ozon_pay_enabled = models.BooleanField(
        "Ozon Pay Checkout: включить онлайн-оплату",
        default=False,
        help_text="Интеграция по API Ozon Acquiring (Ozon Pay Checkout). Ключи — ниже.",
    )
    ozon_pay_sandbox = models.BooleanField(
        "Ozon Pay: песочница / тест",
        default=True,
        help_text="Пока нет боевого доступа оставьте включённым.",
    )
    ozon_pay_client_id = models.CharField(
        "Ozon Pay: accessKey (идентификатор токена)",
        max_length=256,
        blank=True,
        default="",
        help_text="Из кабинета эквайринга. Env: OZON_PAY_ACCESS_KEY.",
    )
    ozon_pay_client_secret = models.CharField(
        "Ozon Pay: secretKey (секрет токена)",
        max_length=512,
        blank=True,
        default="",
        help_text="Для подписи запросов createOrder. Env: OZON_PAY_SECRET_KEY или OZON_PAY_CLIENT_SECRET.",
    )
    ozon_pay_webhook_secret = models.CharField(
        "Ozon Pay: notificationSecretKey (уведомления)",
        max_length=256,
        blank=True,
        default="",
        help_text="Секрет для проверки requestSign в POST /api/webhooks/ozon-pay/. Env: OZON_PAY_WEBHOOK_SECRET.",
    )

    header_navigation = models.JSONField(
        "Навигация шапки (JSON)",
        null=True,
        blank=True,
        default=None,
        help_text='Порядок и включение пунктов: список объектов с полями key (home|catalog|portfolio|blog|reviews|contacts), enabled, order, label (подпись, необязательно). Пусто — настройки по умолчанию.',
    )
    reviews_yandex_profile_url = models.URLField(
        "Отзывы: ссылка на карточку в Яндексе",
        max_length=512,
        blank=True,
        default="",
        help_text="Публичный URL организации (профиль в Яндексе). Ссылка «Все отзывы в Яндексе» на странице /reviews.",
    )
    reviews_yandex_widget_html = models.TextField(
        "Отзывы: HTML виджета Яндекса",
        blank=True,
        default="",
        help_text="Код вставки из кабинета организации (обычно iframe). Показывается на /reviews первым блоком. Автоматическая подгрузка отзывов по URL без виджета невозможна (ограничения Яндекса).",
    )

    class Meta:
        verbose_name = "Настройки сайта"
        verbose_name_plural = "Настройки сайта"

    def __str__(self) -> str:
        return "Настройки сайта"

    def clean(self):
        super().clean()
        locale = (self.seo_locale or "").strip()
        if locale and not re.fullmatch(r"[a-z]{2}_[A-Z]{2}", locale):
            raise ValidationError({"seo_locale": "Формат locale: xx_XX, например ru_RU."})
        tw = (self.seo_twitter_card or "").strip().lower()
        if tw and tw not in ("summary", "summary_large_image"):
            raise ValidationError({"seo_twitter_card": "Допустимо: summary или summary_large_image."})
        self.seo_twitter_card = tw or "summary_large_image"
        nmax = self.seo_meta_description_max
        if nmax is not None and (nmax < 80 or nmax > 400):
            raise ValidationError(
                {"seo_meta_description_max": "Укажите значение в диапазоне 80–400 (рекомендуется ~160)."}
            )
        self.seo_title_templates = validate_seo_title_templates_value(self.seo_title_templates)
        from config.header_nav import normalize_header_navigation

        if self.header_navigation is not None:
            self.header_navigation = normalize_header_navigation(self.header_navigation)
        from .html_sanitize import sanitize_reviews_embed_html

        self.reviews_yandex_widget_html = sanitize_reviews_embed_html(
            str(self.reviews_yandex_widget_html or "")
        )

    @classmethod
    def get_solo(cls) -> "SiteSettings":
        obj, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                "show_marketplace_wb": True,
                "show_marketplace_ozon": True,
                "show_marketplace_ym": False,
                "show_marketplace_avito": False,
            },
        )
        return obj


class SiteEmailTemplate(models.Model):
    """Тексты исходящих писем; строки создаются миграцией, в админке только правка."""

    class Key(models.TextChoices):
        MANAGER_CALCULATOR = "manager_calculator", "Менеджерам: заявка с калькулятора"
        MANAGER_CALLBACK = "manager_callback", "Менеджерам: обратный звонок"
        MANAGER_CART = "manager_cart", "Менеджерам: заказ из корзины"
        BUYER_CREDENTIALS = "buyer_credentials", "Покупателю: доступ в личный кабинет"
        BUYER_ORDER_CONFIRMATION = "buyer_order_confirmation", "Покупателю: подтверждение заказа"
        SMTP_TEST = "smtp_test", "Служебное: тест SMTP из админки"

    key = models.CharField("Тип письма", max_length=64, unique=True, choices=Key.choices)
    subject = models.CharField(
        "Тема письма",
        max_length=998,
        blank=True,
        default="",
        help_text="Плейсхолдеры в фигурных скобках, например {name}. Подсказка по полям — блок ниже.",
    )
    body = models.TextField(
        "Текст письма",
        blank=True,
        default="",
        help_text="Текст без HTML, переносы строк сохраняются. Плейсхолдеры как в теме.",
    )

    class Meta:
        verbose_name = "Шаблон письма"
        verbose_name_plural = "Шаблоны писем"
        ordering = ["key"]

    def __str__(self) -> str:
        return self.get_key_display()


class HomePageContent(models.Model):
    """Singleton (pk=1): тексты и блоки главной страницы (JSON)."""

    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    payload = models.JSONField("Данные главной (JSON)", default=dict, blank=True)
    hero_background = models.ImageField(
        "Фон героя (первый экран) — устар., см. слайд 1",
        upload_to="home/hero/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
        help_text="Устаревшее поле: раньше один фон на весь hero. Сейчас — картинки в блоках «Hero, слайд 1…6».",
    )
    hero_slide_1_image = models.FileField(
        "Hero, слайд 1: изображение или видео (файл)",
        upload_to="home/hero/slides/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    hero_slide_2_image = models.FileField(
        "Hero, слайд 2: изображение или видео (файл)",
        upload_to="home/hero/slides/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    hero_slide_3_image = models.FileField(
        "Hero, слайд 3: изображение или видео (файл)",
        upload_to="home/hero/slides/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    hero_slide_4_image = models.FileField(
        "Hero, слайд 4: изображение или видео (файл)",
        upload_to="home/hero/slides/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    hero_slide_5_image = models.FileField(
        "Hero, слайд 5: изображение или видео (файл)",
        upload_to="home/hero/slides/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    hero_slide_6_image = models.FileField(
        "Hero, слайд 6: изображение или видео (файл)",
        upload_to="home/hero/slides/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    ps0_icon_image = models.ImageField(
        "Карточка «Проблема—решение» 1: картинка вместо значка",
        upload_to="home/ps_icons/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    ps1_icon_image = models.ImageField(
        "Карточка «Проблема—решение» 2: картинка вместо значка",
        upload_to="home/ps_icons/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    ps2_icon_image = models.ImageField(
        "Карточка «Проблема—решение» 3: картинка вместо значка",
        upload_to="home/ps_icons/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )
    ps3_icon_image = models.ImageField(
        "Карточка «Проблема—решение» 4: картинка вместо значка",
        upload_to="home/ps_icons/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
    )

    class Meta:
        verbose_name = "Главная страница (контент)"
        verbose_name_plural = "Главная страница (контент)"

    def __str__(self) -> str:
        return "Главная страница"

    @classmethod
    def get_solo(cls) -> "HomePageContent":
        obj, created = cls.objects.get_or_create(pk=1, defaults={"payload": {}})
        return obj


class StaticPage(models.Model):
    slug = models.SlugField("Слаг", max_length=120, unique=True, db_index=True)
    title = models.CharField("Заголовок страницы", max_length=255)
    meta_title = models.CharField("SEO title", max_length=255, blank=True, default="")
    meta_description = models.CharField("SEO description", max_length=500, blank=True, default="")
    body = models.TextField(
        "Содержимое (HTML или Markdown)",
        blank=True,
        default="",
        help_text="Поддерживается HTML. Markdown можно хранить как текст и обработать на витрине при необходимости.",
    )
    about_payload = models.JSONField(
        "Макет «О нас» (витрина, JSON)",
        default=dict,
        blank=True,
        help_text="Заполняется полями раздела «Макет «О нас» — витрина» в админке для страницы со слагом o-nas. "
        "Если пусто — на сайте используется только «Содержимое».",
    )
    about_manufacturer_image = models.ImageField(
        "Производитель: фото (файл)",
        upload_to="static_pages/about_mnf/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
        help_text="Слева от текста «Мы производитель». Если задано — подменяет внешний URL фото из макета.",
    )
    about_manufacturer_video = models.FileField(
        "Производитель: видео (файл)",
        upload_to="static_pages/about_mnf/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
        help_text="Слева от текста. MP4/WebM; на сайте встроенное видео. Если задано — подменяет ссылку на видео из макета.",
        validators=[FileExtensionValidator(allowed_extensions=["mp4", "webm", "ogv", "ogg"])],
    )
    about_intro_image = models.ImageField(
        "Вступление: фото (файл, справа от заголовка)",
        upload_to="static_pages/about_intro/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
        help_text="Колонка справа от «Узнай нас / …». Если задано — подменяет URL картинки из макета.",
    )
    about_intro_video = models.FileField(
        "Вступление: видео (файл, справа)",
        upload_to="static_pages/about_intro/%Y/%m/",
        max_length=512,
        blank=True,
        null=True,
        help_text="MP4/WebM; встроенное видео справа. Если задано — подменяет внешнюю ссылку на видео из макета.",
        validators=[FileExtensionValidator(allowed_extensions=["mp4", "webm", "ogv", "ogg"])],
    )
    is_published = models.BooleanField("Опубликовано", default=True, db_index=True)
    show_in_header = models.BooleanField("Показывать ссылку в шапке", default=False)
    show_in_footer = models.BooleanField("Показывать ссылку в подвале", default=True)
    header_link_label = models.CharField("Текст ссылки в шапке", max_length=120, blank=True, default="")
    footer_link_label = models.CharField("Текст ссылки в подвале", max_length=120, blank=True, default="")
    sort_order = models.PositiveIntegerField("Порядок ссылок", default=100)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("sort_order", "title")
        verbose_name = "Статичная страница"
        verbose_name_plural = "Статичные страницы"

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        ensure_slug_from_title(self)
        super().save(*args, **kwargs)


class AboutSpotlightImage(models.Model):
    """Фотографии блока «витринной» галереи на странице «О нас» (слаг o-nas); порядок — sort_order."""

    static_page = models.ForeignKey(
        "StaticPage",
        on_delete=models.CASCADE,
        related_name="about_spotlight_items",
        verbose_name="страница",
    )
    image = models.ImageField(
        "Фото",
        upload_to="static_pages/about_spotlight/%Y/%m/",
        max_length=512,
    )
    alt = models.CharField("Подпись (alt)", max_length=500, blank=True, default="")
    sort_order = models.PositiveIntegerField("Порядок", default=0, db_index=True)

    class Meta:
        ordering = ("sort_order", "id")
        verbose_name = "фото из галереи (О нас — витрина)"
        verbose_name_plural = "Галерея (О нас, витрина): фото, перетаскивание в рамку, порядок"

    def __str__(self) -> str:
        return f"{self.static_page_id}:{self.sort_order or self.id}"


class ConsentLog(models.Model):
    ip_address = models.CharField("IP адрес", max_length=45)
    user_agent = models.TextField("User-Agent")
    consent_value = models.BooleanField("Согласие принято")
    timestamp = models.DateTimeField("Метка времени клиента")
    policy_version = models.CharField("Версия документов", max_length=20)
    url = models.CharField("URL страницы", max_length=500)
    session_id = models.CharField("ID сессии", max_length=128, blank=True, default="")
    created_at = models.DateTimeField("Создано на сервере", auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Лог согласия на ПДн"
        verbose_name_plural = "Логи согласий на ПДн"

    def __str__(self) -> str:
        return f"{'accept' if self.consent_value else 'decline'} {self.policy_version} {self.created_at:%Y-%m-%d %H:%M}"


class CustomerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_profile",
    )
    phone = models.CharField("Телефон", max_length=40, blank=True)
    password_change_deadline = models.DateTimeField(
        "Сменить пароль до",
        null=True,
        blank=True,
        help_text="Заполняется при автосоздании аккаунта из заказа: пароль из письма нужно сменить до этой даты.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Профиль покупателя"
        verbose_name_plural = "Профили покупателей"

    def __str__(self) -> str:
        return self.user.get_username()


class ShippingAddress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="shipping_addresses",
    )
    label = models.CharField("Название", max_length=64, default="Адрес")
    city = models.CharField("Город", max_length=120)
    street = models.CharField("Улица", max_length=255)
    building = models.CharField("Дом / корпус", max_length=32, blank=True)
    apartment = models.CharField("Квартира / офис", max_length=32, blank=True)
    postal_code = models.CharField("Индекс", max_length=16, blank=True)
    recipient_name = models.CharField("Получатель", max_length=120, blank=True)
    recipient_phone = models.CharField("Телефон получателя", max_length=40, blank=True)
    is_default = models.BooleanField("По умолчанию", default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]
        verbose_name = "Адрес доставки"
        verbose_name_plural = "Адреса доставки"

    def __str__(self) -> str:
        return f"{self.label}: {self.city}, {self.street}"
