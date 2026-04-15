import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug", lookup_expr="exact")
    show_on_home = django_filters.BooleanFilter()
    exclude_slug = django_filters.CharFilter(method="filter_exclude_slug")

    class Meta:
        model = Product
        fields = ["show_on_home"]

    def filter_exclude_slug(self, queryset, name, value):
        if value:
            return queryset.exclude(slug=value)
        return queryset
