import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { PromoEndsCountdown } from '../promo/PromoEndsCountdown'
import { fetchPromotions, type PromotionListItem } from '../../lib/api'
import { easeOutSoft, fadeUpHidden, fadeUpVisible } from '../../lib/motion-presets'
import { promotionCoverAlt } from '../../lib/imageAlt'
import { OptimizedImage } from '../ui/OptimizedImage'

function formatPeriod(p: PromotionListItem): string {
  const start = p.startsAt ? new Date(p.startsAt).toLocaleDateString('ru-RU') : ''
  const end = p.endsAt ? new Date(p.endsAt).toLocaleDateString('ru-RU') : ''
  if (start && end) return `${start} — ${end}`
  if (start) return `с ${start}`
  return ''
}

export function PromotionsSection() {
  const reduce = useReducedMotion()
  const { home } = useSiteSettings()
  const block = home?.promotions
  const heading = (block?.heading ?? '').trim() || 'Акции'
  const subheading =
    (block?.subheading ?? '').trim() ||
    'Действующие предложения и скидки. Подробности — на странице каждой акции.'
  const allLink = 'Все акции →'
  const loadingText = 'Загрузка акций…'

  const [promos, setPromos] = useState<PromotionListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchPromotions().then((list) => {
      if (!cancelled) {
        setPromos(list.slice(0, 3))
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <section className="fabric-container min-w-0 py-8 md:py-12" aria-busy="true">
        <p className="font-body text-text-muted">{loadingText}</p>
      </section>
    )
  }

  if (promos.length === 0) {
    return null
  }

  return (
    <motion.section
      className="fabric-container min-w-0 py-8 md:py-12"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.15 }}
      transition={easeOutSoft}
      aria-labelledby="fabric-promotions-heading"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border-light bg-gradient-to-br from-primary/25 via-bg-base to-bg-base p-px shadow-lg shadow-black/20 md:rounded-3xl">
        <div className="relative rounded-[calc(1rem-1px)] bg-bg-base/95 p-5 md:rounded-[calc(1.5rem-1px)] md:p-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-primary/30 blur-3xl"
            aria-hidden
          />

          <header className="relative z-[1] mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-2">
              <h2
                id="fabric-promotions-heading"
                className="font-heading text-2xl font-semibold tracking-tight text-text md:text-4xl"
              >
                {heading}
              </h2>
              {subheading ? <p className="font-body text-sm text-text-muted md:text-base">{subheading}</p> : null}
            </div>
            <Link to="/akcii" className="font-body font-medium text-accent hover:underline md:shrink-0">
              {allLink}
            </Link>
          </header>

          <ul className="relative z-[1] grid gap-4 md:grid-cols-3 md:gap-5">
            {promos.map((p) => (
              <li key={p.slug}>
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface/90 shadow-sm ring-1 ring-border/40 backdrop-blur-sm transition hover:border-accent/35 hover:ring-accent/20">
                  {p.imageUrl ? (
                    <Link to={`/akcii/${p.slug}`} className="block shrink-0">
                      <OptimizedImage
                        src={p.imageUrl}
                        alt={promotionCoverAlt(p.title)}
                        widths={[480, 640, 800]}
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="h-40 w-full object-cover"
                      />
                    </Link>
                  ) : null}
                  <div className="flex min-h-0 flex-1 flex-col p-4 md:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {p.discountPercent > 0 ? (
                        <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-body text-xs font-semibold text-accent">
                          −{p.discountPercent}%
                        </span>
                      ) : null}
                      {p.appliesToAllProducts ? (
                        <span className="rounded-full border border-border px-2 py-0.5 font-body text-xs text-text-muted">
                          Весь каталог
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 font-body text-xs text-text-subtle">{formatPeriod(p)}</p>
                    <PromoEndsCountdown endsAt={p.endsAt} size="sm" className="max-w-full" />
                    <h3 className="mt-2 font-heading text-lg font-semibold leading-snug text-text md:text-xl">
                      <Link to={`/akcii/${p.slug}`} className="hover:text-accent">
                        {p.title}
                      </Link>
                    </h3>
                    {p.excerpt ? (
                      <p className="mt-2 min-h-0 flex-1 font-body text-sm leading-relaxed text-text-muted md:text-[15px]">
                        {p.excerpt}
                      </p>
                    ) : null}
                    <Link
                      to={`/akcii/${p.slug}`}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-center font-body text-sm font-semibold text-surface shadow-sm transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base md:w-auto md:min-w-[10rem]"
                    >
                      Подробнее
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.section>
  )
}
