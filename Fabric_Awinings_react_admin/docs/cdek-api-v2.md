# СДЭК API v2: конспект для интеграции

Официальный портал: [Портал документации СДЭК API](https://apidoc.cdek.ru/#tag/common/Vvedenie) (разделы по тегам: общее описание, калькулятор, заказы, ПВЗ, вебхуки и т.д.).

**Секреты:** идентификатор договора (Account) и секрет (Secure password) выдаются для **интеграции**; хранить только в `.env`, не в Git и не в переписке.

---

## Два контура

| Контур | Базовый URL API |
|--------|------------------|
| **Тестовый (учебный)** | `https://api.edu.cdek.ru` |
| **Боевой** | `https://api.cdek.ru` |

Оба используют одну схему **v2** (пути вида `/v2/...`). Переключение — только смена базового URL и пары **Account / Secure** для соответствующего контура.

---

## Авторизация (OAuth 2.0, client credentials)

1. **POST** `{BASE}/v2/oauth/token`  
   - Заголовок: `Content-Type: application/x-www-form-urlencoded`  
   - Тело (form):  
     - `grant_type=client_credentials`  
     - `client_id=<Account>`  
     - `client_secret=<Secure password>`  

2. В ответе приходят **`access_token`**, **`token_type`** (обычно `bearer`), **`expires_in`** (секунды жизни токена).

3. Все последующие запросы к API:  
   - `Authorization: Bearer <access_token>`  
   - Для JSON-методов: `Content-Type: application/json`  

Токен нужно **кэшировать** до истечения срока и обновлять повторным запросом к `/v2/oauth/token`. Не путать **логин/пароль входа в ЛК** с парой **Account / Secure** для API (в документации и на форумах СДЭК это отдельно подчёркивается).

---

## Типовые группы методов (по ТЗ и порталу)

Детали тел запросов — только в актуальной спецификации на [apidoc.cdek.ru](https://apidoc.cdek.ru/).

- **Калькулятор** — расчёт тарифов / стоимости доставки (`/v2/calculator/...`).
- **ПВЗ (офисы)** — список пунктов выдачи, фильтры по городу и т.д. (`/v2/deliverypoints` и связанные).
- **Заказы** — создание, изменение, удаление, информация по заказу (`/v2/orders` и т.п.).
- **Вебхуки** — подписка на уведомления о статусах (если включено в вашем договоре).

Для сайта по ТЗ обычно нужны: расчёт в корзине/checkout, выбор ПВЗ (часто вместе с картой), создание заказа в СДЭК после оплаты/подтверждения, отображение трека.

---

## Переменные окружения (черновик для Django)

```env
# true = тестовый контур api.edu.cdek.ru
CDEK_TEST_MODE=true
CDEK_ACCOUNT=
CDEK_SECURE=
```

Боевой контур: `CDEK_TEST_MODE=false`, те же имена — значения из боевого договора.

---

## Виджет ПВЗ v3 (checkout)

Для [виджета cdek-it/widget 3.x](https://github.com/cdek-it/widget/wiki/%D0%A3%D1%81%D1%82%D0%B0%D0%BD%D0%BE%D0%B2%D0%BA%D0%B0-3.0) на фронте нужны: URL скрипта (по умолчанию `@cdek-it/widget@3` с jsDelivr), **ключ JavaScript API Яндекс.Карт** и публичный **servicePath** — у нас это `GET/POST /api/cdek-widget/service/` (абсолютный URL отдаётся в `GET /api/site-settings/` → `checkout.cdek.widgetServiceUrl`). Прокси подставляет OAuth к API СДЭК и вызывает `deliverypoints` / `calculator/tarifflist`, как `dist/service.php` в репозитории виджета. Вес посылки по умолчанию для расчёта: переменная окружения `CDEK_WIDGET_DEFAULT_WEIGHT_G` (граммы, по умолчанию 3000).

## Ссылки

- [apidoc.cdek.ru](https://apidoc.cdek.ru/) — актуальные пути и схемы тел.  
- Интеграция на сайте СДЭК: [cdek.ru/ru/integration](https://www.cdek.ru/ru/integration) и [cdek.ru/ru/integration/api](https://www.cdek.ru/ru/integration/api).
