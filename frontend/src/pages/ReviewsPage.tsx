import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ReviewsSection } from '../components/home/ReviewsSection'
import { MarketGoodsReviewsSection } from '../components/reviews/MarketGoodsReviewsSection'
import { ReviewsYandexBlock } from '../components/reviews/ReviewsYandexBlock'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { publicSiteUrl } from '../config/publicSite'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { buildSeoTitle, truncateMetaDescription } from '../lib/seoVitrine'

export function ReviewsPage() {
  const site = publicSiteUrl()
  const { siteName, home, reviewsYandex, reviewsMarket, contactsBackLinkLabel, seoDefaults } =
    useSiteSettings()
  const rv = home?.reviews
  const pageTitle = (rv?.pageTitle ?? 'Отзывы').trim() || 'Отзывы'
  const metaDescription = (rv?.pageDescription ?? '').trim()
  const yandexVisible = Boolean(
    (reviewsYandex?.widgetHtml ?? '').trim() || (reviewsYandex?.profileUrl ?? '').trim(),
  )
  const marketGoodsReviewsEnabled = reviewsMarket?.goodsFeedbackActive === true
  const yandexBlockTitle = (rv?.yandexBlockHeading ?? '').trim() || 'Отзывы на Яндекс.Маркете'
  const yandexBlockNote = (rv?.yandexBlockNote ?? '').trim()
  const docTitle = buildSeoTitle('emdash', { title: pageTitle, siteName }, seoDefaults)
  const desc = metaDescription
    ? truncateMetaDescription(metaDescription, undefined, seoDefaults)
    : ''
  const tw = seoDefaults.twitterCard || 'summary_large_image'

  return (
    <>
      <Helmet>
        <title>{docTitle}</title>
        {desc ? <meta name="description" content={desc} /> : null}
        {!seoDefaults.allowIndexing ? <meta name="robots" content="noindex, nofollow" /> : null}
        <link rel="canonical" href={`${site}/reviews`} />
        <meta name="twitter:card" content={tw} />
        {seoDefaults.ogImageUrl ? <meta name="twitter:image" content={seoDefaults.ogImageUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${site}/reviews`} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={docTitle} />
        {desc ? <meta property="og:description" content={desc} /> : null}
        {seoDefaults.ogImageUrl ? <meta property="og:image" content={seoDefaults.ogImageUrl} /> : null}
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <div className="fabric-page-main min-w-0 overflow-x-clip">
          <div className="fabric-container py-6 md:py-10">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-text md:text-4xl">
              {pageTitle}
            </h1>
            {metaDescription ? (
              <p className="mt-3 max-w-3xl font-body text-text-muted md:text-lg">{metaDescription}</p>
            ) : null}
            {marketGoodsReviewsEnabled ? <MarketGoodsReviewsSection className="mt-8" /> : null}
            {yandexVisible ? (
              <ReviewsYandexBlock className="mt-8" title={yandexBlockTitle} note={yandexBlockNote} />
            ) : null}
          </div>
          <ReviewsSection mode="page" showListHeading={yandexVisible || marketGoodsReviewsEnabled} />
          <div className="fabric-container pb-10">
            <Link
              to="/"
              className="fabric-strap-btn inline-block rounded-full border border-border px-5 py-2 font-medium text-accent hover:border-accent/60"
            >
              {contactsBackLinkLabel}
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
