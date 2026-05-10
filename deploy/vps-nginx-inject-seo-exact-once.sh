#!/usr/bin/env bash
# Однократно на VPS от root: вставить location = /robots.txt и /sitemap.xml с proxy_pass на Gunicorn,
# если их ещё нет. Обходит отдачу устаревших файлов из корня сайта и 404 nginx.
#
#   export VPS_NGINX_VHOST=/etc/nginx/vhosts/kasatkin_da/fabrika-tentov.ru.conf
#   export VPS_GUNICORN_PROXY=http://127.0.0.1:8001
#   sudo bash deploy/vps-nginx-inject-seo-exact-once.sh
#
set -euo pipefail

VHOST="${VPS_NGINX_VHOST:-/etc/nginx/vhosts/kasatkin_da/fabrika-tentov.ru.conf}"
UP="${VPS_GUNICORN_PROXY:-http://127.0.0.1:8001}"
UP="${UP%/}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Запускайте от root: sudo bash $0" >&2
  exit 1
fi

if [[ ! -f "$VHOST" ]]; then
  echo "Файл не найден: $VHOST" >&2
  exit 1
fi

bak="${VHOST}.bak.seo-exact.$(date +%Y%m%d%H%M%S)"
cp -a "$VHOST" "$bak"
echo "[nginx-seo-exact] бэкап: $bak"

export VHOST_PATH="$VHOST"
export UPSTREAM="$UP"
python3 <<'PY'
import os
import pathlib
import re
import sys

path = pathlib.Path(os.environ["VHOST_PATH"])
text = path.read_text(encoding="utf-8", errors="replace")
if re.search(r"location\s*=\s*/robots\.txt\s*\{", text):
    print("[nginx-seo-exact] location = /robots.txt уже есть — не дублируем.")
    sys.exit(0)

up = os.environ["UPSTREAM"]
snip = f"""

    # SEO (vps-nginx-inject-seo-exact-once.sh): robots и sitemap — Django views_seo.
    location = /robots.txt {{
        proxy_pass {up};
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}

    location = /sitemap.xml {{
        proxy_pass {up};
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
"""

pat = re.compile(
    r"(location\s+\^~\s+/captcha/\s*\{(?:[^{}]|\{[^{}]*\})*\})",
    re.DOTALL,
)
m = pat.search(text)
if not m:
    print(
        "[nginx-seo-exact] не найден блок location ^~ /captcha/ — добавьте вручную deploy/nginx-seo-robots-sitemap-snippet.conf",
        file=sys.stderr,
    )
    sys.exit(1)

path.write_text(text[: m.end()] + snip + text[m.end() :], encoding="utf-8")
print("[nginx-seo-exact] вставлены location = /robots.txt и /sitemap.xml")
PY

echo "[nginx-seo-exact] Подсказка: soft 404 (200 на левые URL) бывает, если location / использует try_files к index.html вместо proxy_pass на Gunicorn — см. deploy/nginx-fabrika-tentov.ru.full.conf."

nginx -t
systemctl reload nginx
echo "[nginx-seo-exact] готово. Проверка: curl -sI https://fabrika-tentov.ru/robots.txt | head -3"
