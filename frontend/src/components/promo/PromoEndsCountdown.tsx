import { useEffect, useMemo, useState } from 'react'

type Props = {
  /** ISO 8601 с бэкенда (например с поля promoEndsAt или endsAt акции). */
  endsAt: string | null | undefined
  className?: string
  /** Компактнее для карточки каталога. */
  size?: 'sm' | 'md'
}

function parseTargetMs(iso: string): number | null {
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : null
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function Segment({
  valueStr,
  label,
  compact,
}: {
  valueStr: string
  label: string
  compact: boolean
}) {
  return (
    <div className="flex min-w-[2.5rem] flex-col items-center justify-center px-1.5 py-0.5 sm:min-w-[2.75rem] sm:px-2">
      <span
        className={
          compact
            ? 'font-heading text-base font-semibold tabular-nums tracking-tight text-text sm:text-lg'
            : 'font-heading text-xl font-semibold tabular-nums tracking-tight text-text sm:text-2xl'
        }
      >
        {valueStr}
      </span>
      <span
        className={
          compact
            ? 'mt-0.5 font-body text-[10px] leading-tight text-text-muted'
            : 'mt-1 font-body text-[11px] leading-tight text-text-muted sm:text-xs'
        }
      >
        {label}
      </span>
    </div>
  )
}

function Separator({ compact }: { compact: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center self-stretch ${compact ? 'px-0.5' : 'px-1 sm:px-1.5'}`}
      aria-hidden
    >
      <span
        className={
          compact
            ? 'select-none font-body text-base font-light text-border'
            : 'select-none font-body text-lg font-light text-border sm:text-xl'
        }
      >
        :
      </span>
    </div>
  )
}

export function PromoEndsCountdown({ endsAt, className = '', size = 'md' }: Props) {
  const target = useMemo(() => {
    const s = typeof endsAt === 'string' ? endsAt.trim() : ''
    if (!s) return null
    return parseTargetMs(s)
  }, [endsAt])

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (target == null) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [target])

  if (target == null) return null

  const left = target - now
  if (left <= 0) return null

  const totalSec = Math.floor(left / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  const compact = size === 'sm'

  return (
    <div
      className={`mt-2 min-w-0 ${className}`.trim()}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <p
        className={
          compact
            ? 'mb-1.5 font-body text-[10px] font-medium text-text-muted'
            : 'mb-2 font-body text-xs font-medium text-text-muted'
        }
      >
        До конца акции
      </p>
      <div
        className={
          compact
            ? 'inline-flex max-w-full items-stretch rounded-xl border border-border-light bg-surface px-1.5 py-1.5 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]'
            : 'inline-flex max-w-full items-stretch rounded-2xl border border-border-light bg-surface px-2 py-2 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] sm:px-3 sm:py-2.5'
        }
      >
        {days > 0 ? (
          <>
            <Segment valueStr={String(days)} label="дней" compact={compact} />
            <Separator compact={compact} />
          </>
        ) : null}
        <Segment valueStr={pad2(hours)} label="часов" compact={compact} />
        <Separator compact={compact} />
        <Segment valueStr={pad2(minutes)} label="мин" compact={compact} />
        <Separator compact={compact} />
        <Segment valueStr={pad2(seconds)} label="сек" compact={compact} />
      </div>
    </div>
  )
}
