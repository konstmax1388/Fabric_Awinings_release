# Install-пакет для Beget (чеклист)

Документ для подготовки «пакета установки» и повторяемого деплоя на Beget.

## 1) Доступы и окружение

- Доступ в панель Beget (временный тех. пользователь).
- SSH: host/port/user + способ auth (пароль или ключ).
- Домен(ы): основной, `www`, поддомены, HTTPS политика.
- Параметры БД MySQL: host, port, db, user, password.

## 2) Секреты `.env` (прод)

- Django: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=false`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`, `PUBLIC_SITE_URL`.
- SMTP: `DJANGO_SMTP_*` (если используем env-переопределение).
- СДЭК: `CDEK_*`.
- Ozon Pay: `OZON_PAY_*` (включая API base и webhook secret).
- CRM/Bitrix/Astrum: `BITRIX24_*`, `ASTRUM_*`.

## 3) Артефакты install-пакета

- Backend:
  - `backend/` (код),
  - `requirements.txt`,
  - миграции,
  - команда запуска (`gunicorn`/доступный аналог на Beget).
- Frontend:
  - итоговый build (`frontend/dist`) либо сборка на сервере.
- Конфиги:
  - web server location rules для `/`, `/api/`, `/staff/` (когда staff-ui включим),
  - статика/медиа директории,
  - ротация логов.

## 4) Порядок деплоя

1. Бэкап БД + текущего релиза.
2. Загрузка кода/артефактов.
3. Установка Python/Node зависимостей.
4. `python manage.py migrate`.
5. `python manage.py collectstatic --noinput`.
6. Перезапуск app-процесса.
7. Smoke-тест:
   - `/api/health`,
   - каталог/корзина/checkout,
   - лиды (calculator/callback/cart),
   - админка,
   - интеграции (СДЭК/Ozon Pay тесты из админки).

## 5) Rollback

- Откат к предыдущему релизу + restore БД при несовместимых миграциях.
- Чёткий критерий rollback: 5xx на публичных маршрутах, недоступность checkout, сбой оплаты.

## 6) Что автоматизируем позже

- Скрипт `deploy_beget.ps1`/`deploy_beget.sh`.
- Шаблон `.env.production.example` без секретов.
- Runbook инцидентов (Ozon Pay, СДЭК, SMTP, Bitrix).
