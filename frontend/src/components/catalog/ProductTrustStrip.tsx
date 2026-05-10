import { OptimizedImage } from '../ui/OptimizedImage'

type Props = {
  warrantyMonths: number
  returnDays: number
  warrantyIconUrl?: string
  returnIconUrl?: string
  className?: string
}

/**
 * Гарантия и возврат (значения уже с учётом дефолтов каталога с бэкенда).
 */
export function ProductTrustStrip({
  warrantyMonths,
  returnDays,
  warrantyIconUrl,
  returnIconUrl,
  className = '',
}: Props) {
  const wUrl = (warrantyIconUrl || '').trim()
  const rUrl = (returnIconUrl || '').trim()
  return (
    <div
      className={`flex min-w-0 flex-nowrap gap-1.5 sm:gap-2 ${className}`.trim()}
      role="group"
      aria-label="Условия гарантии и возврата"
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-2 py-1.5 text-left sm:gap-2 sm:px-2.5 sm:py-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 sm:h-8 sm:w-8 [&_img]:max-h-[1.1rem] [&_img]:max-w-[1.1rem] sm:[&_img]:max-h-4 sm:[&_img]:max-w-4"
          aria-hidden
        >
          {wUrl ? (
            <OptimizedImage
              src={wUrl}
              alt=""
              widths={[32, 48, 64]}
              sizes="18px"
              className="h-[1.1rem] w-[1.1rem] object-contain sm:h-4 sm:w-4"
            />
          ) : (
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3l7 4v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V7l7-4z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
            </svg>
          )}
        </span>
        <div className="min-w-0">
          <p className="font-body text-[10px] font-semibold uppercase leading-tight tracking-wide text-text-subtle sm:text-[11px]">
            Гарантия
          </p>
          <p className="truncate font-body text-xs font-medium text-text sm:text-sm">
            {warrantyMonths} {pluralMonths(warrantyMonths)}
          </p>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-sky-500/25 bg-sky-500/8 px-2 py-1.5 text-left sm:gap-2 sm:px-2.5 sm:py-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 sm:h-8 sm:w-8 [&_img]:max-h-[1.1rem] [&_img]:max-w-[1.1rem] sm:[&_img]:max-h-4 sm:[&_img]:max-w-4"
          aria-hidden
        >
          {rUrl ? (
            <OptimizedImage
              src={rUrl}
              alt=""
              widths={[32, 48, 64]}
              sizes="18px"
              className="h-[1.1rem] w-[1.1rem] object-contain sm:h-4 sm:w-4"
            />
          ) : (
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
        </span>
        <div className="min-w-0">
          <p className="font-body text-[10px] font-semibold uppercase leading-tight tracking-wide text-text-subtle sm:text-[11px]">
            Возврат
          </p>
          <p className="whitespace-nowrap font-body text-xs font-medium text-text sm:text-sm">{returnDays} дней</p>
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
