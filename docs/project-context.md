# Контекст проекта (снимок для продолжения работ)

**Дата фиксации:** 2026-04-02  
**Версия продукта:** см. файл **`VERSION`** в корне репозитория (текущая метка **2.0.1a**); в Django admin (Unfold) номер версии показывается в бейдже справа в шапке. История изменений: [CHANGELOG.md](../CHANGELOG.md).  
**Зависимости (аудит):** фронт — `npm run build` / `npm run lint`; бэкенд — `requirements.txt` (Django 5.2.13+, pytest 9.x). **Прод БД:** MySQL **8.0.45** (не PostgreSQL из ТЗ). Детальный план — [next-steps.md](./next-steps.md).  
**ТЗ:** версия **2.0** (`ТЗ2.0.docx`) — интернет-магазин с Битрикс24, СДЭК, эквайрингом; сводка: [tz-2-0-alignment.md](./tz-2-0-alignment.md). Импорт Excel: [excel-catalog-import.md](./excel-catalog-import.md).  
**Репозиторий:** [github.com/konstmax1388/Fabric_Awinings](https://github.com/konstmax1388/Fabric_Awinings)  
**Ветка по умолчанию:** `main` — публикация изменений: **`git push origin main`**; релизные теги вида **`v2.0.1a`** по договорённости команды.

## Что реализовано в коде

### Backend (`backend/`)
- **Django 5 + DRF:** модели `Product`, `ProductImage`, `PortfolioProject`, `Review`, `BlogPost`, `CalculatorLead`, `CartOrder` в `api/models.py`.
- **API** под префиксом `/api/`: товары (пагинация 9, фильтры `category`, `show_on_home`, `exclude_slug`, сортировка), портфолио, отзывы, блог; `POST /api/leads/calculator/`, `POST /api/leads/callback/`, `POST /api/leads/cart/` (номер заказа, в ответе также `fulfillmentStatus`); на эндпоинтах лидов — **throttle** по IP и проверка honeypot-поля `website`; `GET /api/health/`; JWT регистрация/логин, `auth/me/`, смена пароля, адреса (`/api/addresses/`), заказы покупателя.
- **Заказы (`CartOrder`):** поля под синхронизацию с Б24, оплату, СДЭК, опциональный `user` — см. миграция `0002_cartorder_integration_fields`.
- **Админка:** `api/admin.py` (в т.ч. inline изображений у товара).
- **Демо-данные:** `python manage.py seed_demo` (опция `--purge`); данные в `api/seed_catalog.py`.
- **Тесты:** `backend/tests/test_api.py`, `pytest.ini`; запуск из `backend/`: `python -m pytest tests/ -q`.
- **Docker:** `Dockerfile.dev` выполняет `migrate` перед `runserver`.

### Frontend (`frontend/`)
- **Маршрутизация:** `App.tsx` — корневой layout **`AppShell`**: `CartProvider` оборачивает **`<Outlet />`**; страницы подключаются через **`React.lazy`** и **`Suspense`** (уменьшение начального бандла).
- **Данные:** каталог, карточка, главная (подборка, портфолио, отзывы, блог) — **с API**; типы/часть констант в `data/products.ts` (`MOCK_PRODUCTS` как справочник, не основной источник в UI).
- **Корзина и оформление:** страница **`/cart`**; мультистеп **`/checkout`**; формы с маской телефона РФ и клиентской валидацией; лиды уходят с пустым полем `website` (антиспам).
- **ЛК:** `/account/login`, `register`, `orders`, профиль, адреса, смена пароля (см. `frontend/src/pages/account/`).
- **SEO:** `react-helmet-async`, `public/robots.txt`, **`GET /sitemap.xml`** на бэкенде (канонический URL из `PUBLIC_SITE_URL` / env); `VITE_SITE_URL` в `.env.example`.
- **Изображения:** оптимизированная отдача/компоненты для витрины — см. `lib/optimizedImage.ts`, `OptimizedImage`.
- **Порты:** Vite в dev **17300**, API по умолчанию **18000** (`VITE_API_URL`).

### Инфраструктура
- `docker-compose.yml`: сервисы `api`, `frontend`, том под `node_modules`.

## Команды на память

```bash
# Поднять стек
docker compose up --build

# Заполнить каталог (после первого запуска API)
docker compose exec api python manage.py seed_demo

# Бэкенд-тесты (локально)
cd backend && python -m pytest tests/ -q

# Сборка фронта
cd frontend && npm run build
```

## Известные ограничения / не сделано
- **ТЗ 2.0:** нет полной синхронизации с **Битрикс24** (каталог на сайте), **СДЭК**, **эквайринга**, **Celery**; заказы в CRM — через Astrum при настройке (см. `docs/astrum-bitrix-crm.md`).
- **ЛК:** нет трека СДЭК и «повтор заказа» в смысле ТЗ 2.0.
- React Admin не подключён; контент через **Django admin**; полный CRUD товаров — временный режим до интеграции CRM.
- Перед продакшеном: задать **`DJANGO_PUBLIC_SITE_URL`** / **`VITE_SITE_URL`** для корректных URL в `sitemap.xml` и ссылках.

## Последний зафиксированный контекст (2026-04)

- **Два крупных этапа внедрения:** пошаговый план магазина + Битрикс24, затем импорт номенклатуры (Б24 / WB / Ozon) — [rollout-two-phase-plan.md](./rollout-two-phase-plan.md) (там же список **вопросов, без ответа на которые нельзя сузить интеграцию**).
- **Правила доработок для ИИ** (не ломать поведение, замыкать цепочку, проверки под Django/React): [.cursor/rules/delivery-without-breakage.mdc](../.cursor/rules/delivery-without-breakage.mdc).
- В корне репозитория лежат **`ТЗ2.0.docx`** и **`фабрика тентов контент.xlsx`** (материалы заказчика); не коммитить выдуманные `.env` и локальные lock-файлы `~$*.docx`.

**Клонирование на другом ПК:** `git clone https://github.com/konstmax1388/Fabric_Awinings.git` → скопировать `.env.example` в `.env` (и при необходимости `frontend/.env`), затем `docker compose up --build` и `seed_demo` по [README.md](../README.md).

## Связанные документы
- [development-phases.md](./development-phases.md) — этапы ТЗ 2.0 (12) и статус кода
- [BACKLOG.md](../BACKLOG.md) — беклог  
- [CHANGELOG.md](../CHANGELOG.md) — журнал изменений по версиям
- [requirements.md](./requirements.md) — процесс и хостинг
