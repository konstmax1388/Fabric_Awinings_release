import { Helmet } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { promotionCoverAlt } from '../lib/imageAlt'
import { publicSiteUrl } from '../config/publicSite'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { PromoEndsCountdown } from '../components/promo/PromoEndsCountdown'
import { OptimizedImage } from '../components/ui/OptimizedImage'
import { fetchPromotions, type PromotionListItem } from '../lib/api'
import { buildSeoTitle, truncateMetaDescription } from '../lib/seoVitrine'

function formatPeriod(p: PromotionListItem): string {
  const start = p.startsAt ? new Date(p.startsAt).toLocaleDateString('ru-RU') : ''
  const end = p.endsAt ? new Date(p.endsAt).toLocaleDateString('ru-RU') : ''
  if (start && end) return `${start} — ${end}`
  if (start) return `с ${start}`
  return ''
}

export function PromotionsPage() {
  const site = publicSiteUrl()
  const { seoDefaults, siteName } = useSiteSettings()
  const pageTitle = buildSeoTitle('listing', { title: 'Акции', siteName }, seoDefaults)
  const pageDesc = truncateMetaDescription(
    seoDefaults.defaultMetaDescription?.trim() ||
      'Специальные предложения и скидки при заказе на сайте.',
    undefined,
    seoDefaults,
  )
  const tw = seoDefaults.twitterCard || 'summary_large_image'
  const [items, setItems] = useState<PromotionListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchPromotions().then((list) => {
      if (!cancelled) {
        setItems(list)
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
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        {!seoDefaults.allowIndexing ? <meta name="robots" content="noindex, nofollow" /> : null}
        <link rel="canonical" href={`${site}/akcii`} />
        <meta name="twitter:card" content={tw} />
        {seoDefaults.ogImageUrl ? <meta name="twitter:image" content={seoDefaults.ogImageUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${site}/akcii`} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        {seoDefaults.ogImageUrl ? <meta property="og:image" content={seoDefaults.ogImageUrl} /> : null}
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <div className="fabric-page-main min-w-0 overflow-x-clip">
          <h1 className="fabric-section-title">Акции</h1>
          <p className="mt-4 max-w-2xl font-body text-text-muted">
            Действующие предложения. Условия и сроки — на странице каждой акции; скидка от цены в каталоге применяется при
            оформлении заказа на сайте, если указан процент.
          </p>

          {loading ? (
            <p className="mt-10 font-body text-text-muted">Загрузка…</p>
          ) : items.length === 0 ? (
            <p className="mt-10 font-body text-text-muted">Сейчас нет активных акций. Загляните позже.</p>
          ) : (
            <ul className="mt-10 flex flex-col gap-6">
              {items.map((p) => (
                <li key={p.slug} className="fabric-card flex flex-col gap-4 p-5 sm:flex-row">
                  {p.imageUrl ? (
                    <OptimizedImage
                      src={p.imageUrl}
                      alt={promotionCoverAlt(p.title)}
                      widths={[480, 640, 800]}
                      sizes="(max-width: 640px) 100vw, 192px"
                      className="h-40 w-full shrink-0 rounded-2xl object-cover sm:h-32 sm:w-48"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
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
                    <PromoEndsCountdown endsAt={p.endsAt} size="sm" className="max-w-md" />
                    <h2 className="mt-2 font-heading text-2xl font-semibold text-text">
                      <Link to={`/akcii/${p.slug}`} className="hover:text-accent">
                        {p.title}
                      </Link>
                    </h2>
                    {p.excerpt ? <p className="mt-2 font-body text-text-muted">{p.excerpt}</p> : null}
                    <Link
                      to={`/akcii/${p.slug}`}
                      className="mt-3 inline-block font-medium text-accent hover:underline"
                    >
                      Подробнее →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/"
            className="fabric-strap-btn mt-12 inline-block rounded-full border border-border px-5 py-2 font-medium text-accent hover:border-accent/60"
          >
            ← На главную
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
