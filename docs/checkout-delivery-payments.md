# Оформление заказа: доставка, оплата, интеграции

Настройки задаются в **Django Admin → Настройки сайта** (разделы самовывоза, СДЭК, логистики Ozon, Ozon Pay). Секреты можно дублировать через переменные окружения (см. `.env.example`).

## «Заглушки», флаги и реальные вызовы

Раньше под «заглушкой» имелось в виду: в коде **не** выполнялись HTTP-запросы к Ozon/CDEK, пока не готовы ключи и спецификация; вместо этого в ответе были тексты-заглушки.

Сейчас:

- **СДЭК** — реальный OAuth (`POST …/v2/oauth/token`) и кэш токена; проверка: `python manage.py cdek_check_auth`.
- **Ozon Pay** — `POST {OZON_PAY_API_BASE_URL}/v1/createOrder` с подписью `requestSign` (SHA-256 по правилам Ozon), ответ `order.payLink` → редирект покупателя. Нужны `OZON_PAY_API_BASE_URL`, accessKey и secretKey; см. [ozon-pay-env.md](./ozon-pay-env.md).

## Матрица «доставка → способы оплаты»

| Доставка | Оплата |
|----------|--------|
| Самовывоз (со склада) | Наличные при получении; при включённом Ozon Pay — ещё онлайн (карта). |
| СДЭК | Наложенный платёж; при включённом Ozon Pay — онлайн. |
| Логистика Ozon | Только онлайн-оплата (Ozon Pay), если включены и доставка, и эквайринг. |

Сервер валидирует пару `deliveryMethod` + `paymentMethod` при `POST /api/leads/cart/`. Витрина получает разрешённые комбинации в `GET /api/site-settings/` → поле **`checkout`** (`deliveryOptions`, `paymentMatrix`, подписи, данные самовывоза, флаги СДЭК/Ozon).

## СДЭК

- Документация API: [apidoc.cdek.ru](https://apidoc.cdek.ru/)
- Тестовый контур: `https://api.edu.cdek.ru`
- Рабочий: `https://api.cdek.ru`
- Переключатель «тест / бой» — в админке (**СДЭК: тестовый контур**). При необходимости базовый URL можно переопределить переменной **`CDEK_API_BASE_URL`**.
- Учётные данные OAuth: поля **Account** и **Secure** в админке или **`CDEK_ACCOUNT`** / **`CDEK_SECURE`** в окружении (env имеет приоритет).
- Виджет выбора ПВЗ: [widget.cdek.ru](https://widget.cdek.ru/), репозиторий и вики [cdek-it/widget](https://github.com/cdek-it/widget/wiki). URL скрипта виджета задаётся в админке; на фронте подключается компонентом `CdekWidgetMount` (инициализация виджета по документации — следующий шаг интеграции).

Подробнее про вызовы API v2 см. [cdek-api-v2.md](./cdek-api-v2.md).

## Ozon Pay Checkout (эквайринг)

- [Документация Ozon Acquiring](https://docs.ozon.ru/api/acquiring/): подписи запросов, `createOrder`, уведомления.
- В админке: accessKey, secretKey, notificationSecretKey; в `.env` — **`OZON_PAY_API_BASE_URL`**, при необходимости **`OZON_PAY_ACCESS_KEY`**, **`OZON_PAY_SECRET_KEY`**, **`OZON_PAY_WEBHOOK_SECRET`**.
- Вебхук: `POST /api/webhooks/ozon-pay/` — проверка `requestSign`, обновление `CartOrder` при `extOrderID` = `orderRef`.
- **URL для кабинета Ozon** (success / fail после оплаты, адрес POST-уведомлений, `paymentMethod`): см. раздел «URL в кабинете Ozon» в [ozon-pay-env.md](./ozon-pay-env.md).

## Логистика Ozon

На витрине показывается способ доставки и текст для покупателя из админки. Подключение кабинета и обмен данными с Ozon — по [материалам для продавцов](https://seller-edu.ozon.ru/libra/ozon-logistika/osobennosti-raboty) и [справке Ozon Bank](https://help-bank.ozon.ru/business/acquiring-online/delivery); отдельный серверный клиент под выбранный сценарий API предстоит добавить при согласовании процесса с Ozon.

## API заказа

Тело `POST /api/leads/cart/` (дополнительно к уже существующим полям):

- `deliveryMethod`: `pickup` | `cdek` | `ozon_logistics`
- `paymentMethod`: `cash_pickup` | `cod_cdek` | `card_online`
- `delivery`: объект с контактными полями доставки; для СДЭК допускаются поля в `delivery.cdek` (город, ПВЗ и т.д.) — см. `sanitize_checkout_delivery`.

Ответ при онлайн-оплате может содержать **`paymentRedirectUrl`** (из `acquiring_payload.redirectUrl`), когда эквайринг вернёт ссылку на оплату.
