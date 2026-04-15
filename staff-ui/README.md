# Admin UI (React Admin)

Панель по [docs/admin-react-admin-migration-analysis.md](../docs/admin-react-admin-migration-analysis.md): SPA под **`/admin/`**, API — **`/api/staff/v1/`**.

Автономная разработка панели перенесена в репозиторий **`Fabric_Awinings_react_admin`** (порты 18100 / 17401). Этот каталог в основном репозитории можно синхронизировать с `admin-ui` оттуда.

## Разработка

1. Django API (Docker — **18000** или см. новый проект).
2. В каталоге `staff-ui`:

```bash
npm install
npm run dev
```

Откройте **http://localhost:17301/admin/**. Прокси: `VITE_PROXY_TARGET` или `VITE_API_ORIGIN`, иначе `http://127.0.0.1:18000`.

## Сборка

```bash
npm run build
```

Статика в `dist/` — префикс nginx **`/admin/`**.
