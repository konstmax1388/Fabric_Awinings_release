import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ReviewsSection } from '../components/home/ReviewsSection'
import { ReviewsYandexBlock } from '../components/reviews/ReviewsYandexBlock'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { publicSiteUrl } from '../config/publicSite'
import { useSiteSettings } from '../context/SiteSettingsContext'

export function ReviewsPage() {
  const site = publicSiteUrl()
  const { siteName, home, reviewsYandex, contactsBackLinkLabel, seoDefaults } = useSiteSettings()
  const rv = home?.reviews
  const pageTitle = (rv?.pageTitle ?? 'Отзывы').trim() || 'Отзывы'
  const metaDescription = (rv?.pageDescription ?? '').trim()
  const yandexVisible = Boolean(
    (reviewsYandex?.widgetHtml ?? '').trim() || (reviewsYandex?.profileUrl ?? '').trim(),
  )

  return (
    <>
      <Helmet>
        <title>{`${pageTitle} — ${siteName}`}</title>
        {metaDescription ? <meta name="description" content={metaDescription} /> : null}
        {!seoDefaults.allowIndexing ? <meta name="robots" content="noindex, nofollow" /> : null}
        <link rel="canonical" href={`${site}/reviews`} />
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
            {yandexVisible ? <ReviewsYandexBlock className="mt-8" title="Отзывы в Яндексе" /> : null}
          </div>
          <ReviewsSection mode="page" showListHeading={yandexVisible} />
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
