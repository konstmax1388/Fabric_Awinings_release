import { TEASER_LABELS, type ProductTeaser } from '../../data/products'

const TEASER_CLASS: Record<ProductTeaser, string> = {
  recommended: 'bg-sky-100/95 text-sky-900 ring-1 ring-sky-200/90',
  bestseller: 'bg-orange-100/95 text-orange-900 ring-1 ring-accent/35',
  new: 'bg-emerald-100/95 text-emerald-900 ring-1 ring-emerald-200/90',
}

type Props = {
  teasers: ProductTeaser[]
  className?: string
  size?: 'sm' | 'md'
}

export function ProductTeaserBadges({ teasers, className = '', size = 'sm' }: Props) {
  if (!teasers.length) return null
  const text = size === 'sm' ? 'text-[10px] font-semibold uppercase tracking-wide' : 'text-xs font-semibold'
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {teasers.map((t) => (
        <span
          key={t}
          className={`inline-flex rounded-md px-2 py-0.5 font-body backdrop-blur-sm ${text} ${TEASER_CLASS[t]}`}
        >
          {TEASER_LABELS[t]}
        </span>
      ))}
    </div>
  )
}
