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
import { PurchasePathsSection } from '../components/home/PurchasePathsSection'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { publicSiteUrl } from '../config/publicSite'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { orderedVisibleHomeSectionIds, type HomeSectionId } from '../lib/homePageLayout'

export function HomePage() {
  const site = publicSiteUrl()
  const { home, siteName, calculatorEnabled, portfolioEnabled, phone, address, seoDefaults } =
    useSiteSettings()
  const meta = home?.meta
  const sectionOrder = useMemo(
    () => orderedVisibleHomeSectionIds(home, { calculatorEnabled, portfolioEnabled }),
    [home, calculatorEnabled, portfolioEnabled],
  )

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

  const baseTitle = meta?.title ?? 'Фабрика Тентов — тенты, навесы, шатры'
  const pageTitle = seoDefaults.titleSuffix ? `${baseTitle} ${seoDefaults.titleSuffix}` : baseTitle
  const pageDesc =
    meta?.description?.trim() ||
    seoDefaults.defaultMetaDescription?.trim() ||
    'Изготовление и монтаж тентов для транспорта, складов, кафе и мероприятий. Каталог, конструктор тента, заявка онлайн.'

  const sectionById = (id: HomeSectionId) => {
    switch (id) {
      case 'hero':
        return (
          <div key="hero" className="pt-4 md:pt-6">
            <HeroSection />
          </div>
        )
      case 'purchasePaths':
        return <PurchasePathsSection key="purchasePaths" />
      case 'problemSolution':
        return <ProblemSolutionSection key="problemSolution" />
      case 'processTimeline':
        return <ProcessTimelineSection key="processTimeline" />
      case 'tentTypes':
        return <TentTypesSection key="tentTypes" />
      case 'featured':
        return <FeaturedProductsSection key="featured" />
      case 'calculator':
        return <PriceCalculatorSection key="calculator" />
      case 'portfolio':
        return <PortfolioSection key="portfolio" />
      case 'whyUs':
        return <WhyUsSection key="whyUs" />
      case 'reviews':
        return <ReviewsSection key="reviews" mode="teaser" />
      case 'blog':
        return <BlogPreviewSection key="blog" />
      case 'mapForm':
        return <MapFormSection key="mapForm" />
      default:
        return null
    }
  }

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
      <main className="fabric-page min-w-0 overflow-x-clip">{sectionOrder.map(sectionById)}</main>
      <SiteFooter />
    </>
  )
}
