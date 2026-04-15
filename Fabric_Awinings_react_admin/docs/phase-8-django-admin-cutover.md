# Фаза 8: отключение Django Admin и редирект на React Admin

См. [admin-react-admin-migration-analysis.md §3.4, §12](./admin-react-admin-migration-analysis.md).

## Переменные окружения (Django)

| Переменная | Значение | Эффект |
|------------|----------|--------|
| `DJANGO_ADMIN_ENABLED` | `true` | Классическая админка на `/admin/` (явное включение). |
| `DJANGO_ADMIN_ENABLED` | `false` или не задано | Маршруты `django.contrib.admin` **не** регистрируются (**поведение по умолчанию** в `settings.py` и в `docker-compose` для сервиса `api`). |
| `DJANGO_ADMIN_REDIRECT_URL` | Полный URL, напр. `http://localhost:17401/staff/` | Имеет смысл **только** при `DJANGO_ADMIN_ENABLED=false`: любой запрос к `/admin/...` получает **302** на этот URL (React-панель). Если не задан — `/admin/` даёт **404** от Django. |

Пример для локального стека React Admin:

```env
DJANGO_ADMIN_ENABLED=false
DJANGO_ADMIN_REDIRECT_URL=http://localhost:17401/staff/
```

## Nginx / reverse proxy (прод)

В этом репозитории **docker-compose** отдаёт API на порту хоста и React Admin через Vite на **17401** без единого nginx-файла. В проде обычно один origin:

- `/api/` → Django (или gunicorn);
- `/staff/` → статика **admin-ui** (`index.html` + assets), `try_files` для SPA; `/admin/` → Django Unfold;
- витрина на `/`.

Редирект с Django (`DJANGO_ADMIN_REDIRECT_URL`) нужен, если пользователи всё ещё открывают **порт API** напрямую; при доступе только через общий nginx с `/admin/` на SPA редирект с бэкенда может не понадобиться.

## Ручной чек-лист перед выключением Unfold (фрагмент §12.2 спецификации)

- [ ] Полный проход сценариев из текущего `admin.py`: товар с вариантами, импорт WB dry-run, SMTP test, синк Б24 dry-run, сохранение секций настроек и главной.
- [ ] Выборочно сверить данные в БД с тем, что делала Django Admin (3–5 сущностей).
- [ ] Staff JWT, CORS и префикс `/api/staff/v1/` на целевом домене.
- [ ] Резервный план: временно `DJANGO_ADMIN_ENABLED=true` при инциденте.
