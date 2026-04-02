import { useEffect, useState } from 'react'
import { BlogPreviewSection } from '../components/home/BlogPreviewSection'
import { HeroSection } from '../components/home/HeroSection'
import { MapFormSection } from '../components/home/MapFormSection'
import { PortfolioSection } from '../components/home/PortfolioSection'
import { PriceCalculatorSection } from '../components/home/PriceCalculatorSection'
import { ProblemSolutionSection } from '../components/home/ProblemSolutionSection'
import { ReviewsSection } from '../components/home/ReviewsSection'
import { TentTypesSection } from '../components/home/TentTypesSection'
import { WhyUsSection } from '../components/home/WhyUsSection'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { fetchHealth } from '../lib/api'

export function HomePage() {
  const [apiOk, setApiOk] = useState<boolean | null>(null)

  useEffect(() => {
    fetchHealth().then((d) => setApiOk(!!d?.status))
  }, [])

  useEffect(() => {
    if (window.location.hash === '#calculator') {
      window.setTimeout(() => {
        document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [])

  return (
    <>
      <SiteHeader />
      <main>
        <div className="px-0 pt-4 md:pt-6">
          <HeroSection />
        </div>
        {apiOk !== null && (
          <p className="mx-auto max-w-[1280px] px-4 py-2 text-center font-body text-xs text-text-subtle md:px-6">
            API: {apiOk ? 'подключено' : 'недоступно (проверьте контейнер api и VITE_API_URL)'}
          </p>
        )}
        <ProblemSolutionSection />
        <TentTypesSection />
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
