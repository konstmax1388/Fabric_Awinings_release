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
            <div className="rounded-2xl border border-accent/20 bg-accent/8 px-4 py-3 text-sm text-text md:flex md:items-center md:justify-between md:gap-4 md:text-base">
              <p className="font-body">
                Вы на сайте производителя: цены ниже, чем у нас же на маркетплейсах.
              </p>
              <button
                type="button"
                onClick={dismissFirstVisitPromo}
                className="mt-2 inline-flex rounded-lg border border-accent/30 px-3 py-1.5 font-body text-sm text-accent hover:bg-accent/10 md:mt-0"
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
