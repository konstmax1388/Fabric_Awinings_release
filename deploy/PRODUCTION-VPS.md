# Прод: VPS (Ubuntu), Nginx + Gunicorn + MySQL

Целевой путь из панели (пример): `/var/www/kasatkin_da/data/www/fabrika-tentov.ru`.  
Секреты только в **`/path/to/app/.env`** на сервере, не в Git.

## 1. Пакеты (Ubuntu)

```bash
sudo apt update
sudo apt install -y python3.12-venv python3-pip nginx mysql-client build-essential \
  pkg-config default-libmysqlclient-dev nodejs npm
```

(Если `nodejs` старый — используйте **nvm** и LTS Node, как в dev.)

## 2. Код

```bash
cd /var/www/kasatkin_da/data/www
git clone https://github.com/konstmax1388/Fabric_Awinings_release.git fabrika-tentov.ru
cd fabrika-tentov.ru
```

Или `rsync` с исключениями: [`rsync-exclude.txt`](rsync-exclude.txt).

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

TLS: `certbot` или сертификат из панели.

## 9. Проверка

- `https://fabrika-tentov.ru/api/health/`
- главная, каталог
- `/admin/` (Unfold)

Логи: `journalctl -u fabrika-gunicorn -f`
