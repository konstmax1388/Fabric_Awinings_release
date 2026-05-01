import type { HomePayload } from '../types/homePage'

/** Дефолты совпадают с `default_home_payload()` → `ui` на бэкенде (home_defaults). */
const DEF = {
  checkoutSettingsLoading: 'Подготавливаем способы доставки…',
  checkoutDeliveryIntro:
    'Выберите способ получения и оплату. Если подходящего варианта нет — свяжитесь с нами, мы поможем оформить заказ.',
  checkoutNoDeliveryBanner:
    'Сейчас оформление на сайте недоступно: не настроены способы получения заказа. Напишите или позвоните нам — подскажем, как заказать.',
  checkoutNoDeliveryInlineError:
    'Сейчас нельзя продолжить оформление: не настроены способы получения. Свяжитесь с нами.',
  checkoutOzonPartialWarning:
    'Доставку через Ozon для этого состава корзины выбрать нельзя. Выберите самовывоз, доставку курьером или в пункт выдачи, либо измените состав заказа.',
  checkoutCdekAfterSubmitWarning:
    'Заказ сохранён; автоматическая передача в службу доставки не удалась. Мы свяжемся с вами по контактам из заказа. Если нужно срочно — позвоните и назовите номер заказа.',
  checkoutOnlinePayLinkError:
    'Онлайн-оплата не запустилась. Обновите страницу или выберите другой способ оплаты. Нужна помощь — позвоните нам.',
  checkoutCdekMapMissingKeyHelp:
    'Карта выбора пункта выдачи временно недоступна. Попробуйте обновить страницу или позвоните нам — оформим заказ вместе с вами.',
  checkoutCdekMapMissingServiceHelp:
    'Не удалось подключить карту доставки. Обновите страницу или выберите способ без карты; можете позвонить — поможем оформить.',
  checkoutCdekMapInitFailedHelp:
    'Карта доставки не загрузилась. Обновите страницу или выберите доставку без карты; при необходимости позвоните нам.',
  checkoutCdekAddressSuggestFooter:
    'Подсказки по адресу сейчас недоступны — укажите адрес вручную или выберите пункт на карте выше.',
  oneClickConsentTail:
    'Мы проверяем контакты и ограничиваем число повторных заявок, чтобы защититься от спама.',
} as const

export type CheckoutClientLabelKey = keyof typeof DEF

export type CheckoutClientLabels = Record<CheckoutClientLabelKey, string>

export function checkoutClientLabels(ui: HomePayload['ui'] | undefined): CheckoutClientLabels {
  const out: Record<string, string> = { ...DEF }
  if (!ui) return out as CheckoutClientLabels
  for (const k of Object.keys(DEF) as CheckoutClientLabelKey[]) {
    const v = ui[k]
    if (typeof v === 'string' && v.trim()) out[k] = v.trim()
  }
  return out as CheckoutClientLabels
}
