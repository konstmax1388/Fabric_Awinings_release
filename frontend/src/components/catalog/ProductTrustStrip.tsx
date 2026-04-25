type Props = {
  warrantyMonths: number
  returnDays: number
  className?: string
}

/**
 * Гарантия и возврат (значения уже с учётом дефолтов каталога с бэкенда).
 */
export function ProductTrustStrip({ warrantyMonths, returnDays, className = '' }: Props) {
  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`.trim()}
      role="group"
      aria-label="Условия гарантии и возврата"
    >
      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2 text-left">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3l7 4v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V7l7-4z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-text-subtle">Гарантия</p>
          <p className="font-body text-sm font-medium text-text">
            {warrantyMonths} {pluralMonths(warrantyMonths)}
          </p>
        </div>
      </div>
      <div className="inline-flex items-center gap-2 rounded-xl border border-sky-500/25 bg-sky-500/8 px-3 py-2 text-left">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400"
          aria-hidden
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="font-body text-[11px] font-semibold uppercase tracking-wide text-text-subtle">Возврат</p>
          <p className="font-body text-sm font-medium text-text">{returnDays} дней</p>
        </div>
      </div>
    </div>
  )
}

function pluralMonths(n: number): string {
  const m = Math.abs(n) % 100
  const l = m % 10
  if (m > 10 && m < 20) return 'месяцев'
  if (l === 1) return 'месяц'
  if (l >= 2 && l <= 4) return 'месяца'
  return 'месяцев'
}
