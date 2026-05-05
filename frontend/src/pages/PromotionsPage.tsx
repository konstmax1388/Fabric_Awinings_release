import { Helmet } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { promotionCoverAlt } from '../lib/imageAlt'
import { useCanonicalHrefForMeta } from '../context/CanonicalUrlContext'
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
  const { seoDefaults, siteName } = useSiteSettings()
  const canonicalForMeta = useCanonicalHrefForMeta()
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
        <meta name="twitter:card" content={tw} />
        {seoDefaults.ogImageUrl ? <meta name="twitter:image" content={seoDefaults.ogImageUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalForMeta} />
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
            <ul className="mt-10 grid grid-cols-1 gap-6 sm:gap-7 lg:grid-cols-2">
              {items.map((p) => (
                <li key={p.slug}>
                  <article className="fabric-card flex h-full min-h-[280px] flex-col overflow-hidden p-0 sm:min-h-[300px]">
                    {p.imageUrl ? (
                      <Link to={`/sales/${p.slug}`} className="block shrink-0">
                        <OptimizedImage
                          src={p.imageUrl}
                          alt={promotionCoverAlt(p.title)}
                          widths={[640, 800, 960]}
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="aspect-[21/9] min-h-[11rem] w-full object-cover sm:min-h-[13rem] sm:aspect-[2/1]"
                        />
                      </Link>
                    ) : null}
                    <div className="flex min-h-0 flex-1 flex-col p-5 md:p-6">
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
                      <h2 className="mt-2 font-heading text-xl font-semibold leading-snug text-text md:text-2xl">
                        <Link to={`/sales/${p.slug}`} className="hover:text-accent">
                          {p.title}
                        </Link>
                      </h2>
                      {p.excerpt ? (
                        <p className="mt-2 line-clamp-4 font-body text-sm leading-relaxed text-text-muted md:text-[15px]">
                          {p.excerpt}
                        </p>
                      ) : null}
                      <Link
                        to={`/sales/${p.slug}`}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-center font-body text-sm font-semibold text-surface shadow-sm transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base md:w-auto md:min-w-[10rem]"
                      >
                        Подробнее
                      </Link>
                    </div>
                  </article>
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
