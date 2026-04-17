import { Helmet } from 'react-helmet-async'
import { useEffect, useMemo } from 'react'
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
  const { home, siteName, calculatorEnabled, phone, address, seoDefaults } = useSiteSettings()
  const meta = home?.meta

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

  const pageTitle = meta?.title ?? 'Фабрика Тентов — тенты, навесы, шатры'
  const pageDesc =
    meta?.description?.trim() ||
    seoDefaults.defaultMetaDescription?.trim() ||
    'Изготовление и монтаж тентов для транспорта, складов, кафе и мероприятий. Каталог, калькулятор, заявка онлайн.'

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
        <div className="px-0 pt-4 md:pt-6">
          <HeroSection />
        </div>
        <ProblemSolutionSection />
        <ProcessTimelineSection />
        <TentTypesSection />
        <FeaturedProductsSection />
        {calculatorEnabled ? <PriceCalculatorSection /> : null}
        <PortfolioSection />
        <WhyUsSection />
        <ReviewsSection />
        <BlogPreviewSection />
        <MapFormSection />
      </main>
      <SiteFooter />
    </>
  )
}
