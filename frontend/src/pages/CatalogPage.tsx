import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'

export function CatalogPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-16 md:px-6">
        <h1 className="font-heading text-4xl font-bold text-text md:text-5xl">Каталог</h1>
        <p className="mt-4 max-w-xl font-body text-text-muted">
          Здесь будет сетка товаров, фильтры и сортировка (этап 4 по плану разработки).
        </p>
        <Link to="/" className="mt-8 inline-block font-medium text-accent hover:underline">
          ← На главную
        </Link>
      </main>
      <SiteFooter />
    </>
  )
}
