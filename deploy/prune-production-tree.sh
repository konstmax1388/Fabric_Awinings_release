#!/usr/bin/env bash
# Одноразовая или регулярная очистка дерева на VPS: оставить то, что нужно для рантайма (Gunicorn, статика, медиа, .env).
# Не удаляет: backend/, frontend/, admin-ui/, deploy/, .env, node_modules, .venv (нужны для следующего деплоя).
#
# Использование:
#   bash deploy/prune-production-tree.sh /var/www/.../fabrika-tentov.ru
#   bash deploy/prune-production-tree.sh   # по умолчанию: текущий каталог
#   bash deploy/prune-production-tree.sh --with-git /path   # убрать .git (обновления только rsync/архив)
#   bash deploy/prune-production-tree.sh --drop-sqlite /path  # удалить случайный db.sqlite3 (на проде обычно MySQL)
#
# После каждого `git pull` тесты и т.п. снова появятся из репо — прогоняйте после деплоя (см. sync-to-production.*).

set -euo pipefail
WITH_GIT=0
DROP_SQLITE=0
while [[ "${1:-}" == --* ]]; do
  case "$1" in
    --with-git) WITH_GIT=1 ;;
    --drop-sqlite) DROP_SQLITE=1 ;;
    *) echo "Неизвестный флаг: $1"; exit 1 ;;
  esac
  shift
done

ROOT="${1:-.}"
cd "$ROOT"
echo "[prune] root: $(pwd)"

remove_dir() {
  local d="$1"
  if [[ -d "$d" ]]; then
    echo "[prune] rm -rf $d/"
    rm -rf "$d"
  fi
}

remove_file() {
  local f="$1"
  if [[ -f "$f" ]]; then
    echo "[prune] rm -f $f"
    rm -f "$f"
  fi
}

# Каталоги, не нужные на хосте (см. deploy/rsync-exclude.txt, PRODUCTION-VPS.md)
remove_dir .cursor
remove_dir .github
remove_dir docs
remove_dir Fabric_Awinings_react_admin
remove_dir staff-ui
remove_dir backend/tests
remove_dir htmlcov
remove_dir backend/htmlcov
remove_dir .pytest_cache
remove_dir backend/.pytest_cache

# Служебные скрипты разработки (если попали в клон)
remove_file frontend/tmp-capture.cjs
remove_file frontend/tmp-capture.js

# __pycache__ (не заходим в .venv и node_modules)
if command -v find >/dev/null 2>&1; then
  while IFS= read -r -d '' d; do
    echo "[prune] rm -rf $d"
    rm -rf "$d"
  done < <(
    find . \( -type d \( -name .venv -o -name node_modules \) \) -prune -o -type d -name __pycache__ -print0 2>/dev/null || true
  )
fi

if [[ "$DROP_SQLITE" -eq 1 ]]; then
  remove_file db.sqlite3
  remove_file backend/db.sqlite3
fi

if [[ "$WITH_GIT" -eq 1 ]]; then
  remove_dir .git
else
  if [[ -d .git ]]; then
    echo "[prune] .git/ оставлен (обновления: git pull). Удалить: --with-git"
  fi
fi

for f in CHANGELOG.md BACKLOG.md README.md; do
  if [[ -f "$f" ]]; then
    echo "[prune] rm -f $f"
    rm -f "$f"
  fi
done

# Офисные файлы в корне
while IFS= read -r -d '' f; do
  echo "[prune] rm -f $f"
  rm -f "$f"
done < <(find . -maxdepth 1 -type f \( -name '*.docx' -o -name '*.xlsx' \) -print0 2>/dev/null || true)

echo "[prune] готово."
