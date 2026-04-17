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

if [[ "${DEPLOY_SKIP_SYSTEMD:-0}" == "1" ]]; then
  ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$DEPLOY_SSH_TARGET" bash <<EOF
set -euo pipefail
cd $APP
git fetch origin $BRANCH
git checkout $BRANCH
git reset --hard "origin/$BRANCH"
cd frontend
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
npm run build
cd ../admin-ui
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
npm run build
cd ../backend
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
cd frontend
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
npm run build
cd ../admin-ui
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
npm run build
cd ../backend
if [[ -f ../.env ]]; then set -a; source ../.env; set +a; fi
source .venv/bin/activate
pip install -q -r requirements-prod.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput
sudo systemctl restart $SERVICE
EOF
fi

echo "==> Готово."
