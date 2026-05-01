import { Helmet } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { promotionCoverAlt } from '../lib/imageAlt'
import { publicSiteUrl } from '../config/publicSite'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { PromoEndsCountdown } from '../components/promo/PromoEndsCountdown'
import { OptimizedImage } from '../components/ui/OptimizedImage'
import { fetchPromotionBySlug, type PromotionDetail } from '../lib/api'
import { buildSeoTitle, truncateMetaDescription } from '../lib/seoVitrine'

function formatPeriod(p: PromotionDetail): string {
  const start = p.startsAt ? new Date(p.startsAt).toLocaleDateString('ru-RU') : ''
  const end = p.endsAt ? new Date(p.endsAt).toLocaleDateString('ru-RU') : ''
  if (start && end) return `${start} — ${end}`
  if (start) return `с ${start}`
  return ''
}

export function PromotionDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const site = publicSiteUrl()
  const { seoDefaults, siteName } = useSiteSettings()
  const [promo, setPromo] = useState<PromotionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const tw = seoDefaults.twitterCard || 'summary_large_image'

  useEffect(() => {
    if (!slug) {
      setPromo(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchPromotionBySlug(slug).then((row) => {
      if (!cancelled) {
        setPromo(row)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="fabric-page">
          <div className="fabric-page-main min-w-0 p-6">
            <p className="font-body text-text-muted">Загрузка…</p>
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  if (!promo) {
    return (
      <>
        <SiteHeader />
        <main className="fabric-page">
          <div className="fabric-page-main min-w-0 p-6">
            <h1 className="font-heading text-2xl font-semibold text-text">Акция не найдена</h1>
            <Link to="/akcii" className="mt-4 inline-block text-accent hover:underline">
              ← К списку акций
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  const pageTitle = buildSeoTitle('listing', { title: promo.title, siteName }, seoDefaults)
  const pageDesc = truncateMetaDescription(promo.excerpt || promo.body || pageTitle, undefined, seoDefaults)
  const canonical = `${site}/akcii/${promo.slug}`

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        {!seoDefaults.allowIndexing ? <meta name="robots" content="noindex, nofollow" /> : null}
        <link rel="canonical" href={canonical} />
        <meta name="twitter:card" content={tw} />
        {promo.imageUrl ? <meta name="twitter:image" content={promo.imageUrl} /> : null}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        {promo.imageUrl ? <meta property="og:image" content={promo.imageUrl} /> : null}
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <div className="fabric-page-main min-w-0 overflow-x-clip">
          <nav className="font-body text-sm text-text-muted">
            <Link to="/" className="hover:text-accent">
              Главная
            </Link>
            <span className="mx-2 text-text-subtle">/</span>
            <Link to="/akcii" className="hover:text-accent">
              Акции
            </Link>
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {promo.discountPercent > 0 ? (
              <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-body text-xs font-semibold text-accent">
                −{promo.discountPercent}%
              </span>
            ) : null}
            {promo.appliesToAllProducts ? (
              <span className="rounded-full border border-border px-2 py-0.5 font-body text-xs text-text-muted">
                Весь каталог
              </span>
            ) : null}
          </div>
          <p className="mt-2 font-body text-xs text-text-subtle">{formatPeriod(promo)}</p>
          <PromoEndsCountdown endsAt={promo.endsAt} className="max-w-xl" />

          <h1 className="fabric-section-title mt-4">{promo.title}</h1>

          {promo.imageUrl ? (
            <div className="mt-6 max-w-3xl">
              <OptimizedImage
                src={promo.imageUrl}
                alt={promotionCoverAlt(promo.title)}
                widths={[640, 960, 1200]}
                sizes="(max-width: 768px) 100vw, 48rem"
                className="w-full rounded-2xl object-cover"
              />
            </div>
          ) : null}

          {promo.excerpt ? (
            <p className="mt-6 max-w-3xl font-body text-lg text-text-muted">{promo.excerpt}</p>
          ) : null}

          {promo.body ? (
            <div className="prose prose-invert mt-8 max-w-3xl whitespace-pre-line font-body text-text-muted">
              {promo.body}
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/akcii" className="font-medium text-accent hover:underline">
              ← Все акции
            </Link>
            <Link to="/catalog" className="font-medium text-accent hover:underline">
              В каталог
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
