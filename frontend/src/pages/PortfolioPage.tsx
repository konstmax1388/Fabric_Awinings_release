import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { fetchPortfolio, type PortfolioItem } from '../lib/api'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../lib/motion-presets'
import { Helmet } from 'react-helmet-async'
import { BeforeAfterSlider } from '../components/portfolio/BeforeAfterSlider'
import { OptimizedImage } from '../components/ui/OptimizedImage'
import { useCanonicalHrefForMeta } from '../context/CanonicalUrlContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { buildSeoTitle, truncateMetaDescription } from '../lib/seoVitrine'

export function PortfolioPage() {
  const reduce = useReducedMotion()
  const { seoDefaults, home, siteName } = useSiteSettings()
  const canonicalForMeta = useCanonicalHrefForMeta()
  const portfolio = home?.portfolio ?? {}
  const pageHeading = portfolio.pageHeading?.trim() || 'Портфолио'
  const pageSubheading = portfolio.pageSubheading?.trim() || 'Реализованные проекты'
  const portTitle = buildSeoTitle('listing', { title: pageHeading, siteName }, seoDefaults)
  const portDesc = truncateMetaDescription(
    seoDefaults.defaultMetaDescription?.trim() || 'Реализованные проекты: тенты, навесы, террасы.',
    undefined,
    seoDefaults,
  )
  const tw = seoDefaults.twitterCard || 'summary_large_image'
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
        <title>{portTitle}</title>
        <meta name="description" content={portDesc} />
        {!seoDefaults.allowIndexing ? <meta name="robots" content="noindex, nofollow" /> : null}
        <meta name="twitter:card" content={tw} />
        {seoDefaults.ogImageUrl ? <meta name="twitter:image" content={seoDefaults.ogImageUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalForMeta} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={portTitle} />
        <meta property="og:description" content={portDesc} />
        {seoDefaults.ogImageUrl ? <meta property="og:image" content={seoDefaults.ogImageUrl} /> : null}
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <div className="fabric-page-main min-w-0 overflow-x-clip">
        <motion.div
          initial={reduce ? false : fadeUpHidden}
          animate={reduce ? undefined : fadeUpVisible}
          transition={easeOutSoft}
        >
          <h1 className="fabric-section-title">{pageHeading}</h1>
          <p className="mt-4 max-w-xl font-body text-text-muted">{pageSubheading}</p>
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
                className="fabric-card overflow-hidden"
              >
                <div className="hidden grid-cols-2 gap-0.5 bg-border md:grid">
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
                <div className="md:hidden">
                  <BeforeAfterSlider before={p.before} after={p.after} title={p.title} />
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

        <Link to="/" className="fabric-strap-btn mt-12 inline-block rounded-full border border-border px-5 py-2 font-medium text-accent hover:border-accent/60">
          ← На главную
        </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
