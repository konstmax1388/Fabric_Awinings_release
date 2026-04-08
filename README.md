# Fabric Awinings / Фабрика Тентов

Сайт производства **тентов на заказ**: лендинг, каталог, админка. Концепция — «лёгкая архитектура», продающий современный интерфейс.

## Репозиторий

- **GitHub:** [github.com/konstmax1388/Fabric_Awinings](https://github.com/konstmax1388/Fabric_Awinings)
- **Клонирование:** `git clone https://github.com/konstmax1388/Fabric_Awinings.git`
- **Ветки:** `main` — основная разработка; `release` — релизная линия (`origin/main`, `origin/release`).

## Документация

| Раздел | Файл |
|--------|------|
| Оглавление документации | [docs/README.md](docs/README.md) |
| Требования, процесс, хостинг, Git | [docs/requirements.md](docs/requirements.md) |
| Функционал (frontend, админка, интеграции) | [docs/functional-requirements.md](docs/functional-requirements.md) |
| Этапы (ТЗ 2.0: 12 этапов, статус кода) | [docs/development-phases.md](docs/development-phases.md) |
| Сводка ТЗ 2.0 и импорт Excel | [docs/tz-2-0-alignment.md](docs/tz-2-0-alignment.md), [docs/excel-catalog-import.md](docs/excel-catalog-import.md) |
| Снимок контекста (стек, API, корзина) | [docs/project-context.md](docs/project-context.md) |
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

2. Соберите и поднимите **frontend + API** (Django):

   ```bash
   docker compose up --build
   ```

3. Откройте в браузере: **http://localhost:17300** (или `FABRIC_FRONTEND_PORT`).  
   Проверка API: **http://localhost:18000/api/health/** (или `FABRIC_API_PORT`).

4. Остановка: `Ctrl+C` в терминале или `docker compose down`.

**Если Vite пишет, что не находит пакет (например `react-router-dom`):** при старте контейнера выполняется **`npm ci`** — зависимости подтягиваются в том `node_modules` по актуальному `package-lock.json`. Сделайте **`docker compose up --build`**. Если ошибка осталась: **`docker compose down -v`** (удалит том с `node_modules` этого проекта) и снова **`docker compose up --build`**.

Имя проекта Compose задаётся в **`.env`** (`COMPOSE_PROJECT_NAME=fabric-awnings`), чтобы контейнеры и тома не пересекались с другими проектами. Том **`fabric_awnings_frontend_node_modules`** хранит `node_modules` внутри Docker — не затирается биндингом `./frontend:/app`.

### Локально без Docker

```bash
cd frontend
npm install
npm run dev
```

Откройте **http://localhost:17300** (или `FABRIC_FRONTEND_PORT` из `.env`).

### Backend (Django + DRF)

Сервис **`api`** в `docker-compose.yml`: **Django 5**, **Django REST Framework**, **django-cors-headers**. Эндпоинт **`GET /api/health/`** — проверка связи (на главной отображается строка «API: подключено»).

Локально без Docker:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py runserver 0.0.0.0:8000
```

При локальном frontend задайте в `frontend/.env`: `VITE_API_URL=http://localhost:8000`.

## Лицензия

Уточняется у владельца репозитория.
