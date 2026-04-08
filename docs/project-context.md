# Контекст проекта (снимок для продолжения работ)

**Дата фиксации:** 2026-04-02  
**ТЗ:** версия **2.0** (`ТЗ2.0.docx`) — интернет-магазин с Битрикс24, СДЭК, эквайрингом; сводка: [tz-2-0-alignment.md](./tz-2-0-alignment.md). Импорт Excel: [excel-catalog-import.md](./excel-catalog-import.md).  
**Репозиторий:** [github.com/konstmax1388/Fabric_Awinings](https://github.com/konstmax1388/Fabric_Awinings)  
**Ветка по умолчанию:** `main`

## Что реализовано в коде

### Backend (`backend/`)
- **Django 5 + DRF:** модели `Product`, `ProductImage`, `PortfolioProject`, `Review`, `BlogPost`, `CalculatorLead`, `CartOrder` в `api/models.py`.
- **API** под префиксом `/api/`: товары (пагинация 9, фильтры `category`, `show_on_home`, `exclude_slug`, сортировка), портфолио, отзывы, блог; `POST /api/leads/calculator/`, `POST /api/leads/cart/` (номер заказа генерирует сервер); `GET /api/health/`; JWT `auth/token/`, `auth/me/`.
- **Админка:** `api/admin.py` (в т.ч. inline изображений у товара).
- **Демо-данные:** `python manage.py seed_demo` (опция `--purge`); данные в `api/seed_catalog.py`.
- **Тесты:** `backend/tests/test_api.py`, `pytest.ini`; запуск из `backend/`: `python -m pytest tests/ -q`.
- **Docker:** `Dockerfile.dev` выполняет `migrate` перед `runserver`.

### Frontend (`frontend/`)
- **Маршрутизация:** `App.tsx` — корневой layout **`AppShell`**: `CartProvider` оборачивает **`<Outlet />`**, чтобы весь UI был **внутри** дерева `RouterProvider` (иначе `Link` вне контекста ломал навигацию).
- **Данные:** каталог, карточка, главная (подборка, портфолио, отзывы, блог) — **с API**; типы/часть констант в `data/products.ts` (`MOCK_PRODUCTS` как справочник, не основной источник в UI).
- **Корзина:** отдельная страница **`/cart`** (`CartPage`, `CartView`), не drawer. Иконка в шапке и пункт меню — `NavLink` на `/cart`. После «В корзину» — переход на `/cart`.
- **SEO:** `react-helmet-async`, `public/robots.txt`, `public/sitemap.xml` (домен-заглушка для прода), `VITE_SITE_URL` в `.env.example`.
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
- **ТЗ 2.0:** нет синхронизации с **Битрикс24**, **СДЭК**, **эквайринга**, **ЛК покупателя**, **Celery**; каталог пока **локальный** (не overlay поверх Б24).
- React Admin не подключён; контент через **Django admin**; полный CRUD товаров — временный режим до интеграции CRM.
- `sitemap.xml` / `robots.txt` — заменить домен перед продакшеном.
- Динамический sitemap по slug товаров не генерируется на билде.

## Последний зафиксированный контекст (2026-04)

- **Два крупных этапа внедрения:** пошаговый план магазина + Битрикс24, затем импорт номенклатуры (Б24 / WB / Ozon) — [rollout-two-phase-plan.md](./rollout-two-phase-plan.md) (там же список **вопросов, без ответа на которые нельзя сузить интеграцию**).
- **Правила доработок для ИИ** (не ломать поведение, замыкать цепочку, проверки под Django/React): [.cursor/rules/delivery-without-breakage.mdc](../.cursor/rules/delivery-without-breakage.mdc).
- В корне репозитория лежат **`ТЗ2.0.docx`** и **`фабрика тентов контент.xlsx`** (материалы заказчика); не коммитить выдуманные `.env` и локальные lock-файлы `~$*.docx`.

**Клонирование на другом ПК:** `git clone https://github.com/konstmax1388/Fabric_Awinings.git` → скопировать `.env.example` в `.env` (и при необходимости `frontend/.env`), затем `docker compose up --build` и `seed_demo` по [README.md](../README.md).

## Связанные документы
- [development-phases.md](./development-phases.md) — этапы ТЗ 2.0 (12) и статус кода
- [BACKLOG.md](../BACKLOG.md) — беклог
- [requirements.md](./requirements.md) — процесс и хостинг
