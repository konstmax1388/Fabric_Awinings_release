#!/bin/sh
set -e
cd /app
echo "[docker-entrypoint] Applying database migrations..."
python manage.py migrate --noinput
python manage.py ensure_dev_admin
exec python manage.py runserver 0.0.0.0:8000
