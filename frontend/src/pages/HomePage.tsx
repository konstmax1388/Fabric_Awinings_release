import { Helmet } from 'react-helmet-async'
import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
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

export function HomePage() {
  const reduce = useReducedMotion()
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
      <main className="fabric-page min-w-0 overflow-x-clip">
        {showFirstVisitPromo ? (
          <section className="fabric-container pt-4 md:pt-6">
            <motion.div
              className="fabric-producer-note fabric-liquid-glass relative px-4 py-4 text-sm text-text md:px-5 md:py-4 md:text-base"
              initial={reduce ? false : { opacity: 0, y: -10, scale: 0.985 }}
              animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/22 blur-2xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-10 left-1/3 h-24 w-24 rounded-full bg-primary/40 blur-2xl"
              />
              <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-5">
                <p className="relative flex items-start gap-3 font-body md:items-center">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/35 bg-accent/20 text-xs font-semibold text-accent md:mt-0">
                    ★
                  </span>
                  <span className="leading-relaxed">
                    Вы на сайте производителя: цены здесь ниже, чем у нас же на маркетплейсах.
                  </span>
                </p>
                <button
                  type="button"
                  onClick={dismissFirstVisitPromo}
                  className="fabric-strap-btn fabric-liquid-glass-soft relative inline-flex h-10 items-center justify-center rounded-full border-accent/35 px-5 font-body text-sm font-semibold text-accent transition duration-300 hover:-translate-y-0.5 hover:bg-accent hover:text-[#0d121c] hover:shadow-[0_10px_20px_-12px_rgba(200,155,83,0.9)]"
                >
                  Понятно
                </button>
              </div>
            </motion.div>
          </section>
        ) : null}
        <div className="pt-4 md:pt-6">
          <HeroSection />
        </div>
        <PurchasePathsSection />
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
