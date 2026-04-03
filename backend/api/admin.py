from django.contrib import admin

from .models import (
    BlogPost,
    CalculatorLead,
    CartOrder,
    PortfolioProject,
    Product,
    ProductImage,
    Review,
)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "category", "price_from", "show_on_home", "is_published", "sort_order")
    list_filter = ("category", "show_on_home", "is_published")
    search_fields = ("title", "slug", "excerpt")
    prepopulated_fields = {"slug": ("title",)}
    ordering = ("sort_order", "-updated_at")
    inlines = [ProductImageInline]


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("product", "url", "sort_order")
    list_filter = ("product",)


@admin.register(PortfolioProject)
class PortfolioProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "category", "is_published", "sort_order")
    list_filter = ("is_published",)
    search_fields = ("title", "slug")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("name", "rating", "is_published", "sort_order", "created_at")
    list_filter = ("is_published", "rating")
    search_fields = ("name", "text")


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "published_at", "is_published")
    list_filter = ("is_published",)
    search_fields = ("title", "slug", "excerpt")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(CalculatorLead)
class CalculatorLeadAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "length_m", "width_m", "estimated_price_rub", "created_at")
    search_fields = ("name", "phone")
    readonly_fields = ("created_at",)


@admin.register(CartOrder)
class CartOrderAdmin(admin.ModelAdmin):
    list_display = ("order_ref", "customer_name", "customer_phone", "total_approx", "created_at")
    search_fields = ("order_ref", "customer_name", "customer_phone", "customer_email")
    readonly_fields = ("order_ref", "manager_letter", "client_ack", "created_at")
