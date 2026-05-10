#!/usr/bin/env bash
# Prerender витрины на VPS: экспорт путей из БД, короткий runserver, Playwright.
# Вызывать из корня репозитория на сервере сразу после collectstatic:
#   cd ..
#   bash deploy/prerender-storefront.sh "$(pwd)"
#   cd backend
set -euo pipefail

REPO_ROOT="${1:?укажите абсолютный путь к корню репозитория}"

# Снять зависший runserver/vite с прошлого деплоя (иначе «port already in use»).
prerender_free_tcp() {
  local p="$1"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${p}/tcp" 2>/dev/null || true
  fi
}

cd "$REPO_ROOT/backend"
if [[ -f ../.env ]]; then set -a; source ../.env; set +a; fi
source .venv/bin/activate

python manage.py export_prerender_paths

prerender_free_tcp 19999
sleep 1

# Выключаем редирект HTTP→HTTPS только для этого runserver: иначе SECURE_SSL_REDIRECT в прод-настройках
# даёт 301 на localhost и Playwright/node fetch не могут ходить в API по HTTP.
DJANGO_SECURE_SSL_REDIRECT=false python manage.py runserver 127.0.0.1:19999 --noreload &
PID=$!

cleanup() {
  kill "$PID" 2>/dev/null || true
  wait "$PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 45); do
  if curl -fsS "http://127.0.0.1:19999/api/health/" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

cd "$REPO_ROOT/frontend"
export PRERENDER_UPSTREAM="${PRERENDER_UPSTREAM:-http://127.0.0.1:19999}"
# 4182 по умолчанию: реже конфликтует с залипшим vite preview после прерванных деплоев.
export PRERENDER_PREVIEW_PORT="${PRERENDER_PREVIEW_PORT:-4182}"
prerender_free_tcp "$PRERENDER_PREVIEW_PORT"
sleep 1

# Библиотеки GTK/ATK для bundled Chromium (на минимальном VPS их часто нет).
if [[ "${SKIP_PLAYWRIGHT_SYSTEM_DEPS:-0}" != "1" ]] && command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
  echo "[prerender-storefront] sudo: npx playwright install-deps chromium"
  sudo "$(command -v npx)" playwright install-deps chromium || true
else
  echo "[prerender-storefront] Подсказка: libatk и др. — один раз на VPS: sudo bash deploy/vps-playwright-chromium-deps-once.sh или cd frontend && sudo npx playwright install-deps chromium"
fi

npx playwright install chromium || true

set +e
node scripts/prerender.mjs
R=$?
set -e

if [[ "$R" -ne 0 ]]; then
  echo "[prerender-storefront] WARN: prerender завершился с кодом $R — витрина отдаёт SPA index.html как раньше."
fi
