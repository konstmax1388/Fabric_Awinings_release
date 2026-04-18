#!/usr/bin/env bash
# С вашего ПК одной командой: на VPS — git pull, сборка frontend, migrate, collectstatic, перезапуск Gunicorn.
# Нужен вход по SSH без пароля (ключ). На сервере: Node 20+, venv в backend/.venv
#
#   cp deploy/.env.deploy.example deploy/.env.deploy
#   # заполните DEPLOY_SSH_TARGET и DEPLOY_APP_PATH
#   bash deploy/sync-to-production.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/deploy/.env.deploy"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Нет $ENV_FILE — скопируйте deploy/.env.deploy.example и заполните."
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

: "${DEPLOY_SSH_TARGET:?Задайте DEPLOY_SSH_TARGET в deploy/.env.deploy}"
: "${DEPLOY_APP_PATH:?Задайте DEPLOY_APP_PATH в deploy/.env.deploy}"

BRANCH="${DEPLOY_GIT_BRANCH:-main}"
SERVICE="${DEPLOY_SYSTEMD_SERVICE:-fabrika-gunicorn}"
APP=$(printf '%q' "$DEPLOY_APP_PATH")

echo "==> $DEPLOY_SSH_TARGET → $DEPLOY_APP_PATH (ветка $BRANCH)"

if [[ "${DEPLOY_RUN_PREFLIGHT:-0}" == "1" ]]; then
  echo "==> Локальный preflight (как CI). Отключить: DEPLOY_RUN_PREFLIGHT=0"
  bash "$ROOT/deploy/preflight.sh"
fi

if [[ "${DEPLOY_SKIP_SYSTEMD:-0}" == "1" ]]; then
  ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$DEPLOY_SSH_TARGET" bash <<EOF
set -euo pipefail
cd $APP
git fetch origin $BRANCH
git checkout $BRANCH
git reset --hard "origin/$BRANCH"
STAFF_TMP="/tmp/fabrika_staff_prev"
rm -rf "$STAFF_TMP"
if [[ -f frontend/dist/staff/index.html ]]; then
  mkdir -p "$STAFF_TMP"
  cp -a frontend/dist/staff/. "$STAFF_TMP/"
fi
cd frontend
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
npm run build
if [[ -f "$STAFF_TMP/index.html" ]]; then
  mkdir -p dist/staff
  cp -a "$STAFF_TMP"/. dist/staff/
fi
cd ../admin-ui
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
npm run build
cd ..
rm -rf frontend/dist/staff.new
mkdir -p frontend/dist/staff.new
cp -a admin-ui/dist/. frontend/dist/staff.new/
rm -rf frontend/dist/staff.prev
if [[ -d frontend/dist/staff ]]; then mv -T frontend/dist/staff frontend/dist/staff.prev; fi
mv -T frontend/dist/staff.new frontend/dist/staff
rm -rf frontend/dist/staff.prev
rm -rf "$STAFF_TMP"
cd backend
if [[ -f ../.env ]]; then set -a; source ../.env; set +a; fi
source .venv/bin/activate
pip install -q -r requirements-prod.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput
echo "(systemd пропущен: DEPLOY_SKIP_SYSTEMD=1)"
EOF
else
  ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$DEPLOY_SSH_TARGET" bash <<EOF
set -euo pipefail
cd $APP
git fetch origin $BRANCH
git checkout $BRANCH
git reset --hard "origin/$BRANCH"
STAFF_TMP="/tmp/fabrika_staff_prev"
rm -rf "$STAFF_TMP"
if [[ -f frontend/dist/staff/index.html ]]; then
  mkdir -p "$STAFF_TMP"
  cp -a frontend/dist/staff/. "$STAFF_TMP/"
fi
cd frontend
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
npm run build
if [[ -f "$STAFF_TMP/index.html" ]]; then
  mkdir -p dist/staff
  cp -a "$STAFF_TMP"/. dist/staff/
fi
cd ../admin-ui
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
npm run build
cd ..
rm -rf frontend/dist/staff.new
mkdir -p frontend/dist/staff.new
cp -a admin-ui/dist/. frontend/dist/staff.new/
rm -rf frontend/dist/staff.prev
if [[ -d frontend/dist/staff ]]; then mv -T frontend/dist/staff frontend/dist/staff.prev; fi
mv -T frontend/dist/staff.new frontend/dist/staff
rm -rf frontend/dist/staff.prev
rm -rf "$STAFF_TMP"
cd backend
if [[ -f ../.env ]]; then set -a; source ../.env; set +a; fi
source .venv/bin/activate
pip install -q -r requirements-prod.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput
sudo systemctl restart $SERVICE
EOF
fi

echo "==> Готово."
