#!/usr/bin/env bash
# Однократно на VPS от root: убрать location = /sitemap.xml с proxy_pass,
# чтобы /sitemap.xml отдавался из frontend/dist (файл после generate_public_seo_files).
#
# Запуск (путь к репозиторию подставьте при необходимости):
#   sudo bash /var/www/kasatkin_da/data/www/fabrika-tentov.ru/deploy/vps-nginx-remove-seo-proxy-once.sh
#
# Перед правкой — бэкап vhost; затем nginx -t и reload.

set -euo pipefail

VHOST="${VPS_NGINX_VHOST:-/etc/nginx/vhosts/kasatkin_da/fabrika-tentov.ru.conf}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Запускайте от root: sudo bash $0" >&2
  exit 1
fi

if [[ ! -f "$VHOST" ]]; then
  echo "Файл не найден: $VHOST (задайте VPS_NGINX_VHOST=...)" >&2
  exit 1
fi

bak="${VHOST}.bak.seo-static.$(date +%Y%m%d%H%M%S)"
cp -a "$VHOST" "$bak"
echo "[nginx-seo] бэкап: $bak"

python3 <<PY
import pathlib
import re
import sys

path = pathlib.Path("${VHOST}")
text = path.read_text(encoding="utf-8")
pat = re.compile(
    r"\n\tlocation = /sitemap\.xml \{.*?\n\t\}\n",
    re.DOTALL,
)
new, n = pat.subn("\n", text, count=1)
if n == 0:
    pat2 = re.compile(
        r"\n[ \t]+location = /sitemap\.xml \{.*?\n[ \t]+\}\n",
        re.DOTALL,
    )
    new, n = pat2.subn("\n", text, count=1)
if n == 0:
    print("[nginx-seo] блок location = /sitemap.xml не найден — правки не нужны.", file=sys.stderr)
    sys.exit(0)
path.write_text(new, encoding="utf-8")
print("[nginx-seo] удалён proxy location для /sitemap.xml")
PY

nginx -t
systemctl reload nginx
echo "[nginx-seo] nginx перезагружен. Проверка: curl -sI https://fabrika-tentov.ru/sitemap.xml | head -5"
