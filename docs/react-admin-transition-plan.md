# Переход на React Admin (без простоя)

Основа: [admin-react-admin-migration-analysis.md](./admin-react-admin-migration-analysis.md).

## Цель

Перевести админские операции с Django Admin/Unfold на отдельный Staff SPA (`/staff/`) по фазам, не ломая публичную витрину и текущие бизнес-процессы.

## Порядок внедрения

1. **Фаза 0–1 (каркас + auth + OpenAPI)** — **в работе / частично готово (2.0.3a)**
   - Поднять `staff-ui/` (Vite + React Admin + MUI).
   - Ввести `POST /api/staff/v1/auth/token/` и refresh.
   - Включить `drf-spectacular` для Staff API.
   - Первый ресурс: `leads/callback` + dashboard overview.

Сделано в **2.0.3a**: каркас `staff-ui/`, Staff JWT, `metrics/overview`, read-only `leads/callback`, схема `/api/schema/`, dev **http://localhost:17301/staff/**.

2. **Фаза 2–4 (контент, каталог, заказы/лиды)**
   - Перенести CRUD для контента и каталога.
   - Для товара оставить Python-валидации как источник истины.
   - Заказы и лиды перевести на staff endpoints с правами staff only.

3. **Фаза 5–7 (singleton sections, actions, users/groups)**
   - Перенести `site-settings` и `home-content` по секциям `{slug}`.
   - Перенести action endpoints: SMTP test, WB import, Bitrix sync/test.
   - Добавить users/groups и операции смены пароля.

4. **Фаза 8 (ограничение Django Admin)**
   - На проде: отключить `/admin/` для обычных staff.
   - Оставить временный fallback только для superuser/IP allowlist (ограниченный период).

## Принципы без простоя

- Публичный API (`/api/...`) не меняется/не переиспользуется для staff-CRUD.
- Новый функционал управления сначала включается в Staff API, потом скрывается аналог в Django Admin.
- Любая миграция БД должна быть backward-compatible минимум на 1 релиз.
- Rollback: переключение обратно на Django Admin через feature toggle/route policy.

## Критерии готовности релиза фазы

- CI зелёный: backend tests + frontend build.
- OpenAPI Staff API обновлена и проверена.
- Пройден ручной сценарий из раздела 12 спецификации.
- Запись в [CHANGELOG.md](../CHANGELOG.md).
