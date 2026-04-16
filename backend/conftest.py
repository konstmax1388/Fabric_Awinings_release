"""Pytest: не подхватывать MySQL из окружения — тесты всегда на SQLite."""

from __future__ import annotations


def pytest_load_initial_conftests(early_config, parser, args) -> None:
    import os

    for key in (
        "DJANGO_MYSQL_DATABASE",
        "DJANGO_MYSQL_USER",
        "DJANGO_MYSQL_PASSWORD",
        "DJANGO_MYSQL_HOST",
        "DJANGO_MYSQL_PORT",
    ):
        os.environ.pop(key, None)
