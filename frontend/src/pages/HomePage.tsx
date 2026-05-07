import { Helmet } from 'react-helmet-async'
import { useEffect, useMemo } from 'react'
import { BlogPreviewSection } from '../components/home/BlogPreviewSection'
import { HeroSection } from '../components/home/HeroSection'
import { MapFormSection } from '../components/home/MapFormSection'
import { PortfolioSection } from '../components/home/PortfolioSection'
import { PriceCalculatorSection } from '../components/home/PriceCalculatorSection'
import { ProblemSolutionSection } from '../components/home/ProblemSolutionSection'
import { ProcessTimelineSection } from '../components/home/ProcessTimelineSection'
import { PromotionsSection } from '../components/home/PromotionsSection'
import { ReviewsSection } from '../components/home/ReviewsSection'
import { FeaturedProductsSection } from '../components/home/FeaturedProductsSection'
import { TentTypesSection } from '../components/home/TentTypesSection'
import { WhyUsSection } from '../components/home/WhyUsSection'
import { PurchasePathsSection } from '../components/home/PurchasePathsSection'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { publicSiteUrl } from '../config/publicSite'
import { useCanonicalHrefForMeta } from '../context/CanonicalUrlContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { orderedVisibleHomeSectionIds, type HomeSectionId } from '../lib/homePageLayout'
import { buildSeoTitle, resolveMetaDescription } from '../lib/seoVitrine'

export function HomePage() {
  const site = publicSiteUrl()
  const { home, siteName, calculatorEnabled, portfolioEnabled, phone, address, seoDefaults } =
    useSiteSettings()
  const canonicalForMeta = useCanonicalHrefForMeta()
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
    const street = address?.trim() || undefined
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: meta?.orgName?.trim() || siteName,
      url: site,
      description: desc,
      telephone: phone?.trim() || undefined,
      address: street
        ? {
            '@type': 'PostalAddress',
            streetAddress: street,
            addressLocality: 'Кохма',
            addressRegion: 'Ивановская область',
            postalCode: '153550',
            addressCountry: 'RU',
          }
        : undefined,
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
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
  const pageTitle = buildSeoTitle('home', { title: baseTitle, siteName }, seoDefaults)
  const pageDesc = resolveMetaDescription(meta?.description, seoDefaults)
  const tw = seoDefaults.twitterCard || 'summary_large_image'

  const sectionById = (id: HomeSectionId) => {
    switch (id) {
      case 'hero':
        return (
          <div key="hero" className="pt-4 lg:pt-6">
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
      case 'promotions':
        return <PromotionsSection key="promotions" />
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
        <meta name="twitter:card" content={tw} />
        {seoDefaults.ogImageUrl ? <meta name="twitter:image" content={seoDefaults.ogImageUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalForMeta} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:locale" content={seoDefaults.locale.replace('_', '-')} />
        {seoDefaults.ogImageUrl ? <meta property="og:image" content={seoDefaults.ogImageUrl} /> : null}
        <script type="application/ld+json">{orgJsonLd}</script>
      </Helmet>
      <SiteHeader />
      <h1 className="sr-only">Производство тентов, навесов и чехлов в Иваново</h1>
      <main className="fabric-page min-w-0 overflow-x-clip">{sectionOrder.map(sectionById)}</main>
      <SiteFooter />
    </>
  )
}
