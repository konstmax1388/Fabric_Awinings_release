#!/usr/bin/env bash
# Регулярная очистка дерева на VPS после деплоя: рантайм (Gunicorn, статика, медиа, .env) + готовые сборки.
# Удаляет node_modules и исходники фронта (frontend/src, admin-ui/src) — перед следующим деплоем `git reset --hard`
# снова подтянет их из репо, затем на сервере снова `npm ci` и сборка.
# Не удаляет: backend/.venv, .git (если не --with-git), deploy/, .env (реальные секреты).
# Удаляет в корне: docker-compose.yml, .env.example (на голом VPS без Compose не нужны).
#
# Использование:
#   bash deploy/prune-production-tree.sh /var/www/.../fabrika-tentov.ru
#   bash deploy/prune-production-tree.sh   # по умолчанию: текущий каталог
#   bash deploy/prune-production-tree.sh --with-git /path   # убрать .git (обновления только rsync/архив)
#   bash deploy/prune-production-tree.sh --drop-sqlite /path  # удалить случайный db.sqlite3 (на проде обычно MySQL)
#   bash deploy/prune-production-tree.sh --keep-build-deps /path  # не трогать node_modules и src (отладка на сервере)
#
# Скрипты деплоя вызывают с --drop-sqlite после успешной сборки (см. sync-to-production.*).
#
# Не удалять и не добавлять в find/rm: sitemap.xml, robots.txt в корне репозитория и во
# frontend/dist/ — их создаёт generate_public_seo_files; деплой повторно вызывает команду после prune.

set -euo pipefail
WITH_GIT=0
DROP_SQLITE=0
KEEP_BUILD_DEPS=0
while [[ "${1:-}" == --* ]]; do
  case "$1" in
    --with-git) WITH_GIT=1 ;;
    --drop-sqlite) DROP_SQLITE=1 ;;
    --keep-build-deps) KEEP_BUILD_DEPS=1 ;;
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

# Docker / шаблон env в корне (рантайм на VPS через systemd, не через compose из репо)
remove_file docker-compose.yml
remove_file docker-compose.override.yml
remove_file .env.example

# Случайный PHP/Composer в корне сайта (не часть стека проекта)
remove_file composer.phar
remove_file composer.json
remove_file composer.lock
remove_dir vendor
remove_dir .cache
remove_dir .local

# Резервные копии и правила IDE/ИИ в корне (не для рантайма)
while IFS= read -r -d '' f; do
  echo "[prune] rm -f $f"
  rm -f "$f"
done < <(find . -maxdepth 1 -type f \( -name '*.bak' \) -print0 2>/dev/null || true)

remove_file .cursorrules
remove_file .cursorignore
remove_file .windsurfrules
remove_file AGENTS.md
remove_file CLAUDE.md

# Временные артефакты Vite (если остались вне node_modules)
remove_dir frontend/node_modules/.vite-temp
remove_dir admin-ui/node_modules/.vite-temp

# Неактуальные каталоги со старых выкладок / rsync (в Git их может не быть)
remove_dir cursor-talk-to-figma-mcp
remove_dir tools
remove_dir backend/ozon_logistics

# Файлы с путями MSYS/ошибочно скопированные в docroot (ключи и т.п. — удалить и ротировать ключи при утечке)
while IFS= read -r -d '' f; do
  echo "[prune] rm -f (подозрительное имя в корне) $f"
  rm -f "$f"
done < <(find . -maxdepth 1 -type f \( -name ':USERPROFILE*' -o -name ':HOME*' \) -print0 2>/dev/null || true)

if [[ "$KEEP_BUILD_DEPS" -eq 0 ]]; then
  remove_dir frontend/node_modules
  remove_dir admin-ui/node_modules
  remove_dir frontend/src
  remove_dir admin-ui/src
else
  echo "[prune] --keep-build-deps: node_modules и */src не удаляем"
fi

# __pycache__ (не заходим в .venv и node_modules)
if command -v find >/dev/null 2>&1; then
  while IFS= read -r -d '' d; do
    echo "[prune] rm -rf $d"
    rm -rf "$d" 2>/dev/null || true
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
