import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'

export function NotFoundPage() {
  return (
    <>
      <SiteHeader />
      <main className="fabric-page">
        <div className="fabric-page-main min-w-0 overflow-x-clip py-24 text-center">
        <h1 className="fabric-section-title text-5xl">404</h1>
        <p className="mt-4 font-body text-text-muted">Страница не найдена.</p>
        <Link
          to="/"
          className="fabric-strap-btn mt-8 inline-flex h-12 items-center justify-center rounded-[40px] bg-accent px-8 font-body font-medium text-[#0d121c]"
        >
          На главную
        </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
