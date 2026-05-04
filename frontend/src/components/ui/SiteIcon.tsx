import { SITE_ICONS, type SiteIconKey } from '../../config/siteIcons'

type Props = {
  name: SiteIconKey
  alt: string
  /** Единый визуальный размер в вёрстке (сами файлы 128×128, масштаб через CSS). */
  className?: string
}

/**
 * Иконки из `/icons/site-icon-*.png` — одинаковый исходный квадрат; размер задаётся классами.
 * Пример: `className="h-14 w-14 shrink-0 object-contain"`
 */
export function SiteIcon({ name, alt, className = 'h-16 w-16 shrink-0 object-contain' }: Props) {
  return <img src={SITE_ICONS[name]} alt={alt} className={className} decoding="async" loading="lazy" />
}
