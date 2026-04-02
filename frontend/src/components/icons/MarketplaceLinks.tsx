import { motion, useReducedMotion } from 'framer-motion'
import { MARKETPLACES } from '../../config/site'

const linkClass =
  'flex h-9 min-w-9 items-center justify-center rounded-lg px-1.5 ring-1 ring-border-light/80 bg-surface/80 md:h-9'

/** Горизонтальные логотипы: ограничиваем ширину, высота единая */
const imgClassById: Record<(typeof MARKETPLACES)[number]['id'], string> = {
  wb: 'h-5 w-auto max-w-[76px] object-contain object-center md:h-6 md:max-w-[84px]',
  ozon: 'h-6 w-auto max-w-[72px] object-contain md:h-7 md:max-w-[80px]',
  ym: 'h-4 w-auto max-w-[88px] object-contain md:h-5 md:max-w-[96px]',
  avito: 'h-5 w-auto max-w-[76px] object-contain md:h-6 md:max-w-[84px]',
}

export function MarketplaceLinks({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion()

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {MARKETPLACES.map((m) => (
        <motion.a
          key={m.id}
          href={m.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
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
      ))}
    </div>
  )
}
