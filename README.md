# Fabric Awnings / Фабрика Тентов

Сайт производства **тентов на заказ**: лендинг, каталог, админка. Концепция — «лёгкая архитектура», продающий современный интерфейс.

## Репозиторий (монорепо)

Один репозиторий — три клиентских части + API:

| Каталог | Содержание |
|---------|------------|
| `backend/` | Django + DRF, Staff API `/api/staff/v1/`, Unfold, медиа |
| `frontend/` | Витрина (Vite + React) |
| `staff-ui/` | Панель на React Admin (legacy-порт в dev, см. README в каталоге) |
| `admin-ui/` | **Новая** панель на React Admin — в Docker: **http://localhost:17401/admin/** (`FABRIC_ADMIN_UI_PORT`) |

- **Разработка:** [github.com/konstmax1388/Fabric_Awinings](https://github.com/konstmax1388/Fabric_Awinings) — `git clone https://github.com/konstmax1388/Fabric_Awinings.git`
- **Релиз / зеркало для деплоя (пустой репозиторий):** [github.com/konstmax1388/Fabric_Awinings_release](https://github.com/konstmax1388/Fabric_Awinings_release)  
  После коммита в основном репозитории:  
  `git remote add release https://github.com/konstmax1388/Fabric_Awinings_release.git`  
  `git push -u release main`  
  (или отдельная ветка `release`, если заведёте.)

Каталог **`Fabric_Awinings_react_admin/`** в рабочей копии — исторический дубликат для экспериментов; целевой монорепо — корень с `admin-ui/`. Дубликат можно не переносить в `Fabric_Awinings_release` (удалить из индекса или не клонировать вложенную копию).

### Выкладка на прод (без лишнего)

На сервер не обязательно копировать служебное: **`.cursor/`**, **`docs/`**, тесты, `node_modules`, локальные `.env`. Для **rsync** используйте список исключений **[`deploy/rsync-exclude.txt`](deploy/rsync-exclude.txt)**:

```bash
rsync -av --delete --exclude-from=deploy/rsync-exclude.txt ./ user@сервер:/path/to/app/
```

При деплое через **`git pull`** полный клон тянет и документацию — это только лишний объём на диске; критично не публиковать **секреты** в репозитории и не класть **`.env`** с прод-паролями в Git. Статику витрины и `admin-ui` на прод обычно отдают уже **собранные** `dist/` (сборка в CI или на сервере после `npm ci && npm run build`).

## Документация

| Раздел | Файл |
|--------|------|
| Оглавление документации | [docs/README.md](docs/README.md) |
| Требования, процесс, хостинг, Git | [docs/requirements.md](docs/requirements.md) |
| Функционал (frontend, админка, интеграции) | [docs/functional-requirements.md](docs/functional-requirements.md) |
| Этапы (ТЗ 2.0: 12 этапов, статус кода) | [docs/development-phases.md](docs/development-phases.md) |
| Сводка ТЗ 2.0 и импорт Excel | [docs/tz-2-0-alignment.md](docs/tz-2-0-alignment.md), [docs/excel-catalog-import.md](docs/excel-catalog-import.md) |
| Снимок контекста (стек, API, корзина) | [docs/project-context.md](docs/project-context.md) |
| Что делать дальше (приоритеты и долг) | [docs/next-steps.md](docs/next-steps.md) |
| Журнал изменений (версии) | [CHANGELOG.md](CHANGELOG.md) |
| Деливераблы и критерии приёмки | [docs/deliverables-and-acceptance.md](docs/deliverables-and-acceptance.md) |
| Дизайн и чек-лист | [docs/design.md](docs/design.md) |
| Компоненты UI | [docs/components.md](docs/components.md) |
| Анимации (Framer Motion) | [docs/animations.md](docs/animations.md) |
| Типографика | [docs/typography.md](docs/typography.md) |

## Беклог

План работ и открытые задачи — **[BACKLOG.md](BACKLOG.md)**.

## Разработка в Docker (hot reload)

Стек: **Vite + React + TypeScript + Tailwind** в каталоге `frontend/`. Контейнер монтирует исходники: правки в `frontend/src` сразу видны в браузере (**HMR**). Для файлового watch на Windows в Docker включён **polling**.

### Требования

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (или Docker Engine + Compose v2).

### Перед запуском: порты

1. Посмотрите, что уже слушает Docker: **`docker ps`** (колонка PORTS).
2. Если порт из `.env` занят **вне** Docker (например, локальный Vite другого проекта на 5173), задайте другой **`FABRIC_FRONTEND_PORT`** в `.env`.
3. В PowerShell проверка порта, например:  
   `Get-NetTCPConnection -LocalPort 17300 -ErrorAction SilentlyContinue`

По умолчанию **и локально (`npm run dev`), и в Docker** dev-сервер слушает **17300** — не открывайте **5173** для этого репозитория (часто там другой проект).

### Запуск

1. Скопируйте переменные окружения (при конфликте порта отредактируйте `.env`):

   ```bash
   copy .env.example .env
   ```

   В PowerShell: `Copy-Item .env.example .env`

2. Соберите и поднимите **API + витрина + admin-ui** (React Admin):

   ```bash
   docker compose up --build
   ```

3. Откройте в браузере: витрина **http://localhost:17300** (или `FABRIC_FRONTEND_PORT`); новая панель **http://localhost:17401/admin/** (или `FABRIC_ADMIN_UI_PORT`).  
   Проверка API: **http://localhost:18000/api/health/** (или `FABRIC_API_PORT`).  
   Только API + витрина без React-панели: `docker compose up api frontend`.

4. Остановка: `Ctrl+C` в терминале или `docker compose down`.

**Если Vite пишет, что не находит пакет (например `react-router-dom`):** при старте контейнера выполняется **`npm ci`** — зависимости подтягиваются в том `node_modules` по актуальному `package-lock.json`. Сделайте **`docker compose up --build`**. Если ошибка осталась: **`docker compose down -v`** (удалит том с `node_modules` этого проекта) и снова **`docker compose up --build`**.

Имя проекта Compose задаётся в **`.env`** (`COMPOSE_PROJECT_NAME=fabric-awnings`), чтобы контейнеры и тома не пересекались с другими проектами. Тома **`fabric_awnings_frontend_node_modules`** и **`fabric_awnings_admin_ui_node_modules`** хранят `node_modules` внутри Docker — не затираются биндингом исходников.

### Локально без Docker

```bash
cd frontend
npm install
npm run dev
```

Откройте **http://localhost:17300** (или `FABRIC_FRONTEND_PORT` из `.env`).

### Backend (Django + DRF)

Сервис **`api`** в `docker-compose.yml`: **Django 5**, **Django REST Framework**, **django-cors-headers**. Эндпоинт **`GET /api/health/`** — проверка связи (на главной отображается строка «API: подключено»).

При старте контейнера **`api`** выполняется **`migrate`** (см. `backend/docker-entrypoint.dev.sh`). Если после `git pull` админка падает с **`no such column`** или **`no such table`**, схема БД отстаёт от кода — примените миграции и перезапустите API:

```bash
docker compose exec api python manage.py migrate --noinput
docker compose restart api
```

**Админка `/admin/` или прокси с Vite отдаёт 502:** обычно контейнер **`api`** не поднялся или падает в цикле. После изменения **`backend/requirements.txt`** (например, добавили **django-simple-captcha**) обязательно пересоберите образ API: **`docker compose build api`** или **`docker compose up --build`**. Если не помогло: **`docker compose logs api`** (ищите `ModuleNotFoundError`, `ImportError`, ошибки миграций `captcha`). Прямая проверка без прокси: **http://localhost:18000/api/health/** — если не открывается, чините API, а не фронт.

Локально без Docker:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python manage.py migrate
# Порт 18000 — как у `FABRIC_API_PORT` в Docker; тогда Vite (17300) проксирует /admin без .env
.\.venv\Scripts\python manage.py runserver 0.0.0.0:18000
```

Если Django слушает **другой** порт (например 8000), в **`frontend/.env`** задайте `VITE_API_URL=http://localhost:8000` (это же значение используется как цель прокси для `/admin` и `/media`).

**502 на http://localhost:17300/admin/** — почти всегда значит: не запущен Django или порт не совпадает с `VITE_API_URL` / `VITE_PROXY_TARGET` (по умолчанию ожидается **http://127.0.0.1:18000**). Проверка: откройте **http://localhost:18000/api/health/** (или ваш порт API).

## Лицензия

Уточняется у владельца репозитория.
