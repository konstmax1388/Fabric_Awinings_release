#!/usr/bin/env bash
# Удалить устаревшие placeholder SEO-файлы в корне сайта (обход отдачи nginx с диска).
# Запуск от пользователя деплоя из корня репозитория на сервере:
#   bash deploy/vps-remove-placeholder-seo-files-once.sh "$(pwd)"
set -euo pipefail

REPO_ROOT="${1:?укажите корень репозитория (например /var/www/.../fabrika-tentov.ru)}"

for name in sitemap.xml robots.txt; do
  f="$REPO_ROOT/$name"
  if [[ ! -f "$f" ]]; then
    continue
  fi
  if grep -qF "your-domain.example" "$f" 2>/dev/null; then
    bak="${f}.bak.placeholder.$(date +%Y%m%d%H%M%S)"
    mv -v "$f" "$bak"
    echo "[remove-placeholder-seo] перенесён в $bak"
  fi
done

echo "[remove-placeholder-seo] готово."
