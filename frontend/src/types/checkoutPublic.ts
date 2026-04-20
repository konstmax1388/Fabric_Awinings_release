/** Публичная конфигурация оформления заказа (GET /api/site-settings/ → checkout). */

export type CheckoutDeliveryOption = { id: string; label: string }

export type CheckoutPublicConfig = {
  /** Минимальная сумма товаров (без доставки), 0 — нет ограничения */
  minimumOrderRub: number
  /** От какой суммы товаров доставка СДЭК бесплатна, 0 — не применять */
  freeDeliveryFromRub: number
  deliveryOptions: CheckoutDeliveryOption[]
  paymentMatrix: Record<string, string[]>
  paymentLabels: Record<string, string>
  pickup: {
    title: string
    address: string
    hours: string
    note: string
    lat: number | null
    lng: number | null
  }
  cdek: {
    enabled: boolean
    testMode: boolean
    apiBaseUrl: string
    widgetScriptUrl: string
    yandexMapApiKey: string
    widgetServiceUrl: string
    widgetSenderCity: string
    manualPvzEnabled: boolean
    /** widget — карта и виджет cdek-it; custom — список ПВЗ по API без Яндекса */
    checkoutUi: 'widget' | 'custom'
    /** Ограничение тарифов виджета (пустой объект — все тарифы) */
    tariffs: { office?: number[]; door?: number[]; pickup?: number[] }
    defaultPackage: { width: number; height: number; length: number; weight: number }
    widgetGoods: { width: number; height: number; length: number; weight: number }[]
  }
  ozonLogistics: {
    enabled: boolean
    buyerNote: string
  }
  ozonPay: {
    enabled: boolean
    sandbox: boolean
  }
}

/** Подписи по умолчанию, если в deliveryOptions не пришла строка (устаревший кэш и т.п.). */
export const CHECKOUT_DELIVERY_FALLBACK_LABELS: Record<string, string> = {
  pickup: 'Самовывоз со склада',
  cdek: 'СДЭК (ПВЗ / курьер)',
  ozon_logistics: 'Логистика Ozon',
}

export const DEFAULT_CHECKOUT_PUBLIC: CheckoutPublicConfig = {
  minimumOrderRub: 0,
  freeDeliveryFromRub: 0,
  deliveryOptions: [{ id: 'pickup', label: 'Самовывоз со склада' }],
  paymentMatrix: {
    pickup: ['cash_pickup'],
    cdek: ['cod_cdek'],
    ozon_logistics: ['card_online'],
  },
  paymentLabels: {
    cash_pickup: 'Наличные при самовывозе',
    cod_cdek: 'Наложенный платёж (СДЭК)',
    card_online: 'Банковская карта (онлайн)',
  },
  pickup: {
    title: 'Склад',
    address: '',
    hours: '',
    note: '',
    lat: null,
    lng: null,
  },
  cdek: {
    enabled: false,
    testMode: true,
    apiBaseUrl: 'https://api.edu.cdek.ru',
    widgetScriptUrl: 'https://cdn.jsdelivr.net/npm/@cdek-it/widget@3',
    yandexMapApiKey: '',
    widgetServiceUrl: '',
    widgetSenderCity: 'Москва',
    manualPvzEnabled: true,
    checkoutUi: 'widget',
    tariffs: {},
    defaultPackage: { width: 20, height: 20, length: 30, weight: 3000 },
    widgetGoods: [{ width: 20, height: 20, length: 30, weight: 3000 }],
  },
  ozonLogistics: {
    enabled: false,
    buyerNote: '',
  },
  ozonPay: {
    enabled: false,
    sandbox: true,
  },
}
