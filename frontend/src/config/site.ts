/** Запасные строки, если /api/site-settings/ ещё не подгрузился (без вымышленных телефонов и реквизитов). */
export const SITE = {
  name: 'Фабрика Тентов',
  tagline: 'Тенты на заказ для бизнеса и частных клиентов',
  phone: '',
  phoneHref: '',
  email: '',
  address: '',
  legal: '',
  /** Подзаголовок /catalog, если в API пусто */
  catalogIntro:
    'Тенты, навесы и шатры для транспорта, складов, общепита и мероприятий.',
} as const

/** Логотипы в `public/marketplaces/`; микро-иконки для шапки — `public/marketplaces/icons/` (см. icons/SPECS.txt). */
export const MARKETPLACES = [
  {
    id: 'wb',
    label: 'Wildberries',
    href: 'https://www.wildberries.ru/',
    logoSrc: '/marketplaces/wildberries.svg',
    iconSrc: '/marketplaces/icons/wildberries-sign-logo.svg',
  },
  {
    id: 'ozon',
    label: 'OZON',
    href: 'https://www.ozon.ru/',
    logoSrc: '/marketplaces/ozon.webp',
    iconSrc: '/marketplaces/icons/ozon-icon-logo.svg',
  },
  {
    id: 'ym',
    label: 'Яндекс Маркет',
    href: 'https://market.yandex.ru/',
    logoSrc: '/marketplaces/yandex-market-sign-logo.svg',
    iconSrc: '/marketplaces/icons/yandex-market-sign-logo.svg',
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
