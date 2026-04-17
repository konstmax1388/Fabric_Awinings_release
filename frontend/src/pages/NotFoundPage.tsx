import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'

export function NotFoundPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-w-0 max-w-[1280px] overflow-x-clip px-4 py-24 text-center md:px-6">
        <h1 className="font-heading text-4xl font-bold text-text">404</h1>
        <p className="mt-4 font-body text-text-muted">Страница не найдена.</p>
        <Link
          to="/"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-[40px] bg-accent px-8 font-body font-medium text-surface"
        >
          На главную
        </Link>
      </main>
      <SiteFooter />
    </>
  )
}
