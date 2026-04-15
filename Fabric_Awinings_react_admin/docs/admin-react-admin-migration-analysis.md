# Спецификация: панель управления на React Admin + Staff API (DRF)

| Поле | Значение |
|------|----------|
| **Версия документа** | 1.0 |
| **Статус** | Нормативная спецификация для разработки и приёмки |
| **Область** | Замена UI **Django Admin + django-unfold** на отдельное SPA (**React Admin 4.x + MUI**) с бэкендом **`/api/staff/v1/`**; публичная витрина и модели БД **не меняются** без отдельного решения |

**Связанные документы:** [functional-requirements.md](./functional-requirements.md), [tz-2-0-alignment.md](./tz-2-0-alignment.md), [development-phases.md](./development-phases.md), [design.md](./design.md), [fabric-unfold-admin.mdc](../.cursor/rules/fabric-unfold-admin.mdc).

**Термины:** *Staff* — пользователь с `is_staff=True`. *Публичный API* — существующие маршруты под `/api/` для витрины и лидов. *Staff API* — только под `/api/staff/v1/`, только для аутентифицированного staff.

---

## 1. Цели и границы

### 1.1. Цели

1. Дать персоналу интерфейс уровня «продукт»: дашборды, графики, адаптив под планшеты, сложные формы без полной перезагрузки страницы.
2. Соответствовать ожиданиям **ТЗ 2.0** по стеку (React Admin) — см. [tz-2-0-alignment.md](./tz-2-0-alignment.md).
3. Сохранить бизнес-логику в **Python** (сервисы, валидации, импорты, интеграции); новый код UI — не источник правил предметной области.

### 1.2. Вне охвата (явно не делается в рамках этой спецификации без доп. ТЗ)

- Замена **публичного** фронта витрины.
- Миграция с **MySQL** на другую СУБД.
- Внедрение **Celery** (допускается подготовка контракта `202 + jobId`, реализация очереди — отдельный эпик).
- **OAuth2 / корпоративный SSO** для входа (закладывается только разделение staff/auth от покупателя).

### 1.3. Инварианты (нарушение недопустимо без пересмотра спецификации)

- Публичные URL витрины (`/api/products/`, лиды и т.д.) **не ослабляются** до уровня staff; staff-операции **только** под `/api/staff/v1/` с отдельной аутентификацией.
- Схема БД меняется **только** если требуется новое служебное поле (например `version` для optimistic locking); любая миграция согласуется и не ломает витрину.
- Секреты (SMTP, ключи CRM, вебхуки) **никогда** не отдаются в ответах API в открытом виде; только маска или признак «задано».

---

## 2. Исходное состояние (аудит кода)

Ниже — зафиксированный снимок; при изменении `admin.py` спецификацию обновляют.

| Компонент | Расположение |
|-----------|----------------|
| Админ-модели, инлайны, кастомные вьюхи | `backend/api/admin.py` |
| Меню Unfold | `backend/config/unfold_sidebar.py` |
| Данные дашборда | `backend/config/admin_dashboard.py` |
| Секции настроек сайта | `backend/config/sitesettings_nav.py` + секции в `admin.py` |
| Секции главной | `backend/config/homepage_nav.py` + `home_page_admin_form.py` |

**Сущности ModelAdmin:** `ProductCategory`, `Product` (+ инлайны изображений, вариантов, характеристик), `PortfolioProject`, `Review`, `BlogPost`, `CalculatorLead`, `CallbackLead`, `CartOrder`, `SiteSettings` (singleton, секции по slug), `HomePageContent` (singleton, секции), `SiteEmailTemplate`, `CustomerProfile`, `ShippingAddress`, `User`, `Group`.

**Нестандартные сценарии:** импорт Wildberries (`import_wb_view`), SMTP-тест, проверка вебхука Битрикс24, синхронизация каталога Б24 (долгий POST с параметрами), сохранение секций настроек/главной с валидацией `_validate_*`, форма товара с тизерами и `marketplace_links`.

**Вывод для разработки:** каждый из перечисленных сценариев должен иметь либо ресурс Staff API, либо **action**-эндпоинт с явным контрактом в OpenAPI и тестом.

---

## 3. Целевая архитектура (единственный утверждённый вариант)

### 3.1. Развёртывание

- Отдельное SPA (**новый пакет в репозитории**, например `staff-ui/`), сборка **Vite + React + TypeScript**, зависимости: **react-admin 4.x**, **MUI 5/6** (как требует выбранная версия RA).
- Выдача статики: в проде **Nginx** (или аналог) отдаёт `index.html` + ассеты по префиксу **`/staff/`** (без конфликта с витриной на `/`).
- Один origin для браузера, например `https://<домен>`: витрина на `/`, API на `/api/`, staff SPA на `/staff/`. Это упрощает **CSRF** и cookie.

### 3.2. Бэкенд

- Все staff-эндпоинты — префикс **`/api/staff/v1/`**. Версия **только в path**; следующая несовместимая версия — **`v2`**.
- Публичный префикс **`/api/`** без `staff` **не используется** для операций изменения данных админки.

### 3.3. Аутентификация staff (фиксированный выбор)

Использовать **отдельную пару JWT access/refresh** только для staff, на базе уже принятого в проекте **djangorestframework-simplejwt**:

- `POST /api/staff/v1/auth/token/` — тело `{ "username": "<email или username>", "password": "..." }`; успех: `access`, `refresh`; **отказ**, если пользователь не `is_active` или не `is_staff`.
- `POST /api/staff/v1/auth/token/refresh/` — обновление access.
- Публичный эндпоинт **`POST /api/auth/token/`** (покупатель) **не принимает** staff-операции и **не выдаёт** права на `/api/staff/v1/`.
- На всех ViewSet под `/api/staff/v1/` кроме `auth/token*` и `auth/token/refresh/`: **`IsAuthenticated`** + проверка **`request.user.is_staff`** (единый базовый permission-класс, например `IsStaffUser`).

**Заголовок:** `Authorization: Bearer <access>`.

**CORS:** в `settings` разрешить credentials и origin того хоста, с которого открыт `/staff/` (тот же домен — минимальная поверхность).

### 3.4. Судьба Django Admin

- После достижения **Definition of Done** последней фазы (раздел 10) Django Admin **отключают** для production (URL `/admin/` — 404 или редирект на `/staff/`), либо оставляют **только для суперпользователя и IP allowlist** на переходный квартал — решение фиксируется в релиз-нотах; в спецификации целевое состояние: **только React Admin**.

---

## 4. Контракт HTTP API (нормы)

### 4.1. Формат JSON

- Поля в JSON — **`camelCase`** в ответах и запросах для **нового** Staff API. На бэкенде: либо явные `Serializer` с `CamelCase` именами, либо **`djangorestframework-camel-case`** только для роутера staff (не ломать публичный API).
- Идентификатор сущности в RA — поле **`id`** (строка или число — **как в модели PK**; для единообразия с RA предпочтительно **строка** в JSON, если PK integer — сериализовать как строку в list/detail).

### 4.2. Пагинация списков

- Формат ответа списка:

```json
{
  "results": [ ... ],
  "count": 123,
  "next": "https://host/api/staff/v1/resource/?page=2&pageSize=25",
  "previous": null
}
```

- Query-параметры: **`page`** (1-based), **`pageSize`** (макс. 100, по умолчанию 25). Реализация: **DRF PageNumberPagination** с кастомными именами **`page_size` → pageSize** в ответе ссылок или единый кастомный пагинатор под этот JSON.

### 4.3. Ошибки

- Валидация: **400**, тело в стиле DRF `{"fieldName": ["сообщение"], "nonFieldErrors": [...]}` (ключи **camelCase**).
- Не аутентифицирован: **401**. Нет прав: **403**. Не найдено: **404**. Конфликт (версия): **409** с телом `{"code": "stale_object", "message": "..."}`.
- Долгая операция принята в фон: **202** + `{ "jobId": "uuid" }` (когда реализован job-слой).

### 4.4. OpenAPI

- Подключить **drf-spectacular**; схема Staff API — тег **`staff`**, путь включает `/api/staff/v1/`.
- Сборка схемы — артефакт CI; расхождение схемы и кода — блокер merge.

### 4.5. Throttle

- Отдельные лимиты для `/api/staff/v1/` (выше публичных лидов); не ниже **3000/hour на IP** для authed staff на чтение, на **`auth/token/`** — жёстче (например **30/hour/IP**).

---

## 5. Модель данных товара и вложений (фиксированная декомпозиция)

Не использовать один «тяжёлый» PATCH всего графа товара в v1.

| Ресурс | Методы | Примечание |
|--------|--------|------------|
| `GET/POST/PATCH/DELETE /api/staff/v1/product-categories/` | стандарт | Слаг, порядок, публикация |
| `GET/POST/PATCH/DELETE /api/staff/v1/products/` | стандарт | Поля товара + **read-only вложенные** `variants`, `images`, `specifications` в `GET` detail (опционально query `?embed=`) |
| `GET/PATCH/DELETE /api/staff/v1/product-variants/` | по `productId` + фильтр | FK на продукт; поле **`sortOrder`** |
| `GET/PATCH/DELETE /api/staff/v1/product-images/` | по `productId` | **`sortOrder`** |
| `GET/PATCH/DELETE /api/staff/v1/product-specifications/` | по `productId` | Группа/имя/значение |
| `POST /api/staff/v1/products/{id}/reorder-variants/` | тело `{ "orderedIds": ["id1", "id2"] }` | Идемпотентный порядок |
| `POST /api/staff/v1/products/{id}/reorder-images/` | аналогично | |

Логика сохранения тизеров и `marketplaceLinks` — в **сериализаторе записи продукта**, перенесённая из `ProductAdminForm` / `save_model` (Python), без дублирования в TypeScript.

**ТЗ 2.0 / overlay Б24:** когда каталог станет ведущим в Б24, Staff API продукта **сужается** до разрешённых полей (видимость, порядок, SEO); это оформляется отдельным полем в ответе `capabilities: { "fullEdit": false }` или отдельной версией `v2` — до этого момента **fullEdit: true** по умолчанию.

---

## 6. Singleton и секции

| Ресурс | Контракт |
|--------|----------|
| `GET /api/staff/v1/site-settings/current/` | Один объект настроек; секреты маскировать |
| `PATCH /api/staff/v1/site-settings/current/` | Частичное обновление **разрешённых** полей; смена секрета — отдельные поля `smtpPasswordNew`, `astrumCrmApiKeyNew` (write-only, пустое = не менять) |
| `GET/PATCH /api/staff/v1/site-settings/sections/{slug}/` | Только поля секции; на бэкенде вызов существующих валидаторов секции |
| `GET /api/staff/v1/home-content/current/` | Аналогично |
| `GET/PATCH /api/staff/v1/home-content/sections/{slug}/` | Вызов `apply_homepage_section_save` и форм секций |

Список допустимых `{slug}` — из **`SECTION_ORDER`** в `sitesettings_nav.py` и `homepage_nav.py` (единый источник в коде, дублировать в OpenAPI enum).

---

## 7. Операции (actions)

Все **POST**, только staff; тела JSON **camelCase**. Реализация — тонкий вызов существующих функций/сервисов.

| Путь | Назначение |
|------|------------|
| `POST .../actions/wb-import/` | `{ "urls": string[], "categoryId": n, "publish": bool, "dryRun": bool }` → `{ "results": [{ "url", "ok", "message", "productId?" }] }` |
| `POST .../actions/smtp-test/` | `{ "toEmail"?: string }` → `{ "ok": bool, "detail": string }` |
| `POST .../actions/bitrix24-webhook-test/` | `{}` → структурированный результат теста |
| `POST .../actions/bitrix24-catalog-sync/` | `{ "dryRun", "force", "skipVariants", "skipProducts", "noProducts", "noOffers", "timeoutSec" }` → синхронно `{ "summary": ... }` до внедрения Celery; после — **202** + `jobId` |

Заголовок **`Idempotency-Key`** поддерживать на `bitrix24-catalog-sync` и `wb-import` (сервер хранит ключ + hash тела 24 ч, повтор — тот же ответ).

---

## 8. Загрузка файлов

- **`POST /api/staff/v1/uploads/`** — `multipart/form-data`, поле `file`; ответ `{ "url": "/media/...", "relativePath": "..." }` для подстановки в последующий PATCH сущности.
- Лимит размера и MIME — whitelist изображений для витрины; ошибка **413** / **400**.

---

## 9. Метрики и дашборд

- `GET /api/staff/v1/metrics/overview?from=ISO8601&to=ISO8601` — read-only, агрегаты по заказам, заявкам калькулятора/колбэка, ошибкам CRM, счётчикам товаров (логика переносится из `admin_dashboard_callback`).
- Схема JSON фиксируется в OpenAPI и **не меняется** без bump минорной версии API или согласованного поля `schemaVersion` в корне ответа.

---

## 10. Остальные ресурсы Staff API (полный перечень v1)

Все под `/api/staff/v1/`, множественное число, **kebab-case** в path:

- `portfolio-projects`, `reviews`, `blog-posts`
- `leads/calculator`, `leads/callback` — по умолчанию **list + retrieve**, delete по политике (явно в OpenAPI)
- `orders` (CartOrder) — list, retrieve; PATCH только разрешённых статусных полей, если бизнес это допускает
- `email-templates`
- `customer-profiles`, `shipping-addresses` — минимум полей в list; PДн — только staff с правом
- `users`, `groups` — CRUD в рамках Django permissions; смена пароля пользователя — `POST .../users/{id}/set-password/`

Имена в JSON — camelCase; связь с FK — поля `productId`, `categoryId` и т.д.

---

## 11. React Admin: обязательные технические требования

1. **dataProvider** — свой, под формат `results/count/next/previous` и camelCase (или адаптер поверх `fetch`).
2. **authProvider** — хранение access в `memory` + refresh при 401; logout очищает токены.
3. Тема MUI — цвета из [design.md](./design.md) (#E87A00 акцент, фон #FEFBF5 и т.д.) — таблица соответствия токенов MUI зафиксировать в `staff-ui/README.md`.
4. Таблицы на ширине &lt; 900px: **простой** list (карточки или сокращённые колонки) — минимум один экран проверяется в чек-листе приёмки.
5. Дашборд — отдельный `Dashboard` component, графики **Recharts** (или MUI X Charts, выбрать одно на весь проект и не смешивать).

---

## 12. Тестирование и приёмка

### 12.1. Автотесты бэкенда

- Для каждого ViewSet/action — минимум: успешный сценарий staff, **401** без токена, **403** для не-staff.
- Для секций settings/home — тест валидирующей функции с невалидными данными (перенос из существующих `_validate_*`).
- Контракт пагинации — один parametrized тест.

### 12.2. Ручной чек-лист (блокер релиза)

- Полный проход по сценариям из текущего `admin.py` (создание товара с вариантами, импорт WB dry-run, SMTP test, синк Б24 dry-run, сохранение каждой секции настроек и главной).
- Сравнение результата в БД с тем, что делала Django Admin (выборочно по 3–5 сущностям).

### 12.3. Definition of Done по фазам

Каждая фаза ниже считается закрытой только при: зелёных тестах CI, обновлённой OpenAPI, записи в CHANGELOG.

---

## 13. Фазы внедрения (строгий порядок)

| № | Фаза | Содержание |
|---|------|------------|
| **0** | Каркас | Пакет `staff-ui`, Vite, RA+MUI, authProvider + login page, `dataProvider` заглушка, nginx dev proxy с `/staff/` и `/api/staff/v1/` |
| **1** | Auth + OpenAPI | JWT staff, базовые permissions, drf-spectacular, первый реальный ресурс **`leads/callback`** (list/detail), метрики **`metrics/overview`** + простой дашборд |
| **2** | Контент | `portfolio-projects`, `reviews`, `blog-posts`, `email-templates` + загрузки |
| **3** | Каталог | `product-categories`, `products`, варианты/картинки/спеки + reorder |
| **4** | Заказы и лиды | `orders`, `leads/calculator`, профили/адреса при необходимости |
| **5** | Настройки и главная | `site-settings`, `home-content` current + sections |
| **6** | Actions | wb-import, smtp-test, bitrix24-* |
| **7** | Пользователи | `users`, `groups` |
| **8** | Вывод Django Admin | Отключение/ограничение `/admin/`, финальный чек-лист, обучение |

Параллелить допускается только фазы **2 и 3** разными разработчиками после завершения **1**.

---

## 14. Риски и как им противостоять

| Риск | Мера |
|------|------|
| Утечка staff JWT в публичный JS витрины | Отдельный билд `staff-ui`, никогда не импортировать staff-код в `frontend/` |
| Долгий синк Б24 рвёт nginx | Таймауты proxy ≥ 300s на action **или** переход на 202+job (фаза 6+) |
| Расхождение прав RA и Django | Единый `IsStaffUser` + при необходимости `DjangoModelPermissions` на ViewSet |
| Два редактора правят одно | Поле **`version`** (integer) на конфликтных моделях или ETag в v1.1 — зафиксировать до фазы 5 |

---

## 15. Оценка трудозатрат на реализацию спецификации

Оценка дана для **одного** разработчика **full-time** (middle+/senior по Django и React), с уже знакомым репозиторием; **без** простоя на согласования с заказчиком и **без** внедрения Celery. Единица — **рабочий день** (~8 ч).

| Фаза (разд. 13) | Дни (оценка) |
|-----------------|--------------|
| 0 | 3–5 |
| 1 | 5–8 |
| 2 | 8–12 |
| 3 | 12–18 |
| 4 | 6–10 |
| 5 | 14–20 |
| 6 | 6–10 |
| 7 | 5–8 |
| 8 | 3–5 |
| Регрессия, правки по UAT, документация деплоя | 8–12 |
| **Итого** | **70–108** рабочих дней |

В **календарных неделях** при 5 днях в неделю: **примерно 14–22 недели** для одного разработчика. Два разработчика (бэкенд + фронт) с чётким разделением фаз **1–4** могут сократить календарь примерно до **9–14 недель**, если нет блокеров по интеграциям.

**Про автоматизацию (ИИ):** генерация шаблонов ViewSet/сериализаторов и заготовок RA ускоряет кодирование на **20–40%**, но не снимает интеграционные тесты, ручной чек-лист §12.2 и отладку долгих операций; итоговую оценку для планирования релиза безопасно брать **не ниже 70%** от верхней границы человеко-дней выше, если в команде нет выделенного QA.

---

## 16. Ответственность за актуализацию документа

При добавлении новой сущности в Django Admin или изменении бизнес-правил сохранения — **обновить** разделы 2, 5–7 и OpenAPI в том же merge request, иначе спецификация считается нарушенной.

---

*Конец спецификации v1.0.*
