/**
 * Набор иконок одинакового размера (PNG 128×128 в `frontend/public/icons/`, см. scripts/build_site_icons.py).
 * В разметке задавайте единый класс, например: className="h-14 w-14 object-contain" (56px) или h-16 w-16.
 */
export const SITE_ICONS = {
  contract: '/icons/site-icon-contract.png',
  factory: '/icons/site-icon-factory.png',
  fabric: '/icons/site-icon-fabric.png',
  measure: '/icons/site-icon-measure.png',
  warranty: '/icons/site-icon-warranty.png',
  price: '/icons/site-icon-price.png',
  service: '/icons/site-icon-service.png',
  time: '/icons/site-icon-time.png',
} as const

export type SiteIconKey = keyof typeof SITE_ICONS
