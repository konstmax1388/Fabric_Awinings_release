"""Пагинация списков Staff API (формат из admin-react-admin-migration-analysis.md §4.2)."""

from rest_framework.pagination import PageNumberPagination


class StaffPageNumberPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "pageSize"
    max_page_size = 100
