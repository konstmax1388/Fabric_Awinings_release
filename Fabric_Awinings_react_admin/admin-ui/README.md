# Admin UI (React Admin)

Панель менеджеров: SPA под префиксом **`/staff/`** (классическая Django Admin на **`/admin/`** — отдельно). API — **`/api/staff/v1/`**.

## Разработка

1. Запустите Django API (локально или Docker в корне репозитория `Fabric_Awinings_react_admin`, порт **18100** по умолчанию).
2. В каталоге `admin-ui`:

```bash
npm install
npm run dev
```

Откройте **http://localhost:17401/staff/**.

Vite проксирует `/api`, `/media`, `/static` на `VITE_PROXY_TARGET` или `VITE_API_ORIGIN`, иначе на `http://127.0.0.1:18100`.

| Переменная | Назначение |
|------------|------------|
| `VITE_API_ORIGIN` | Полный origin API (если запросы без прокси) |
| `VITE_PROXY_TARGET` | Цель прокси в Docker: `http://api:8000` |

## Сборка

```bash
npm run build
```

Выход — `admin-ui/dist/`. В проде Nginx: `location /staff/ { try_files $uri $uri/ /staff/index.html; }`, отдельно `location /admin/` → Django Unfold, API — прежний `/api/`.
