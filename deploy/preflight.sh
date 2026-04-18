#!/usr/bin/env bash
# Те же шаги, что в CI и в deploy/preflight.ps1 (из корня репозитория: bash deploy/preflight.sh)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> backend: pip, check, pytest"
cd "$ROOT/backend"
python -m pip install -q -r requirements.txt
python manage.py check
python -m pytest -q --tb=short

echo "==> frontend: npm ci, build"
cd "$ROOT/frontend"
npm ci
npm run build

echo "==> admin-ui: npm ci, build"
cd "$ROOT/admin-ui"
npm ci
npm run build

echo "==> Preflight OK."
