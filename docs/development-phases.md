# Этапы разработки

Порядок работ по проекту «Фабрика Тентов». **Эталонная последовательность по ТЗ 2.0** — таблица из 12 этапов ниже; ранее в репозитории использовалась сокращённая схема из 10 этапов — она сохранена в колонке «Статус в коде» как ориентир.

Детальный функционал — [functional-requirements.md](./functional-requirements.md), [tz-2-0-alignment.md](./tz-2-0-alignment.md). Дизайн — [design.md](./design.md), [typography.md](./typography.md).

---

## Этапы по ТЗ 2.0 (апрель 2026)

| № | Этап (ТЗ 2.0) | Содержание | Статус в коде (снимок) |
|---|----------------|------------|-------------------------|
| **1** | Настройка проекта | Vite + React + Tailwind + Django + DRF, маршрутизация | Сделано: Docker, health, CORS, порты |
| **2** | Вёрстка главной | Все **11 блоков** главной, адаптив | Сделано: блоки в `frontend/src` |
| **3** | Анимации | Framer Motion по списку ТЗ | Сделано: пресеты, счётчики, калькулятор, хедер |
| **4** | Каталог + корзина + оформление | Сетка, фильтры, карточка, корзина, **мультишаговый** checkout | Частично: каталог и корзина есть; **полный checkout, СДЭК, оплата** — не сделаны |
| **5** | Личный кабинет | История заказов, статусы, трек СДЭК, повтор заказа, профиль | Не сделано |
| **6** | Интеграция Битрикс24 | REST каталог/остатки, создание заказа, вебхуки статусов, кэш | Не сделано (см. [bitrix24-ecommerce-plan.md](./bitrix24-ecommerce-plan.md)) |
| **7** | Интеграция СДЭК | Тарифы, ПВЗ на карте, создание отправления, вебхуки | Не сделано |
| **8** | Интеграция эквайринга | Виджет, двухстадийный платёж, СБП, возвраты, чеки | Не сделано |
| **9** | Фоновые задачи | Celery + Redis: синк, ретраи заказов, очистка кэша | Не сделано |
| **10** | Админка | **React Admin** + CRUD по ТЗ; товары — overlay (видимость, порядок, SEO) | Частично: **Django admin**, полный CRUD товаров (временно; целевое — ТЗ 2.0) |
| **11** | SEO | Мета, sitemap, микроразметка, OG | Частично: Helmet, robots/sitemap-заглушки |
| **12** | Тестирование | В т.ч. интеграции | Частично: pytest API |

**Срок по ТЗ:** 10–14 недель (1 разработчик full-time).

---

## Замечания по плану

- Этапы **4–8** взаимосвязаны: без Б24/СДЭК/эквайринга «полный магазин» по ТЗ не закрыт.
- Импорт чернового каталога из Excel — [excel-catalog-import.md](./excel-catalog-import.md); не заменяет синхронизацию с Б24.
- Стек в ТЗ: **PostgreSQL**, **Axios**, **React Hook Form + Yup**, **Swiper**, **Zustand/RTK** — при необходимости выровнять с текущим кодом (TS, fetch и т.д.).

---

## Связанные документы

- [requirements.md](./requirements.md) — процесс, Docker, продакшен-хостинг  
- [functional-requirements.md](./functional-requirements.md) — функционал и админка  

---

## Статус реализации (код) — деталь

- **Этап 1** — сделано: Vite/React/Tailwind, **Django + DRF** (`backend/`), **CORS**, `docker compose` (`api` + `frontend`), **React Router**, `VITE_API_URL`, `GET /api/health/`.
- **Этап 2** — главная: **11 блоков** в `frontend/src` (`SiteHeader` … `SiteFooter`), страницы-заглушки `/catalog`, `/portfolio`, `/contacts`, `/blog`.
- **Этап 3** — **Framer Motion** на главной: пресеты в `frontend/src/lib/motion-presets.ts`, `AnimatedCounter` / `PulsingCTA`, fade-up + stagger по секциям, hover карточек, анимация смены цены в калькуляторе, бургер и мобильное меню в `SiteHeader` (см. [BACKLOG.md](../BACKLOG.md)).
- **Этап 4 (часть)** — каталог: `CatalogPage` / `ProductPage` — данные с **`GET /api/products/`** (фильтр `?category=`, сортировка, пагинация `?page=`); корзина **`/cart`**, `POST /api/leads/cart/`. Нет: мультишагового оформления, СДЭК, оплаты.
- **Маркетплейсы** — у товара поле `marketplaceLinks`; `MarketplaceLinks` с `hrefById` и `linkKeys`; глобальные URL — `GLOBAL_MARKETPLACE_URLS` в `site.ts`.
- **Калькулятор** — `lib/calculator.ts`, отправка заявки **`POST /api/leads/calculator/`**.
- **Backend** — модели и миграции в `backend/api/`, JWT, `seed_demo`.
- **Админка** — Django `admin.py` (не React Admin).
- **SEO** — `react-helmet-async`, `public/robots.txt`, `public/sitemap.xml` (заглушка домена).
- **Тесты** — `pytest` в `backend/tests/`.

### Маршрутизация и корзина (важно для отладки)

- В **`App.tsx`** layout **`AppShell`**: `CartProvider` → `<Outlet />` — все страницы внутри **`RouterProvider`**, иначе `Link` вне контекста ломает SPA.
- Корзина: страница **`/cart`** (`CartPage`, `components/cart/CartView.tsx`), оформление заказа **`POST /api/leads/cart/`**.

### Чек-лист ручного теста

1. `docker compose up --build`, дождаться API и Vite.
2. `docker compose exec api python manage.py seed_demo` (если каталог пустой).
3. Главная: подборка, портфолио, отзывы, превью блога с API.
4. Каталог: фильтр, сортировка, пагинация; карточка товара и «похожие».
5. **`/cart`**: состав, оформление — номер заказа и подтверждение с сервера.
6. Калькулятор: отправка — 201 и запись в админке.
7. `npm run build` в `frontend/`.

**Снимок контекста для ИИ/команды:** [project-context.md](./project-context.md).
