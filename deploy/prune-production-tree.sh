#!/usr/bin/env bash
# Одноразовая очистка дерева проекта на VPS: удалить то, что не нужно для работы сайта.
# Не трогает backend/, frontend/, admin-ui/, deploy/, .env (если есть), venv.
#
# Использование:
#   bash deploy/prune-production-tree.sh /var/www/.../fabrika-tentov.ru
#   bash deploy/prune-production-tree.sh   # каталог по умолчанию: текущий
#
# Опция --with-git  — также удалить .git (после этого обновления только через rsync/архив, не git pull).

set -euo pipefail
WITH_GIT=0
if [[ "${1:-}" == "--with-git" ]]; then
  WITH_GIT=1
  shift
fi
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

remove_dir .cursor
remove_dir .github
remove_dir docs
remove_dir Fabric_Awinings_react_admin
remove_dir staff-ui

if [[ "$WITH_GIT" -eq 1 ]]; then
  remove_dir .git
else
  if [[ -d .git ]]; then
    echo "[prune] .git/ оставлен (обновления: git pull). Удалить вручную или запустить с --with-git"
  fi
fi

for f in CHANGELOG.md BACKLOG.md README.md; do
  if [[ -f "$f" ]]; then
    echo "[prune] rm -f $f"
    rm -f "$f"
  fi
done

# Любые .docx / .xlsx в корне репозитория (ТЗ, выгрузки контента)
while IFS= read -r -d '' f; do
  echo "[prune] rm -f $f"
  rm -f "$f"
done < <(find . -maxdepth 1 -type f \( -name '*.docx' -o -name '*.xlsx' \) -print0 2>/dev/null || true)

echo "[prune] готово."
