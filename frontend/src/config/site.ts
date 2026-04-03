/** Плейсхолдеры до подключения CMS / админки */
export const SITE = {
  name: 'Фабрика Тентов',
  tagline: 'Тенты на заказ для бизнеса и частных клиентов',
  phone: '+7 (800) 000-00-00',
  phoneHref: 'tel:+78000000000',
  email: 'hello@fabric-awnings.example',
  address: 'г. Москва, производственная зона (адрес уточняется)',
  legal: 'ООО «Фабрика Тентов», ИНН 0000000000',
} as const

/** Логотипы в `public/marketplaces/` (SVG с Commons; Ozon — свой WebP). */
export const MARKETPLACES = [
  {
    id: 'wb',
    label: 'Wildberries',
    href: 'https://www.wildberries.ru/',
    logoSrc: '/marketplaces/wildberries.svg',
  },
  {
    id: 'ozon',
    label: 'OZON',
    href: 'https://www.ozon.ru/',
    logoSrc: '/marketplaces/ozon.webp',
  },
  {
    id: 'ym',
    label: 'Яндекс Маркет',
    href: 'https://market.yandex.ru/',
    logoSrc: '/marketplaces/yandex-market.svg',
  },
  {
    id: 'avito',
    label: 'Авито',
    href: 'https://www.avito.ru/',
    logoSrc: '/marketplaces/avito.svg',
  },
] as const

export type MarketplaceId = (typeof MARKETPLACES)[number]['id']

/** Глобальные URL витрин (подмена из админки / env); пустой объект — как в MARKETPLACES */
export const GLOBAL_MARKETPLACE_URLS: Partial<Record<MarketplaceId, string>> = {}
