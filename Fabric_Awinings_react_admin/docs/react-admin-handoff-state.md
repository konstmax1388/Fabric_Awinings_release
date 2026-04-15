# Состояние: React Admin и стек `Fabric_Awinings_react_admin`

**Зафиксировано:** 2026-04-14  
**Рабочая корневая папка:** `E:\PRO_WORK\Fabric_Awinings_react_admin` (витрина + backend + `admin-ui`; документация в `docs/`).  
**Основной монолитный репозиторий:** `E:\PRO_WORK\Fabric_Awinings` — синхронизировать при необходимости `backend/`, `frontend/`, `staff-ui` / `admin-ui`.

## На чём остановились

- **Старая админка (Django Unfold)** и **витрина** у вас работают.
- **Новая панель (React Admin)** на отдельном порту была «белым экраном»; устранено **несовместимостью версий**: в `admin-ui` стояли **MUI v9**, тогда как **React Admin 5.x** поддерживает только **MUI v5–v7**. Зафиксировано в `admin-ui/package.json`: **`@mui/material` и `@mui/icons-material` ^7.3.6**, пересобраны **`package-lock.json`** и проверка **`npm run build`**.
- Аналогичное понижение MUI сделано в **`Fabric_Awinings/staff-ui`** (те же peer-зависимости).
- **`index.html` admin-ui:** удалён **`<base href="/admin/">`** — при **`basename="/admin"`** у React Admin двойная база ломала Router (белый экран).
- **Docker:** в compose убрано принудительное **`DJANGO_ADMIN_ENABLED=false`** — классическая Unfold доступна на **API-порту** этого стека (**18100/admin/**), React-панель остаётся на **17401**.
- **Порты:** витрина этого стека по умолчанию **17302** (не 17300), чтобы не конфликтовать с **`Fabric_Awinings`** (17300). API **18100**, React Admin **17401**.
- Прочее: отключение автооткрытия браузера Vite в Docker (`DOCKER` / `BROWSER=none`), healthcheck `admin-ui`, опциональный быстрый старт без полного `npm ci` в Dockerfile при уже заполненном volume.

## Куда смотреть в браузере (не путать проекты)

| Репозиторий | Витрина | API | Unfold (старая) | React Admin (новая) |
|-------------|---------|-----|-----------------|---------------------|
| `Fabric_Awinings` | :17300 | :18000 | :17300/admin/ (прокси) или :18000/admin/ | — (при необходимости `staff-ui` в том же репо, порт по конфигу) |
| `Fabric_Awinings_react_admin` | :**17302** | :18100 | :18100/admin/ | :**17401**/admin/ |

## Как продолжить после возвращения

```powershell
cd E:\PRO_WORK\Fabric_Awinings_react_admin
docker compose up --build
```

После смены зависимостей `admin-ui` при странностях:  
`docker compose build admin-ui --no-cache`  
Подробности и таблица URL — **[README.md](../README.md)** в корне этого каталога.

## Документы по продукту (миграция RA)

- [admin-react-admin-migration-analysis.md](./admin-react-admin-migration-analysis.md) — анализ и фазы.
- [react-admin-transition-plan.md](./react-admin-transition-plan.md) — план перехода (если заполнен).
