import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  fetchMarketGoodsFeedbacks,
  type MarketGoodsFeedbackItem,
  type MarketGoodsFeedbacksResponse,
} from '../../lib/api'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../../lib/motion-presets'
import { OptimizedImage } from '../ui/OptimizedImage'

function Stars({ rating }: { rating: number }) {
  const r = Math.min(5, Math.max(0, Math.round(rating)))
  return (
    <div className="flex gap-0.5" aria-label={`Оценка ${r} из 5`}>
      {Array.from({ length: 5 }, (_, k) => (
        <span key={k} className={k < r ? 'text-amber-500' : 'text-border'}>
          ★
        </span>
      ))}
    </div>
  )
}

function formatCreated(iso: string): string {
  const t = (iso || '').trim()
  if (!t) return ''
  const d = Date.parse(t)
  if (Number.isNaN(d)) return t.slice(0, 10)
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(d),
    )
  } catch {
    return t.slice(0, 10)
  }
}

/**
 * Отзывы о товарах с Яндекс.Маркета (Partner API через бэкенд).
 * Показывается только если в настройках сайта включён блок и заданы ключ + businessId.
 */
export function MarketGoodsReviewsSection({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  const { reviewsMarket, reviewsYandex } = useSiteSettings()
  const active = reviewsMarket?.goodsFeedbackActive === true
  const profileUrl = (reviewsYandex?.profileUrl ?? '').trim()
  const [state, setState] = useState<MarketGoodsFeedbacksResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!active) {
      setLoading(false)
      setState(null)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchMarketGoodsFeedbacks({ limit: 20, minRating: 4 }).then((res) => {
      if (!cancelled) {
        setState(res)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [active])

  if (!active) return null

  if (loading) {
    return (
      <div className={className ?? 'mt-8'}>
        <p className="font-body text-sm text-text-muted">Загрузка отзывов с Маркета…</p>
      </div>
    )
  }

  if (!state || !state.active) return null

  const items = state.items
  const err = state.error

  if (err && items.length === 0) {
    return (
      <div className={className ?? 'mt-8'}>
        <h2 className="font-heading text-xl font-semibold text-text md:text-2xl">Отзывы о товарах на Маркете</h2>
        <p className="mt-2 font-body text-sm text-text-muted">
          Сейчас не удалось получить отзывы из кабинета Маркета. Попробуйте позже или откройте{' '}
          {profileUrl ? (
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">
              страницу магазина на Маркете
            </a>
          ) : (
            'страницу магазина на Маркете'
          )}
          .
        </p>
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <motion.section
      className={className ?? 'mt-10'}
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.08 }}
      transition={easeOutSoft}
    >
      <h2 className="font-heading text-xl font-semibold text-text md:text-2xl">Отзывы о товарах на Маркете</h2>
      <p className="mt-2 max-w-3xl font-body text-sm text-text-muted md:text-[15px]">
        Реальные отзывы покупателей из кабинета продавца (Partner API). Показаны оценки от 4 звёзд.
      </p>
      <motion.div
        className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
      >
        {items.map((it: MarketGoodsFeedbackItem) => (
          <motion.article
            key={it.id}
            variants={staggerItem}
            className="flex h-full flex-col rounded-2xl border border-border-light bg-surface p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-body text-sm font-semibold text-text">{it.author}</p>
                {it.createdAt ? (
                  <p className="mt-0.5 text-xs text-text-muted">{formatCreated(it.createdAt)}</p>
                ) : null}
              </div>
              <Stars rating={it.rating} />
            </div>
            {it.offerId ? (
              <p className="mt-2 truncate font-mono text-[11px] text-text-subtle" title={it.offerId}>
                SKU: {it.offerId}
              </p>
            ) : null}
            {it.text ? (
              <p className="mt-3 flex-1 whitespace-pre-wrap font-body text-sm leading-relaxed text-text-muted">
                «{it.text}»
              </p>
            ) : null}
            {it.photos.length > 0 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {it.photos.map((src, idx) => (
                  <OptimizedImage
                    key={`${it.id}-${idx}`}
                    src={src}
                    alt={`Фото к отзыву ${it.author}`}
                    widths={[96, 160, 128]}
                    sizes="72px"
                    className="h-[72px] w-[72px] shrink-0 rounded-lg border border-border-light object-cover"
                  />
                ))}
              </div>
            ) : null}
          </motion.article>
        ))}
      </motion.div>
      {profileUrl ? (
        <p className="mt-6 font-body text-sm text-text-muted">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            Все отзывы и карточка магазина на Яндекс.Маркете ↗
          </a>
        </p>
      ) : null}
    </motion.section>
  )
}
