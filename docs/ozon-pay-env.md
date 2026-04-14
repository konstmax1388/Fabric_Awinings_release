# Ozon Acquiring API (Ozon Pay Checkout)

Официальная документация: [docs.ozon.ru/api/acquiring](https://docs.ozon.ru/api/acquiring/).

Интеграция на сайте использует **подпись запросов** (SHA-256 hex), а не OAuth. В админке:

- **accessKey** — поле «Ozon Pay: accessKey (идентификатор токена)»;
- **secretKey** — секрет токена (подпись `createOrder`);
- **notificationSecretKey** — секрет для проверки входящих POST-уведомлений.

Переменные окружения (приоритет над полями админки, где указано):

| Переменная | Назначение |
|------------|------------|
| `OZON_PAY_API_BASE_URL` | **Обязательно** для оплаты: базовый URL API (без `/`), к нему добавляется `/v1/createOrder`. |
| `OZON_PAY_ACCESS_KEY` | Идентификатор токена (accessKey). |
| `OZON_PAY_SECRET_KEY` или `OZON_PAY_CLIENT_SECRET` | Секрет токена для подписи тел запросов. |
| `OZON_PAY_WEBHOOK_SECRET` | Секрет уведомлений (notificationSecretKey) для проверки `requestSign` на `POST /api/webhooks/ozon-pay/`. |

Опционально:

| Переменная | По умолчанию |
|------------|----------------|
| `OZON_PAY_CURRENCY_CODE` | `643` |
| `OZON_PAY_PAYMENT_ALGORITHM` | `PAY_ALGO_SMS` (одностадийный) |
| `OZON_PAY_FISCALIZATION_TYPE` | `FISCAL_TYPE_SINGLE` |
| `OZON_PAY_ORDER_MODE` | `MODE_SHORTENED` |
| `OZON_PAY_ORDER_EXPIRES_HOURS` | `24` |
| `OZON_PAY_NOTIFICATION_URL` | Если пусто: `{PUBLIC_SITE_URL}/api/webhooks/ozon-pay/` |
| `OZON_PAY_ENABLE_FISCALIZATION` | `true` / `false` — поле `enableFiscalization` в createOrder |
| `OZON_PAY_ITEM_VAT` | По умолчанию `VAT_20` (enum из доки acquiring). |
| `OZON_PAY_ITEM_TYPE` | По умолчанию `TYPE_PRODUCT`. |

## Доставка Ozon Логистика (сайт)

Если в заказе выбран способ доставки **«Логистика Ozon»**, `createOrder` уходит с **`mode: MODE_FULL`**, **`deliverySettings: { isEnabled: true }`** и массивом **`items`** (название, цена за единицу в копейках, количество, `extId`, при наличии **`sku`**).

SKU берётся из поля **`ozonSku`** в строке корзины (с фронта), иначе из админки: **Ozon SKU** у варианта или у товара.

## Подпись `POST /v1/createOrder`

Реализовано в `api/services/ozon_acquiring_sign.py`: конкатенация полей без разделителей, затем SHA-256 hex (как в доке).

## Подпись уведомлений

Проверка `requestSign` для сценария «попытка оплаты по заказу» и для самостоятельной оплаты — см. код `verify_notification_request_sign`.

## URL в кабинете Ozon (токен эквайринга)

При регистрации токена Ozon просит **страницы успешной и неуспешной оплаты** (редирект пользователя после оплаты) и **URL для HTTP POST-уведомлений** о транзакциях. Ниже — что реально отправляет бэкенд в `POST …/v1/createOrder` и что указывать в ЛК, чтобы совпадало с интеграцией.

### Базовый URL витрины

Редиректы после оплаты и URL вебхука по умолчанию строятся от **`PUBLIC_SITE_URL`** в Django (`backend/config/settings.py`). Задаётся через окружение:

- **`DJANGO_PUBLIC_SITE_URL`** — канонический URL сайта **без** завершающего слэша, например `https://example.com`.

Локальная разработка по умолчанию: `http://localhost:17300`.

### Страницы успеха и неуспеха (successUrl / failUrl)

Формируются в `api/services/ozon_acquiring.py` (`_checkout_return_urls`), в теле `createOrder` как **`successUrl`** и **`failUrl`**:

| Назначение | Шаблон |
|------------|--------|
| Успешная оплата | `{PUBLIC_SITE_URL}/checkout?pay=ok&orderRef=<order_ref>` |
| Отмена / неуспех | `{PUBLIC_SITE_URL}/checkout?pay=cancel&orderRef=<order_ref>` |

`<order_ref>` — внутренний номер заказа; в URL передаётся **в закодированном виде** (`urllib.parse.quote`).

В кабинете Ozon укажите **тот же путь и query-параметры**, что использует API: минимально достаточно совпадения **схемы, хоста и пути** `/checkout` с параметрами `pay=ok` / `pay=cancel` (при необходимости — пример с тестовым `orderRef`).

Фронт: маршрут оформления — `/checkout` (страница `CheckoutPage`).

### URL POST-уведомлений (notificationUrl)

Обработчик на стороне проекта: **`POST /api/webhooks/ozon-pay/`** (`api/views_checkout.py`, `OzonPayWebhookView`).

Полный URL по умолчанию:

- **`{PUBLIC_SITE_URL}/api/webhooks/ozon-pay/`**

Если API доступен **с другого хоста**, чем витрина (отдельный домен бэкенда), задайте в `.env` **`OZON_PAY_NOTIFICATION_URL`** — полный URL вебхука на том хосте, который публично принимает HTTPS-запросы от Ozon. Тогда это значение попадает в **`notificationUrl`** в `createOrder` (см. `_notification_url()` в `ozon_acquiring.py`).

По документации Ozon: если в заказе указан свой **`notificationUrl`**, уведомления уходят на него; наш бэкенд передаёт его при каждом `createOrder`.

**Секрет для подписи уведомлений:** поле в админке «Ozon Pay: notificationSecretKey» или **`OZON_PAY_WEBHOOK_SECRET`** — тот же секрет, что задаётся для токена в кабинете (проверка `requestSign` в вебхуке).

### Поле `paymentMethod` в JSON уведомления

В теле POST от Ozon может быть поле **`paymentMethod`** — способ оплаты. Типовые значения из документации эквайринга:

- **`PAY_TYPE_BANK_CARD`** — банковская карта  
- **`PAY_TYPE_SBP`** — СБП  
- **`PAY_TYPE_OZON_CARD`** — Ozon Карта  

В проекте последнее уведомление по заказу дополняет `CartOrder.acquiring_payload`: в **`ozonWebhookLast`** сохраняются в том числе `status`, `operationType`, **`paymentMethod`** (см. обработчик вебхука в `views_checkout.py`).

### Краткий чек-лист перед продакшеном

1. В `.env` выставить **`DJANGO_PUBLIC_SITE_URL=https://ваш-домен`** (боевой HTTPS).  
2. В кабинете Ozon для токена указать success / fail / webhook URL в соответствии с таблицами выше.  
3. Если вебхук слушает не витрина, а API-домен — задать **`OZON_PAY_NOTIFICATION_URL`** и открыть этот URL наружу (HTTPS).  
4. Убедиться, что **`OZON_PAY_WEBHOOK_SECRET`** (или поле в админке) совпадает с **notificationSecretKey** токена.
