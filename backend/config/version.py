"""Версия продукта (источник — файл VERSION в корне репозитория).

Прод часто клонирует зеркало `Fabric_Awinings_release`: релизный коммит должен попасть
и в тот remote (`git push release main`), иначе на VPS останется старая VERSION — см. deploy/push-mirror.ps1.
"""

from pathlib import Path
import subprocess

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_VERSION_FILE = _REPO_ROOT / "VERSION"


def get_app_version() -> str:
    try:
        text = _VERSION_FILE.read_text(encoding="utf-8").strip()
        return text if text else "0.0.0"
    except OSError:
        return "0.0.0"


APP_VERSION = get_app_version()


def get_git_sha() -> str:
    try:
        out = subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=_REPO_ROOT,
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
        return out
    except Exception:
        return ""


GIT_SHA = get_git_sha()
