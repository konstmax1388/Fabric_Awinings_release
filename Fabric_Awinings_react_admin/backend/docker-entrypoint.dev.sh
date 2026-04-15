#!/bin/sh
set -e
cd /app
# Образ мог собраться из кэша до добавления пакета в requirements.txt — подтянуть зависимости без полного rebuild.
if ! python -c "import drf_spectacular" 2>/dev/null; then
  echo "[docker-entrypoint] Installing Python deps from requirements.txt (missing drf_spectacular or similar)..."
  pip install --no-cache-dir -r /app/requirements.txt
fi
echo "[docker-entrypoint] Applying database migrations..."
python manage.py migrate --noinput
python manage.py ensure_dev_admin
exec python manage.py runserver 0.0.0.0:8000
