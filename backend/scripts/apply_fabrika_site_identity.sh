#!/usr/bin/env bash
# Заполнение реквизитов и SEO (команда apply_fabrika_site_identity).
# С сервера: cd в каталог проекта (где лежит backend/), активировать venv, затем:
#   bash backend/scripts/apply_fabrika_site_identity.sh --dry-run
#   bash backend/scripts/apply_fabrika_site_identity.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [[ -f .venv/bin/activate ]]; then
  # shellcheck source=/dev/null
  source .venv/bin/activate
elif [[ -f ../.venv/bin/activate ]]; then
  source ../.venv/bin/activate
fi
exec python manage.py apply_fabrika_site_identity "$@"
