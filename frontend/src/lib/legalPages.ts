import type { StaticPageDto } from './api'

/** Текст для ссылок на 152-ФЗ в формах и при заказе. */
export const PERSONAL_DATA_LAW_152_FZ =
  'Персональные данные обрабатываются в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».'

export const LEGAL_SLUGS = {
  privacy: 'politika-konfidentsialnosti-i-soglasie-na-obrabotku-personalnykh-dannykh',
  offer: 'publichnaia-oferta',
  consent: 'soglasie-na-obrabotku-personalnykh-dannykh',
  terms: 'polzovatelskoe-soglashenie',
  warranty: 'garantiia-na-produktsiiu',
  paymentDelivery: 'oplata-i-dostavka',
} as const

export function staticPagePathBySlug(
  pages: StaticPageDto[],
  slug: string,
  fallbackPath = '/',
): string {
  const hit = pages.find((p) => p.slug === slug)
  if (hit?.path) return hit.path
  return fallbackPath
}
