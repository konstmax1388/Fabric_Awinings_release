import { Helmet } from 'react-helmet-async'
import { startTransition, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { AboutPageLayout } from '../components/static/AboutPageLayout'
import { ReviewsSection } from '../components/home/ReviewsSection'
import { fetchStaticPageBySlug, type StaticPageDto } from '../lib/api'
import { publicSiteUrl } from '../config/publicSite'
import { useSetCanonical, useCanonicalHrefForMeta } from '../context/CanonicalUrlContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { resolveStaticPageDocumentTitle, truncateMetaDescription } from '../lib/seoVitrine'

export function StaticPageRoute() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { siteName, seoDefaults } = useSiteSettings()
  const siteBase = publicSiteUrl()
  const [page, setPage] = useState<StaticPageDto | null | undefined>(undefined)

  useEffect(() => {
    if (!slug) {
      setPage(null)
      return
    }
    let cancelled = false
    startTransition(() => setPage(undefined))
    fetchStaticPageBySlug(slug).then((p) => {
      if (!cancelled) setPage(p)
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  const staticCanonicalOverride = useMemo(() => {
    if (page === undefined || page === null) return null
    const path = page.path.startsWith('/') ? page.path : `/${page.path}`
    return `${siteBase}${path}`
  }, [page, siteBase])
  useSetCanonical(staticCanonicalOverride)
  const canonicalForMeta = useCanonicalHrefForMeta()

  if (page === undefined) {
    return (
      <>
        <SiteHeader />
        <main className="fabric-page">
          <div className="fabric-page-main min-h-[60vh] w-full max-w-[960px]">
            <p className="font-body text-text-muted">Загрузка…</p>
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  if (!page) {
    return (
      <>
        <SiteHeader />
        <main className="fabric-page">
          <div className="fabric-page-main min-h-[60vh] w-full max-w-[960px]">
            <h1 className="font-heading text-3xl font-bold text-text">Страница не найдена</h1>
            <Link
              to="/"
              className="fabric-strap-btn mt-8 inline-flex h-11 items-center justify-center rounded-[40px] border border-border px-6 font-body text-sm font-medium text-text transition hover:border-text/40"
            >
              На главную
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  const docTitle = resolveStaticPageDocumentTitle(page, siteName, seoDefaults)
  const desc = truncateMetaDescription(page.metaDescription?.trim() || page.title, undefined, seoDefaults)
  const aboutV1 = page.aboutPayload?.version === 1
  const aboutHeading = page.pageTitle?.trim() || page.title
  const tw = seoDefaults.twitterCard || 'summary_large_image'
  return (
    <>
      <Helmet>
        <title>{docTitle}</title>
        <meta name="description" content={desc} />
        {!seoDefaults.allowIndexing ? <meta name="robots" content="noindex, nofollow" /> : null}
        <meta name="twitter:card" content={tw} />
        {seoDefaults.ogImageUrl ? <meta name="twitter:image" content={seoDefaults.ogImageUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalForMeta} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={docTitle} />
        <meta property="og:description" content={desc} />
        {seoDefaults.ogImageUrl ? <meta property="og:image" content={seoDefaults.ogImageUrl} /> : null}
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <div
          className={`fabric-page-main min-h-[60vh] w-full ${aboutV1 ? 'max-w-[min(100%,1200px)]' : 'max-w-[960px]'}`}
        >
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-sm text-text-muted">
            <Link to="/" className="text-text-muted transition hover:text-text">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <span className="text-text">{page.title}</span>
          </nav>
          {aboutV1 && page.aboutPayload ? (
            <>
              <article className="mt-8 min-w-0">
                <AboutPageLayout payload={page.aboutPayload} pageTitle={aboutHeading} />
              </article>
              <ReviewsSection mode="teaser" showListHeading />
            </>
          ) : (
            <article className="fabric-card mt-8 space-y-6 p-6 font-body text-sm leading-relaxed text-text md:p-8 md:text-base">
              <header className="space-y-2">
                <h1 className="font-heading text-2xl font-semibold text-text md:text-3xl">{page.title}</h1>
              </header>
              <div
                className="cms-html space-y-4 font-body text-base leading-relaxed text-text [&_p]:mt-4"
                dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
              />
            </article>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
