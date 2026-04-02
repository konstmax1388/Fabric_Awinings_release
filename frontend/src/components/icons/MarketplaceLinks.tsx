import { MARKETPLACES } from '../../config/site'

const linkClass =
  'flex h-8 w-8 items-center justify-center rounded-lg text-[0.65rem] font-semibold text-text-muted transition-colors hover:text-accent md:h-8 md:w-8'

export function MarketplaceLinks({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {MARKETPLACES.map((m) => (
        <a
          key={m.id}
          href={m.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          title={m.label}
          aria-label={m.label}
        >
          {m.id === 'wb' && 'WB'}
          {m.id === 'ozon' && 'OZ'}
          {m.id === 'ym' && 'ЯМ'}
          {m.id === 'avito' && 'Ав'}
        </a>
      ))}
    </div>
  )
}
