# Прод: VPS (Ubuntu), Nginx + Gunicorn + MySQL

Документ ориентирован на **выделенный сервер (VPS)** с SSH и правами на установку пакетов (`apt`), systemd и свой nginx. Shared-хостинг с ограничениями здесь не целевой сценарий.

**Регулярные обновления кода на уже поднятом сервере:** см. **[`DEPLOY-MECHANISM.md`](DEPLOY-MECHANISM.md)** (одна команда с ПК или GitHub Actions).

Пример корня приложения на сервере (подставьте свой): `/var/www/fabrika-tentov.ru` или `/home/deploy/apps/fabric-awnings`.  
Секреты только в **`/path/to/app/.env`** на сервере, не в Git.

## 1. Пакеты (Ubuntu)

```bash
sudo apt update
sudo apt install -y python3.12-venv python3-pip nginx mysql-client build-essential \
  pkg-config default-libmysqlclient-dev nodejs npm
```

**Важно:** витрина (Vite 8) требует **Node.js 20.19+ или 22.12+**. Системный пакет `nodejs` из apt часто даёт **18.x** — сборка упадёт. Используйте **nvm** (`nvm install 22 && nvm use 22`) или [NodeSource](https://github.com/nodesource/distributions) для **22.x**, затем в `frontend/`: `rm -rf node_modules && npm ci && npm run build`.

## 2. Код

### Что должно остаться на сервере

Для работы сайта нужны по сути: **`backend/`** (Python), **`frontend/`** (или только `frontend/dist`, если сборка на CI), при панели **`/staff/`** — **`admin-ui/`** (или только `admin-ui/dist` + nginx), файл **`.env`**, каталог **`backend/staticfiles/`** после `collectstatic`, **`backend/media/`** для загрузок. Остальное — по желанию для отладки.

**Не выкладывать на хостинг:** `.git`, `.cursor`, `docs/`, `Fabric_Awinings_react_admin/`, `staff-ui/`, `CHANGELOG.md`, офисные **`.docx` / `.xlsx`** в корне, тесты `backend/tests/`, `node_modules`, локальные `.venv`.

### Вариант A: `git clone` на сервере

После клона можно **один раз** почистить дерево (оставит код для `pip` / `npm run build`, уберёт мусор):

```bash
cd /var/www/kasatkin_da/data/www/fabrika-tentov.ru
bash deploy/prune-production-tree.sh "$(pwd)"
```

Историю Git при этом **не** удаляем (удобно `git pull`). Если принципиально без `.git` — `bash deploy/prune-production-tree.sh --with-git "$(pwd)"` (дальше обновления только через rsync/архив).

### Вариант B: `rsync` с дев-машины

Не копировать лишнее сразу — файл исключений [`rsync-exclude.txt`](rsync-exclude.txt) (в т.ч. **`.git/`**, документация, офисные файлы):

```bash
rsync -av --delete --exclude-from=deploy/rsync-exclude.txt ./ user@host:/path/to/fabrika-tentov.ru/
```

## 3. Виртуальное окружение и зависимости

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements-prod.txt
```

## 4. Переменные окружения

```bash
cd ..   # корень репозитория
cp .env.production.example .env
nano .env   # заполните DJANGO_SECRET_KEY, пароль MySQL, ALLOWED_HOSTS, URL с https://
```

Загрузите переменные перед командами Django:

```bash
set -a && source .env && set +a
cd backend && source .venv/bin/activate
```

## 5. Витрина (сборка статики)

```bash
cd /var/www/kasatkin_da/data/www/fabrika-tentov.ru/frontend
npm ci
npm run build
```

## 6. База и Django

Убедитесь, что БД и пользователь MySQL созданы в панели, права на базу выданы. Затем (с активированным `.env` и venv):

```bash
cd /var/www/kasatkin_da/data/www/fabrika-tentov.ru/backend
source .venv/bin/activate
python manage.py migrate --noinput
python manage.py collectstatic --noinput
```

При необходимости суперпользователь: `python manage.py createsuperuser`

## 7. Gunicorn (systemd)

Скопируйте [`gunicorn.service.example`](gunicorn.service.example) в `/etc/systemd/system/fabrika-gunicorn.service`, поправьте пути и пользователя, затем:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now fabrika-gunicorn
sudo systemctl status fabrika-gunicorn
```

## 8. Nginx

Пример: [`nginx-fabrika-tentov.conf.example`](nginx-fabrika-tentov.conf.example) — прокси на Gunicorn, раздача `frontend/dist` и статики Django. Подключите в `sites-enabled`, проверьте `nginx -t`, перезапустите nginx.

Полный vhost с путями как на хостинге (в т.ч. **панель `/staff/`** и F5 на глубоких URL): [`nginx-fabrika-tentov.ru.full.conf`](nginx-fabrika-tentov.ru.full.conf). Блок `location ^~ /staff/` должен быть **выше** `location /`, иначе обновление страницы на `/staff/orders/…` отдаёт витринный `index.html` → 404.

TLS: `certbot` или сертификат из панели.

## 9. Проверка

- `https://fabrika-tentov.ru/api/health/`
- главная, каталог
- `/admin/` (Unfold)
- `/staff/` — после входа открыть заказ и обновить страницу (не должно быть 404)

Логи: `journalctl -u fabrika-gunicorn -f`
