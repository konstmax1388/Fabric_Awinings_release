import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { fetchPortfolio, type PortfolioItem } from '../../lib/api'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../../lib/motion-presets'
import { MagneticHover } from '../motion/MagneticHover'
import { BeforeAfterSlider } from '../portfolio/BeforeAfterSlider'
import { OptimizedImage } from '../ui/OptimizedImage'
import { cardHoverTransition, subtleHoverLift, subtleButtonHover } from '../../lib/motion-presets'

const DEFAULT_FILTERS = ['Все', 'Транспорт', 'Склады', 'Террасы']

export function PortfolioSection() {
  const { home } = useSiteSettings()
  const pf = home?.portfolio
  const heading = pf?.heading ?? 'Портфолио'
  const subheading =
    pf?.subheading ?? 'Реальные объекты: до и после. Полная галерея — в разделе портфолио.'
  const loadingText = pf?.loading ?? 'Загрузка портфолио…'
  const emptyText = pf?.empty ?? 'Нет проектов в выбранной категории.'
  const allProjectsCta = pf?.allProjectsCta ?? 'Все проекты'

  const categories = useMemo(() => {
    const f = pf?.filters
    if (Array.isArray(f) && f.length > 0 && f.every((x) => typeof x === 'string')) return f as string[]
    return DEFAULT_FILTERS
  }, [pf?.filters])

  const [filter, setFilter] = useState(categories[0] ?? 'Все')
  const [projects, setProjects] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!categories.includes(filter)) setFilter(categories[0] ?? 'Все')
  }, [categories, filter])

  useEffect(() => {
    let cancelled = false
    fetchPortfolio().then((list) => {
      if (!cancelled) {
        setProjects(list)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = filter === 'Все' ? projects : projects.filter((p) => p.category === filter)

  return (
    <motion.section
      className="mx-auto min-w-0 max-w-[1280px] px-4 py-12 md:px-6 md:py-24"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.08 }}
      transition={easeOutSoft}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">{heading}</h2>
          <p className="mt-3 max-w-xl font-body text-text-muted md:text-lg">{subheading}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`rounded-full px-4 py-2 font-body text-sm font-medium transition ${
                filter === c
                  ? 'bg-accent text-surface'
                  : 'bg-surface text-text-muted ring-1 ring-border hover:text-accent'
              }`}
              style={{ transform: 'translateZ(0)' }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-10 font-body text-text-muted">{loadingText}</p>
      ) : (
        <motion.div
          key={filter}
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((p) => (
            <motion.article
              key={p.id}
              variants={staggerItem}
              whileHover={reduce ? undefined : subtleHoverLift}
              whileTap={reduce ? undefined : { scale: 0.995 }}
              transition={cardHoverTransition}
              className="overflow-hidden rounded-2xl bg-surface shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)]"
            >
              <div className="hidden grid-cols-2 gap-0.5 bg-border md:grid">
                <OptimizedImage
                  src={p.before}
                  alt={`${p.title} — до`}
                  widths={[480, 640, 800]}
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="aspect-[4/3] object-cover"
                />
                <OptimizedImage
                  src={p.after}
                  alt={`${p.title} — после`}
                  widths={[480, 640, 800]}
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="aspect-[4/3] object-cover"
                />
              </div>
              <div className="md:hidden">
                <BeforeAfterSlider before={p.before} after={p.after} title={p.title} />
              </div>
              <div className="p-4">
                <p className="font-body text-xs text-text-subtle">
                  {p.category} · {p.date}
                </p>
                <h3 className="mt-1 font-heading text-lg font-semibold text-text">{p.title}</h3>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-border-light bg-bg-base px-6 py-10 text-center">
          <p className="font-heading text-xl font-semibold text-text">{emptyText}</p>
          <button
            type="button"
            onClick={() => setFilter(categories[0] ?? 'Все')}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-[40px] border border-border px-6 font-body text-sm font-medium text-text transition hover:border-accent hover:text-accent"
          >
            Сбросить фильтр
          </button>
        </div>
      )}

      <div className="mt-10 text-center">
        <MagneticHover radius={100} strength={0.1} className="inline-block">
          <motion.span
            whileHover={reduce ? undefined : subtleButtonHover}
            whileTap={reduce ? undefined : { scale: 0.98 }}
            transition={cardHoverTransition}
            className="inline-block"
          >
            <Link
              to="/portfolio"
              className="inline-flex h-12 items-center justify-center rounded-[40px] border-2 border-accent px-8 font-body font-medium text-accent hover:bg-[rgba(232,122,0,0.08)]"
              style={{ letterSpacing: '0.02em' }}
            >
              {allProjectsCta}
            </Link>
          </motion.span>
        </MagneticHover>
      </div>
    </motion.section>
  )
}
