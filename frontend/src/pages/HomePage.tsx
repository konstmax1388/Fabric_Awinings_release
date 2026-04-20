import { Helmet } from 'react-helmet-async'
import { useEffect, useMemo, useState } from 'react'
import { BlogPreviewSection } from '../components/home/BlogPreviewSection'
import { HeroSection } from '../components/home/HeroSection'
import { MapFormSection } from '../components/home/MapFormSection'
import { PortfolioSection } from '../components/home/PortfolioSection'
import { PriceCalculatorSection } from '../components/home/PriceCalculatorSection'
import { ProblemSolutionSection } from '../components/home/ProblemSolutionSection'
import { ProcessTimelineSection } from '../components/home/ProcessTimelineSection'
import { ReviewsSection } from '../components/home/ReviewsSection'
import { FeaturedProductsSection } from '../components/home/FeaturedProductsSection'
import { TentTypesSection } from '../components/home/TentTypesSection'
import { WhyUsSection } from '../components/home/WhyUsSection'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { publicSiteUrl } from '../config/publicSite'
import { useSiteSettings } from '../context/SiteSettingsContext'

export function HomePage() {
  const site = publicSiteUrl()
  const { home, siteName, calculatorEnabled, portfolioEnabled, phone, address, seoDefaults } =
    useSiteSettings()
  const meta = home?.meta
  const [showFirstVisitPromo, setShowFirstVisitPromo] = useState(false)

  const orgJsonLd = useMemo(() => {
    const desc =
      meta?.orgDescription?.trim() ||
      seoDefaults.defaultMetaDescription?.trim() ||
      'Тенты, навесы, шатры и террасы под ключ.'
    const region = seoDefaults.region || 'RU'
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: meta?.orgName ?? siteName,
      url: site,
      description: desc,
      telephone: phone?.trim() || undefined,
      address:
        address?.trim() ?
          {
            '@type': 'PostalAddress',
            streetAddress: address.trim(),
            addressCountry: 'RU',
            addressRegion: region,
          }
        : undefined,
    })
  }, [
    site,
    meta?.orgName,
    meta?.orgDescription,
    siteName,
    phone,
    address,
    seoDefaults.region,
    seoDefaults.defaultMetaDescription,
  ])

  useEffect(() => {
    if (!calculatorEnabled) return
    if (window.location.hash === '#calculator') {
      window.setTimeout(() => {
        document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [calculatorEnabled])

  useEffect(() => {
    const k = 'fabric:first-visit-producer-note:v1'
    try {
      if (!window.localStorage.getItem(k)) {
        setShowFirstVisitPromo(true)
      }
    } catch {
      setShowFirstVisitPromo(true)
    }
  }, [])

  const dismissFirstVisitPromo = () => {
    const k = 'fabric:first-visit-producer-note:v1'
    setShowFirstVisitPromo(false)
    try {
      window.localStorage.setItem(k, '1')
    } catch {
      /* noop */
    }
  }

  const baseTitle = meta?.title ?? 'Фабрика Тентов — тенты, навесы, шатры'
  const pageTitle = seoDefaults.titleSuffix ? `${baseTitle} ${seoDefaults.titleSuffix}` : baseTitle
  const pageDesc =
    meta?.description?.trim() ||
    seoDefaults.defaultMetaDescription?.trim() ||
    'Изготовление и монтаж тентов для транспорта, складов, кафе и мероприятий. Каталог, конструктор тента, заявка онлайн.'

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        {!seoDefaults.allowIndexing ? <meta name="robots" content="noindex, nofollow" /> : null}
        <link rel="canonical" href={`${site}/`} />
        <script type="application/ld+json">{orgJsonLd}</script>
      </Helmet>
      <SiteHeader />
      <main className="min-w-0 overflow-x-clip">
        {showFirstVisitPromo ? (
          <section className="mx-auto max-w-[1280px] px-4 pt-4 md:px-6 md:pt-6">
            <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-r from-accent/15 via-accent/10 to-bg-base px-4 py-4 text-sm text-text shadow-[0_18px_40px_-28px_rgba(232,122,0,0.7)] md:flex md:items-center md:justify-between md:gap-5 md:px-5 md:py-4 md:text-base">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/15 blur-2xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-10 left-1/3 h-24 w-24 rounded-full bg-primary/15 blur-2xl"
              />
              <p className="relative flex items-start gap-3 font-body md:items-center">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-bg-base md:mt-0">
                  %
                </span>
                <span>Вы на сайте производителя: цены ниже, чем у нас же на маркетплейсах.</span>
              </p>
              <button
                type="button"
                onClick={dismissFirstVisitPromo}
                className="relative mt-3 inline-flex items-center justify-center rounded-lg border border-accent/30 bg-bg-base/80 px-4 py-2 font-body text-sm font-semibold text-accent transition duration-300 hover:-translate-y-0.5 hover:bg-accent hover:text-bg-base hover:shadow-[0_10px_20px_-12px_rgba(232,122,0,0.9)] md:mt-0"
              >
                Понятно
              </button>
            </div>
          </section>
        ) : null}
        <div className="px-0 pt-4 md:pt-6">
          <HeroSection />
        </div>
        <ProblemSolutionSection />
        <ProcessTimelineSection />
        <TentTypesSection />
        <FeaturedProductsSection />
        {calculatorEnabled ? <PriceCalculatorSection /> : null}
        {portfolioEnabled ? <PortfolioSection /> : null}
        <WhyUsSection />
        <ReviewsSection />
        <BlogPreviewSection />
        <MapFormSection />
      </main>
      <SiteFooter />
    </>
  )
}
