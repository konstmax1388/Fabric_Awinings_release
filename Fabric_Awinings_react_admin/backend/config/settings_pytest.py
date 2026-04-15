"""
Настройки для pytest: включаем маршруты Django Admin (/admin/), чтобы тесты Unfold и капчи
не зависели от порядка загрузки conftest и переменных окружения shell.
"""

from .settings import *  # noqa: F403

DJANGO_ADMIN_ENABLED = True
