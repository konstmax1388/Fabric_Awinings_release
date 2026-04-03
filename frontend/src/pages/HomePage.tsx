import { Helmet } from 'react-helmet-async'
import { useEffect, useMemo } from 'react'
import { publicSiteUrl } from '../config/publicSite'
import { BlogPreviewSection } from '../components/home/BlogPreviewSection'
import { HeroSection } from '../components/home/HeroSection'
import { MapFormSection } from '../components/home/MapFormSection'
import { PortfolioSection } from '../components/home/PortfolioSection'
import { PriceCalculatorSection } from '../components/home/PriceCalculatorSection'
import { ProblemSolutionSection } from '../components/home/ProblemSolutionSection'
import { ReviewsSection } from '../components/home/ReviewsSection'
import { FeaturedProductsSection } from '../components/home/FeaturedProductsSection'
import { TentTypesSection } from '../components/home/TentTypesSection'
import { WhyUsSection } from '../components/home/WhyUsSection'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'

export function HomePage() {
  const site = publicSiteUrl()
  const orgJsonLd = useMemo(
    () =>
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Фабрика Тентов',
        url: site,
        description: 'Тенты, навесы, шатры и террасы под ключ.',
      }),
    [site],
  )

  useEffect(() => {
    if (window.location.hash === '#calculator') {
      window.setTimeout(() => {
        document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [])

  return (
    <>
      <Helmet>
        <title>Фабрика Тентов — тенты, навесы, шатры</title>
        <meta
          name="description"
          content="Изготовление и монтаж тентов для транспорта, складов, кафе и мероприятий. Каталог, калькулятор, заявка онлайн."
        />
        <link rel="canonical" href={`${site}/`} />
        <script type="application/ld+json">{orgJsonLd}</script>
      </Helmet>
      <SiteHeader />
      <main>
        <div className="px-0 pt-4 md:pt-6">
          <HeroSection />
        </div>
        <ProblemSolutionSection />
        <TentTypesSection />
        <FeaturedProductsSection />
        <PriceCalculatorSection />
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
