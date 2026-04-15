# Fabric Awnings — витрина + API + React Admin + Unfold

Корень: **`E:\PRO_WORK\Fabric_Awinings_react_admin`**.

## Важно: два разных проекта — разные порты

Частая причина «ничего не работает» — открывают URL от **одного** репозитория, а `docker compose` запущен из **другого**, или путают **17300** и **17302**.

### 1) Основной сайт + классическая админка — репозиторий `Fabric_Awinings`

| Что | URL |
|-----|-----|
| Витрина | http://localhost:17300 |
| API | http://localhost:18000 |
| **Старая админка (Django Unfold)** | http://localhost:17300/admin/ (прокси с витрины) или http://localhost:18000/admin/ |

```powershell
cd E:\PRO_WORK\Fabric_Awinings
docker compose up --build
```

### 2) Этот репозиторий — React Admin + тот же код витрины/API, но **другие порты**

| Что | URL |
|-----|-----|
| Витрина | http://localhost:**17302** (не 17300 — он часто занят проектом выше) |
| API | http://localhost:18100 |
| **Классическая админка (Unfold)** | В docker-compose по умолчанию **включена** → http://localhost:18100/admin/ (отключение: `DJANGO_ADMIN_ENABLED=false`) |
| **Панель (React Admin)** | http://localhost:17401/staff/ |

**Важно:** **React Admin** — **17401/staff/**; **Unfold** — **18100/admin/**. Если `DJANGO_ADMIN_ENABLED=false`, запросы на `http://localhost:18100/admin/` **редиректят** на React (`DJANGO_ADMIN_REDIRECT_URL`, по умолчанию …/staff/). На проде обычно один домен: **`/staff/`** — панель менеджеров, **`/admin/`** — Django.

Панель собрана на **React Admin 5.x** — ему нужен **MUI v5–v7** (в проекте зафиксирован **v7**). **MUI v9** с ним не совместим по зависимостям и давал белый экран. После обновления `admin-ui/package.json` обязательно **`docker compose build admin-ui --no-cache`** (или `up --build`), чтобы в контейнер попали новые `package-lock.json` и `node_modules`.

```powershell
cd E:\PRO_WORK\Fabric_Awinings_react_admin
docker compose up --build
```

Оба стека можно поднять одновременно (порты не пересекаются). Если тормозит машина — остановите ненужный: в каталоге проекта `docker compose down`.

Только API + React-панель (без витрины): `docker compose up api admin-ui`.

Порт витрины задаётся **`FABRIC_FRONTEND_PORT`** в `.env` (по умолчанию в compose — **17302**).

## Быстрый старт (Docker)

```powershell
cd E:\PRO_WORK\Fabric_Awinings_react_admin
copy .env.example .env
docker compose up --build
```

React-панель: staff JWT (`POST /api/staff/v1/auth/token/`), пользователь с `is_staff=True` (см. `ensure_dev_admin` в dev).

### Django Unfold (`/admin/` на API)

В `docker-compose` по умолчанию **`DJANGO_ADMIN_ENABLED=true`**: Unfold доступна на `http://localhost:18100/admin/`. Чтобы отключить (только React Admin, редирект с `:18100/admin/` на SPA): **`DJANGO_ADMIN_ENABLED=false`** в `.env` и перезапуск `api`. Подробнее: [docs/phase-8-django-admin-cutover.md](docs/phase-8-django-admin-cutover.md).

## Локально без Docker

```powershell
# Терминал 1 — backend (без DJANGO_ADMIN_ENABLED=true маршрут /admin редиректит на React)
cd E:\PRO_WORK\Fabric_Awinings_react_admin\backend
$env:DJANGO_ADMIN_ENABLED='true'; python manage.py runserver 0.0.0.0:18100

# Терминал 2 — витрина
cd E:\PRO_WORK\Fabric_Awinings_react_admin\frontend
npm install
npm run dev

# Терминал 3 — панель
cd E:\PRO_WORK\Fabric_Awinings_react_admin\admin-ui
npm install
npm run dev
```

## Белый экран на http://localhost:17401/staff/

- Без внешнего `BrowserRouter` react-admin по умолчанию поднимает **HashRouter**; при `vite base: '/staff/'` и URL **без `#`** после цикла auth часто пустой экран. В **`admin-ui/src/main.tsx`** — **`BrowserRouter basename="/staff"`** и **ErrorBoundary**. У **`<Admin>` не задаётся `basename`**, иначе получится **`/staff/staff/login`**.
- Не открывайте **17300** вместо **17302** для витрины этого репозитория.
- React Admin — **17401/staff/**. Unfold в этом стеке — **18100/admin/**, не путать.
- F12 → Console, если пусто.

## ERR_EMPTY_RESPONSE на :17401

Дождитесь `VITE … ready` в логах `admin-ui`; первый старт с пустым volume может занять минуту. Проверка: `docker compose ps`, у `admin-ui` — **healthy**. Попробуйте http://127.0.0.1:17401/staff/.

## Порт занят (Bind … failed)

См. **`.env.example`**: смените **`FABRIC_FRONTEND_PORT`** или остановите другой стек (`docker compose down` в каталоге `Fabric_Awinings`).

## Связь с `Fabric_Awinings`

Синхронизируйте `backend/`, `frontend/`, `admin-ui/` по мере нужды.

## Продакшен

Соберите `admin-ui` (`npm run build`), отдайте статику под `/staff/`; **`/admin/`** оставьте для Django Unfold; API и медиа — Django.
