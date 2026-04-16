# Changelog

Формат основан на подходе [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/).  
**Текущая версия** продукта хранится в файле **[VERSION](VERSION)** (источник для бейджа в Django admin).

## [2.0.5a] — 2026-04-16

### Добавлено

- **Монорепо:** каталог **`admin-ui/`** (React Admin, Staff API), сервис **`admin-ui`** в **`docker-compose.yml`** (порт по умолчанию **17401**), том **`fabric_awnings_admin_ui_node_modules`**.
- **CORS/CSRF:** в значения по умолчанию добавлены origin **localhost:17401** / **127.0.0.1:17401** для новой панели.
- **Документация:** корневой **README** — структура монорепо, ссылка на репозиторий релиза **[Fabric_Awinings_release](https://github.com/konstmax1388/Fabric_Awinings_release)** и команды `git remote add release` / `git push`.

### Изменено

- **`.env.example`:** `FABRIC_ADMIN_UI_PORT`, комментарии к CORS/CSRF с **17401**.

## [2.0.4a] — 2026-04-14

### Добавлено

- **Staff API (фаза 2):** CRUD `portfolio-projects`, `reviews`, `blog-posts`; список + правка `email-templates` (без create/delete); **`POST /api/staff/v1/uploads/`** — загрузка изображений для привязки по `relativePath`.
- **staff-ui:** разделы Портфолио, Отзывы, Блог, Шаблоны писем (список/создание/редактирование), загрузка картинок через компонент `StaffImageUploadInput`; поиск по спискам (query `search`).

### Изменено

- `staff-ui`: расширен `dataProvider` (create/update/delete, поиск, сортировка по ресурсам).

## [2.0.3a] — 2026-04-14

### Добавлено

- **Staff API** (`/api/staff/v1/`): JWT для пользователей с `is_staff` (`auth/token/`, `auth/token/refresh/`), лимит `staff_auth` на вход.
- Staff: **`GET /metrics/overview/`** — сводные метрики для дашборда; **`GET /leads/callback/`** и **`GET …/leads/callback/{id}/`** — список и просмотр заявок «обратный звонок» (camelCase в JSON).
- **OpenAPI**: `drf-spectacular`, эндпоинты **`/api/schema/`** и **`/api/schema/swagger/`**.
- **staff-ui**: новое SPA (**Vite + React Admin + MUI**), префикс **`/staff/`**, дашборд + список заявок обратного звонка; прокси dev на порт **17301** (см. `staff-ui/README.md`).

### Изменено

- CORS/CSRF по умолчанию дополняются origin **localhost:17301** для staff-ui.
- Версии: `VERSION` = **2.0.3a**, `staff-ui/package.json` = **2.0.3-a** (витрина **frontend** без изменения номера в этом релизе).

## [2.0.2a] — 2026-04-14

### Добавлено

- Checkout: интеграция **СДЭК v3** (виджет ПВЗ/до двери, подсказки города СДЭК, автоподстановка кода/адреса ПВЗ, fallback ручного ввода).
- Checkout: **доставка/оплата matrix** через публичный `site-settings.checkout`, поддержка `fulfillmentStatus` в ответе заказа.
- Checkout: онлайн-оплата **Ozon Pay** доведена до строгого сценария — без `payLink` заказ не считается успешно инициированным.
- Админка: тестовые страницы и инструменты для интеграций (в т.ч. **проверка Ozon Pay createOrder**).
- Витрина: в блоке карты поддержан `iframe` и вставка Яндекс-конструктора через `<script>`.

### Изменено

- Контакты и карта на главной связаны с `SiteSettings` (единая точка управления в «Контакты на витрине» + overlay mapForm).
- СДЭК: добавлен флаг `cdek_manual_pvz_enabled` (вкл/выкл ручного ввода ПВЗ с серверной и клиентской валидацией).
- UX checkout: адрес для СДЭК допускает ручной ввод даже при недоступных подсказках; диагностические сообщения уточнены.
- Версии выровнены: `VERSION` = **2.0.2a**, `frontend/package.json` = **2.0.2-a**.

### Документация

- Добавлены планы: поэтапный переход на React Admin и чеклист install-пакета/деплоя на Beget.

## [2.0.1a] — 2026-04-02

### Добавлено

- Файл **`VERSION`** в корне репозитория; модуль **`backend/config/version.py`**; в шапке **django-unfold** справа отображается номер версии (цвет бейджа: dev/prod по `DJANGO_DEBUG`).
- **Защита форм и лидов:** поле-приманка `website` (пустое у легитимного клиента), **rate limit** по IP на `POST /api/leads/calculator/`, `callback/`, `cart/` (40/час); отдельный лимит на **`POST /api/auth/register/`** (20/час).
- **Валидация контактов на API:** нормализация телефона РФ (`+7` + 10 цифр), проверка имени и длины комментария, email в заказе; опциональный телефон в профиле/адресе.
- **Фронт:** общий модуль `frontend/src/lib/formValidation.ts` — маска `+7 (___) ___-__-__`, проверки имени/email/комментария; формы checkout, калькулятор, обратный звонок, карта/контакты, регистрация, профиль, адреса; у заявки с карты передаётся `leadSource: other`.
- **`LocMemCache`** в настройках Django для работы throttling.

### Изменено

- Бейдж окружения Unfold («Разработка» / «Продакшен») заменён на отображение **версии** из `VERSION` (см. `unfold_environment_callback` в `config/settings.py`).
- Версия **`frontend/package.json`** выровнена с релизной линией в формате semver: `2.0.1-a` (соответствует метке **2.0.1a** в `VERSION`).

### Технические улучшения (ранее в той же ветке разработки)

- **Code splitting:** ленивая загрузка маршрутов (`React.lazy` + `Suspense` в `App.tsx`).
- **SEO:** динамический **`GET /sitemap.xml`** на бэкенде (`api/views_seo.py`), тесты в `tests/test_seo_and_images.py`.
- **Изображения:** варианты/оптимизация для витрины (`optimizedImage`, компонент `OptimizedImage`), связанные тесты.

### Документация

- Обновлены **`docs/next-steps.md`**, **`docs/development-phases.md`**, **`docs/project-context.md`**, **`BACKLOG.md`**, **`docs/technical-debt.md`** (часть пунктов техдолга закрыта или уточнена).

---

## [0.1.0] и ранее — без тегов в репозитории

Начальная история коммитов на **GitHub** (`main`): каркас Vite + React + Django + DRF, каталог, корзина, заявки, админка Unfold, docker-compose. Детальный статус по этапам ТЗ — **[docs/development-phases.md](docs/development-phases.md)**.
