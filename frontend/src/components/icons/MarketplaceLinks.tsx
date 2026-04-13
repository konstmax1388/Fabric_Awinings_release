import { motion, useReducedMotion } from 'framer-motion'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { MARKETPLACES, type MarketplaceId } from '../../config/site'

const linkClassDefault =
  'flex h-9 min-w-9 items-center justify-center rounded-lg px-1.5 ring-1 ring-border-light/80 bg-surface/80 md:h-9'

const imgClassById: Record<MarketplaceId, string> = {
  wb: 'h-5 w-auto max-w-[76px] object-contain object-center md:h-6 md:max-w-[84px]',
  ozon: 'h-6 w-auto max-w-[72px] object-contain md:h-7 md:max-w-[80px]',
  ym: 'h-4 w-auto max-w-[88px] object-contain md:h-5 md:max-w-[96px]',
  avito: 'h-5 w-auto max-w-[76px] object-contain md:h-6 md:max-w-[84px]',
}

/** Логотип без декоративной рамки (`iconSrc` в config) */
const imgClassCompact = 'h-8 w-8 object-contain'

function orderEntries(linkKeys: MarketplaceId[] | undefined) {
  if (!linkKeys?.length) return [...MARKETPLACES]
  return linkKeys
    .map((id) => MARKETPLACES.find((m) => m.id === id))
    .filter((m): m is (typeof MARKETPLACES)[number] => Boolean(m))
}

type Props = {
  className?: string
  /** Только иконки — для шапки */
  compact?: boolean
  /** URL витрины; если для id нет записи — берётся глобальный href из конфига */
  hrefById?: Partial<Record<MarketplaceId, string>>
  /** Только эти площадки и в таком порядке (для карточек каталога — ключи из данных товара) */
  linkKeys?: MarketplaceId[]
}

function resolveHref(
  m: (typeof MARKETPLACES)[number],
  hrefById: Partial<Record<MarketplaceId, string>> | undefined,
  globalMarketplaceUrls: Partial<Record<MarketplaceId, string>>,
): string {
  const fromProduct = hrefById?.[m.id] && hrefById[m.id]!.length > 0 ? hrefById[m.id]! : ''
  const fromGlobal =
    globalMarketplaceUrls[m.id] && globalMarketplaceUrls[m.id]!.length > 0
      ? globalMarketplaceUrls[m.id]!
      : ''
  return (fromProduct || fromGlobal || m.href) as string
}

export function MarketplaceLinks({ className = '', compact = false, hrefById, linkKeys }: Props) {
  const reduce = useReducedMotion()
  const { enabledMarketplaces, globalMarketplaceUrls } = useSiteSettings()
  const enabledSet = new Set(enabledMarketplaces)
  const entries = orderEntries(linkKeys).filter((m) => enabledSet.has(m.id))

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {entries.map((m) => {
          const href = resolveHref(m, hrefById, globalMarketplaceUrls)
          return (
            <motion.a
              key={m.id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center rounded-md p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
              title={`${m.label} — откроется в новой вкладке`}
              aria-label={`${m.label}, внешняя ссылка`}
              whileHover={reduce ? undefined : { scale: 1.06 }}
              whileTap={reduce ? undefined : { scale: 0.96 }}
              whileFocus={reduce ? undefined : { scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 520, damping: 28, mass: 0.6 }}
            >
              <img
                src={'iconSrc' in m && m.iconSrc ? m.iconSrc : m.logoSrc}
                alt=""
                width={32}
                height={32}
                className={imgClassCompact}
                loading="lazy"
                decoding="async"
              />
            </motion.a>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {entries.map((m) => {
        const href = resolveHref(m, hrefById, globalMarketplaceUrls)
        return (
          <motion.a
            key={m.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassDefault}
            title={m.label}
            aria-label={m.label}
            whileHover={reduce ? undefined : { scale: 1.05 }}
            whileTap={reduce ? undefined : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <img
              src={m.logoSrc}
              alt=""
              width={120}
              height={32}
              className={imgClassById[m.id]}
              loading="lazy"
              decoding="async"
            />
          </motion.a>
        )
      })}
    </div>
  )
}
