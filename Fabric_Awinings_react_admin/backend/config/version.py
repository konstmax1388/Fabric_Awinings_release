"""Версия продукта (источник — файл VERSION в корне репозитория)."""

from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_VERSION_FILE = _REPO_ROOT / "VERSION"


def get_app_version() -> str:
    try:
        text = _VERSION_FILE.read_text(encoding="utf-8").strip()
        return text if text else "0.0.0"
    except OSError:
        return "0.0.0"


APP_VERSION = get_app_version()
