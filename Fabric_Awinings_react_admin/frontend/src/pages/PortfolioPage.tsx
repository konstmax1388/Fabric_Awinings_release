import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { fetchPortfolio, type PortfolioItem } from '../lib/api'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../lib/motion-presets'
import { Helmet } from 'react-helmet-async'
import { OptimizedImage } from '../components/ui/OptimizedImage'

export function PortfolioPage() {
  const reduce = useReducedMotion()
  const [projects, setProjects] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <>
      <Helmet>
        <title>Портфолио — Фабрика Тентов</title>
        <meta name="description" content="Реализованные проекты: тенты, навесы, террасы." />
      </Helmet>
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-16 md:px-6">
        <motion.div
          initial={reduce ? false : fadeUpHidden}
          animate={reduce ? undefined : fadeUpVisible}
          transition={easeOutSoft}
        >
          <h1 className="font-heading text-4xl font-bold text-text md:text-5xl">Портфолио</h1>
          <p className="mt-4 max-w-xl font-body text-text-muted">
            Реализованные проекты: до и после. Категории совпадают с фильтрами на главной.
          </p>
        </motion.div>

        {loading ? (
          <p className="mt-10 font-body text-text-muted">Загрузка…</p>
        ) : (
          <motion.div
            className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {projects.map((p) => (
              <motion.article
                key={p.id}
                variants={staggerItem}
                className="overflow-hidden rounded-2xl border border-border-light bg-surface shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)]"
              >
                <div className="grid grid-cols-2 gap-0.5 bg-border">
                  <OptimizedImage
                    src={p.before}
                    alt={`${p.title} — до`}
                    widths={[480, 640, 800]}
                    sizes="(max-width: 768px) 50vw, 200px"
                    className="aspect-[4/3] object-cover"
                  />
                  <OptimizedImage
                    src={p.after}
                    alt={`${p.title} — после`}
                    widths={[480, 640, 800]}
                    sizes="(max-width: 768px) 50vw, 200px"
                    className="aspect-[4/3] object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="font-body text-xs text-text-subtle">
                    {p.category} · {p.date}
                  </p>
                  <h2 className="mt-1 font-heading text-lg font-semibold text-text">{p.title}</h2>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}

        <Link to="/" className="mt-12 inline-block font-medium text-accent hover:underline">
          ← На главную
        </Link>
      </main>
      <SiteFooter />
    </>
  )
}
