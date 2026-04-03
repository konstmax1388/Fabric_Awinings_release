from django.db import models


class Product(models.Model):
    class Category(models.TextChoices):
        TRUCK = "truck", "Для транспорта"
        WAREHOUSE = "warehouse", "Ангары и склады"
        CAFE = "cafe", "Кафе и террасы"
        EVENTS = "events", "Мероприятия"

    slug = models.SlugField("Слаг", max_length=120, unique=True)
    title = models.CharField("Название", max_length=255)
    excerpt = models.TextField("Кратко", blank=True)
    description = models.TextField("Описание", blank=True)
    category = models.CharField(
        "Категория", max_length=32, choices=Category.choices, db_index=True
    )
    price_from = models.PositiveIntegerField("Цена от, ₽", default=0)
    show_on_home = models.BooleanField("Показывать на главной", default=False, db_index=True)
    teasers = models.JSONField("Тизеры", default=list, blank=True)
    marketplace_links = models.JSONField("Ссылки МП", default=dict, blank=True)
    is_published = models.BooleanField("Опубликован", default=True, db_index=True)
    sort_order = models.PositiveIntegerField("Порядок", default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "-updated_at", "id"]
        verbose_name = "Товар"
        verbose_name_plural = "Товары"

    def __str__(self) -> str:
        return self.title


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images_rel"
    )
    url = models.URLField("URL изображения", max_length=2048)
    sort_order = models.PositiveIntegerField("Порядок", default=0)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Изображение товара"
        verbose_name_plural = "Изображения товаров"


class PortfolioProject(models.Model):
    slug = models.SlugField(max_length=120, unique=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=64, blank=True)
    before_image = models.URLField(max_length=2048, blank=True)
    after_image = models.URLField(max_length=2048, blank=True)
    completed_on = models.DateField(null=True, blank=True)
    is_published = models.BooleanField(default=True, db_index=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]
        verbose_name = "Проект портфолио"
        verbose_name_plural = "Портфолио"

    def __str__(self) -> str:
        return self.title


class Review(models.Model):
    name = models.CharField(max_length=120)
    text = models.TextField()
    rating = models.PositiveSmallIntegerField(default=5)
    photo_url = models.URLField(max_length=2048, blank=True)
    video_url = models.URLField(max_length=2048, blank=True)
    is_published = models.BooleanField(default=True, db_index=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]
        verbose_name = "Отзыв"
        verbose_name_plural = "Отзывы"

    def __str__(self) -> str:
        return self.name


class BlogPost(models.Model):
    slug = models.SlugField(max_length=160, unique=True)
    title = models.CharField(max_length=255)
    excerpt = models.TextField(blank=True)
    body = models.TextField(blank=True)
    cover_image_url = models.URLField(max_length=2048, blank=True)
    published_at = models.DateField(null=True, blank=True)
    is_published = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]
        verbose_name = "Статья блога"
        verbose_name_plural = "Блог"

    def __str__(self) -> str:
        return self.title


class CalculatorLead(models.Model):
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=40)
    comment = models.TextField(blank=True)
    length_m = models.DecimalField(max_digits=8, decimal_places=2)
    width_m = models.DecimalField(max_digits=8, decimal_places=2)
    material_id = models.CharField(max_length=64)
    material_label = models.CharField(max_length=255, blank=True)
    options = models.JSONField(default=list, blank=True)
    estimated_price_rub = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Заявка (калькулятор)"
        verbose_name_plural = "Заявки калькулятора"

    def __str__(self) -> str:
        return f"{self.name} {self.created_at:%Y-%m-%d}"


class CartOrder(models.Model):
    order_ref = models.CharField(max_length=40, unique=True, db_index=True)
    customer_name = models.CharField(max_length=120)
    customer_phone = models.CharField(max_length=40)
    customer_email = models.EmailField(blank=True)
    customer_comment = models.TextField(blank=True)
    lines = models.JSONField(default=list)
    total_approx = models.PositiveIntegerField(default=0)
    manager_letter = models.TextField(blank=True)
    client_ack = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Заказ (корзина)"
        verbose_name_plural = "Заказы корзины"

    def __str__(self) -> str:
        return self.order_ref
