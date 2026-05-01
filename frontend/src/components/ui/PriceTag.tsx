/** Две цены: зачёркнутая «в каталоге» и акцентная итоговая (для витрины и корзины). */

function formatRub(n: number): string {
  return Math.max(0, Math.round(n)).toLocaleString('ru-RU')
}

type Size = 'sm' | 'md' | 'lg'

const sizeClasses: Record<
  Size,
  { old: string; newBase: string; wrap: string }
> = {
  sm: {
    old: 'font-body text-xs text-text-muted line-through decoration-text-muted/70 sm:text-sm',
    newBase: 'font-heading text-base font-semibold tabular-nums sm:text-lg',
    wrap: 'flex flex-wrap items-baseline gap-x-2 gap-y-0.5',
  },
  md: {
    old: 'font-body text-sm text-text-muted line-through decoration-text-muted/70 sm:text-base',
    newBase: 'font-heading text-xl font-semibold tabular-nums sm:text-2xl',
    wrap: 'flex flex-wrap items-baseline gap-x-2.5 gap-y-1',
  },
  lg: {
    old: 'font-body text-sm text-text-muted line-through decoration-text-muted/70 sm:text-base',
    newBase: 'font-heading text-2xl font-bold tabular-nums sm:text-3xl md:text-4xl',
    wrap: 'flex flex-wrap items-baseline gap-x-3 gap-y-1',
  },
}

type Props = {
  priceFrom: number
  /** База до акции; если не задано или равно priceFrom — одна цена. */
  priceList?: number
  prefix?: string
  size?: Size
  /** Выровнять ряд цен по правому краю (строка корзины). */
  alignEnd?: boolean
  className?: string
}

export function PriceTag({
  priceFrom,
  priceList,
  prefix,
  size = 'md',
  alignEnd = false,
  className = '',
}: Props) {
  const from = Math.max(0, Math.round(priceFrom))
  const list = priceList != null && Number.isFinite(priceList) ? Math.max(0, Math.round(priceList)) : from
  const showSale = list > from
  const s = sizeClasses[size]
  const newColor =
    size === 'lg' || showSale ? 'text-accent' : 'text-text'

  return (
    <div className={`min-w-0 ${className}`.trim()}>
      {prefix ? (
        <span className="mb-1 block font-body text-xs font-medium text-text-muted sm:text-sm">{prefix}</span>
      ) : null}
      <span
        className={`${s.wrap}${alignEnd ? ' justify-end' : ''}`.trim()}
        aria-label={showSale ? `Цена ${formatRub(from)} рублей, в каталоге ${formatRub(list)}` : `Цена ${formatRub(from)} рублей`}
      >
        {showSale ? <span className={s.old}>{formatRub(list)} ₽</span> : null}
        <span className={`${s.newBase} ${newColor}`}>{formatRub(from)} ₽</span>
      </span>
    </div>
  )
}
