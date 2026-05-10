#!/usr/bin/env bash
# С вашего ПК одной командой: на VPS — git pull, сборка frontend, migrate, collectstatic,
# generate_public_seo_files (sitemap/robots в dist и в корень выкладки), prune, повторный
# generate_public_seo_files (чтобы SEO-файлы не пропали после prune), перезапуск Gunicorn.
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

# В Git Bash встроенный ssh из MSYS часто ломает ~/.ssh при кириллице в USERPROFILE — используем OpenSSH из Windows.
# OSTYPE в MSYS2 иногда пустой; путь к ssh.exe на разных ПК разный (Program Files vs System32).
SSH_BIN="ssh"
if [[ -n "${DEPLOY_SSH_BIN:-}" ]]; then
  SSH_BIN="$DEPLOY_SSH_BIN"
else
  for cand in "/c/Program Files/OpenSSH/ssh.exe" "/c/WINDOWS/System32/OpenSSH/ssh.exe" "/c/Windows/System32/OpenSSH/ssh.exe"; do
    if [[ -x "$cand" ]]; then
      SSH_BIN="$cand"
      break
    fi
  done
fi

BRANCH="${DEPLOY_GIT_BRANCH:-main}"
GIT_REMOTE="${DEPLOY_GIT_REMOTE:-origin}"
SERVICE="${DEPLOY_SYSTEMD_SERVICE:-fabrika-gunicorn}"
APP=$(printf '%q' "$DEPLOY_APP_PATH")

echo "==> $DEPLOY_SSH_TARGET → $DEPLOY_APP_PATH (ветка $BRANCH, remote $GIT_REMOTE)"

if [[ "${DEPLOY_RUN_PREFLIGHT:-0}" == "1" ]]; then
  echo "==> Локальный preflight (как CI). Отключить: DEPLOY_RUN_PREFLIGHT=0"
  bash "$ROOT/deploy/preflight.sh"
fi

if [[ "${DEPLOY_SKIP_SYSTEMD:-0}" == "1" ]]; then
  "$SSH_BIN" -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -o ServerAliveCountMax=240 "$DEPLOY_SSH_TARGET" bash <<EOF
set -euo pipefail
cd $APP
git fetch "$GIT_REMOTE" "$BRANCH"
git checkout "$BRANCH"
git reset --hard "$GIT_REMOTE/$BRANCH"
echo "==> На сервере: VERSION=\$(cat VERSION 2>/dev/null | head -1) \$(git log -1 --oneline) remote=$GIT_REMOTE"
STAFF_TMP="/tmp/fabrika_staff_prev"
rm -rf "\$STAFF_TMP"
if [[ -f frontend/dist/staff/index.html ]]; then
  mkdir -p "\$STAFF_TMP"
  cp -a frontend/dist/staff/. "\$STAFF_TMP/"
fi
cd frontend
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
npm run build
if [[ -f "\$STAFF_TMP/index.html" ]]; then
  mkdir -p dist/staff
  cp -a "\$STAFF_TMP"/. dist/staff/
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
rm -rf "\$STAFF_TMP"
cd backend
if [[ -f ../.env ]]; then set -a; source ../.env; set +a; fi
source .venv/bin/activate
pip install -q -r requirements-prod.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput
cd ..
bash deploy/vps-remove-placeholder-seo-files-once.sh "$(pwd)"
bash deploy/prerender-storefront.sh "$(pwd)" || true
cd backend
python manage.py generate_public_seo_files
cd ..
bash deploy/prune-production-tree.sh --drop-sqlite .
cd backend
if [[ -f ../.env ]]; then set -a; source ../.env; set +a; fi
source .venv/bin/activate
python manage.py generate_public_seo_files
cd ..
echo ""
echo "==> Nginx (robots/sitemap): при необходимости на сервере: sudo bash $APP/deploy/vps-nginx-inject-seo-exact-once.sh"
echo "    Или на ПК в deploy/.env.deploy: DEPLOY_NGINX_SEO_INJECT=1 (нужен sudo -n на VPS)"
EOF
else
  "$SSH_BIN" -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -o ServerAliveCountMax=240 "$DEPLOY_SSH_TARGET" bash <<EOF
set -euo pipefail
cd $APP
git fetch "$GIT_REMOTE" "$BRANCH"
git checkout "$BRANCH"
git reset --hard "$GIT_REMOTE/$BRANCH"
echo "==> На сервере: VERSION=\$(cat VERSION 2>/dev/null | head -1) \$(git log -1 --oneline) remote=$GIT_REMOTE"
STAFF_TMP="/tmp/fabrika_staff_prev"
rm -rf "\$STAFF_TMP"
if [[ -f frontend/dist/staff/index.html ]]; then
  mkdir -p "\$STAFF_TMP"
  cp -a frontend/dist/staff/. "\$STAFF_TMP/"
fi
cd frontend
if [[ -f package-lock.json ]]; then npm ci; else npm install; fi
npm run build
if [[ -f "\$STAFF_TMP/index.html" ]]; then
  mkdir -p dist/staff
  cp -a "\$STAFF_TMP"/. dist/staff/
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
rm -rf "\$STAFF_TMP"
cd backend
if [[ -f ../.env ]]; then set -a; source ../.env; set +a; fi
source .venv/bin/activate
pip install -q -r requirements-prod.txt
python manage.py migrate --noinput
python manage.py collectstatic --noinput
cd ..
bash deploy/vps-remove-placeholder-seo-files-once.sh "$(pwd)"
bash deploy/prerender-storefront.sh "$(pwd)" || true
cd backend
python manage.py generate_public_seo_files
cd ..
bash deploy/prune-production-tree.sh --drop-sqlite .
cd backend
if [[ -f ../.env ]]; then set -a; source ../.env; set +a; fi
source .venv/bin/activate
python manage.py generate_public_seo_files
cd ..
sudo systemctl restart $SERVICE
echo ""
echo "==> Nginx (robots/sitemap): при необходимости на сервере: sudo bash $APP/deploy/vps-nginx-inject-seo-exact-once.sh"
echo "    Или на ПК в deploy/.env.deploy: DEPLOY_NGINX_SEO_INJECT=1 (нужен sudo -n на VPS)"
EOF
fi

if [[ "${DEPLOY_NGINX_SEO_INJECT:-0}" == "1" ]]; then
  echo "==> Nginx: вставка proxy для /robots.txt и /sitemap.xml (sudo -n)"
  _INJECT_SCRIPT="${DEPLOY_APP_PATH%/}/deploy/vps-nginx-inject-seo-exact-once.sh"
  _REMOTE_INJECT=$(printf 'sudo -n bash %q' "$_INJECT_SCRIPT")
  if ! "$SSH_BIN" -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=30 -o ServerAliveCountMax=240 \
    "$DEPLOY_SSH_TARGET" "$_REMOTE_INJECT"; then
    echo "WARN: nginx SEO inject не выполнен (нужен passwordless sudo). Вручную на сервере:"
    echo "    sudo bash $_INJECT_SCRIPT"
  fi
fi

echo "==> Готово."
