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

export const MARKETPLACES = [
  { id: 'wb', label: 'Wildberries', href: 'https://www.wildberries.ru/' },
  { id: 'ozon', label: 'OZON', href: 'https://www.ozon.ru/' },
  { id: 'ym', label: 'Яндекс Маркет', href: 'https://market.yandex.ru/' },
  { id: 'avito', label: 'Авито', href: 'https://www.avito.ru/' },
] as const
