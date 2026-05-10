#!/usr/bin/env bash
# Prerender витрины на VPS: экспорт путей из БД, короткий runserver, Playwright.
# Вызывать из корня репозитория на сервере сразу после collectstatic:
#   cd ..
#   bash deploy/prerender-storefront.sh "$(pwd)"
#   cd backend
set -euo pipefail

REPO_ROOT="${1:?укажите абсолютный путь к корню репозитория}"
cd "$REPO_ROOT/backend"
if [[ -f ../.env ]]; then set -a; source ../.env; set +a; fi
source .venv/bin/activate

python manage.py export_prerender_paths

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
npx playwright install chromium || true

set +e
node scripts/prerender.mjs
R=$?
set -e

if [[ "$R" -ne 0 ]]; then
  echo "[prerender-storefront] WARN: prerender завершился с кодом $R — витрина отдаёт SPA index.html как раньше."
fi
