# Staff UI (React Admin)

Панель персонала по спецификации [docs/admin-react-admin-migration-analysis.md](../docs/admin-react-admin-migration-analysis.md): отдельный SPA под префиксом **`/staff/`**, бэкенд — **`/api/staff/v1/`**.

## Разработка

1. Запустите Django API (по умолчанию в Docker — порт **18000** на хосте).
2. В каталоге `staff-ui`:

```bash
npm install
npm run dev
```

Откройте **http://localhost:17301/staff/** (Vite проксирует `/api` на `VITE_API_ORIGIN`, по умолчанию `http://127.0.0.1:18000`).

Переменные:

| Переменная | Назначение |
|------------|------------|
| `VITE_API_ORIGIN` | Origin бэкенда (пусто = тот же хост, что у dev-сервера; при прокси обычно не нужен) |

## Сборка

```bash
npm run build
```

Артефакты — в `staff-ui/dist/`; в проде отдаются веб-сервером с `location /staff/` на статику и без конфликта с витриной на `/`.

## Тема (бренд)

Акцент и фон по [docs/design.md](../docs/design.md): оранжевый `#E87A00`, фон `#FEFBF5` — при необходимости задайте кастомную тему MUI в `src/App.tsx` (учитывайте совместимость версий MUI с `react-admin`).
