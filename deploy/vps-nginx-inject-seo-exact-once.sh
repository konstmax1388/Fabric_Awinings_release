#!/usr/bin/env bash
# Однократно на VPS от root: гарантировать location = /robots.txt и /sitemap.xml с proxy_pass на Gunicorn.
# Старые блоки с теми же URI (alias, return 404, другой upstream) удаляются и заменяются — иначе скрипт
# завершался с «уже есть», а снаружи оставались 404 / устаревший файл с диска.
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


def strip_location_exact(text: str, uri_regex: str) -> str:
    """Удалить блок location = /uri { ... } с учётом вложенных {} одного уровня внутри."""
    while True:
        m = re.search(rf"(\n[ \t]*)location\s*=\s*{uri_regex}\s*\{{", text)
        if not m:
            return text
        start = m.start()
        brace = text.find("{", m.end() - 1)
        if brace < 0:
            print("[nginx-seo-exact] parse error: {{", file=sys.stderr)
            sys.exit(1)
        depth = 0
        j = brace
        while j < len(text):
            c = text[j]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    j += 1
                    break
            j += 1
        else:
            print("[nginx-seo-exact] unbalanced }} in location", file=sys.stderr)
            sys.exit(1)
        text = text[:start] + text[j:]


path = pathlib.Path(os.environ["VHOST_PATH"])
text = path.read_text(encoding="utf-8", errors="replace")

text = strip_location_exact(text, r"/robots\.txt")
text = strip_location_exact(text, r"/sitemap\.xml")
print("[nginx-seo-exact] удалены прежние location = /robots.txt и /sitemap.xml (если были)")

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
print("[nginx-seo-exact] вставлены новые location = /robots.txt и /sitemap.xml")
PY

echo "[nginx-seo-exact] Подсказка: soft 404 (200 на левые URL) бывает, если location / использует try_files к index.html вместо proxy_pass на Gunicorn — см. deploy/nginx-fabrika-tentov.ru.full.conf."

nginx -t
systemctl reload nginx
echo "[nginx-seo-exact] готово. Проверка: curl -sI https://fabrika-tentov.ru/robots.txt | head -3"
