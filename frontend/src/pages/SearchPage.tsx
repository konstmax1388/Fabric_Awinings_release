import { Helmet } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { Form, Link, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/catalog/ProductCard'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { publicSiteUrl } from '../config/publicSite'
import type { Product } from '../data/products'
import { fetchProductsPage, type Paginated } from '../lib/api'
import { easeOutSoft, fadeUpHidden, fadeUpVisible } from '../lib/motion-presets'
import { motion, useReducedMotion } from 'framer-motion'

export function SearchPage() {
  const [sp, setSp] = useSearchParams()
  const q0 = (sp.get('q') || '').trim().slice(0, 200)
  const { seoDefaults } = useSiteSettings()
  const site = publicSiteUrl()
  const reduce = useReducedMotion()
  const [qInput, setQInput] = useState(q0)
  const [data, setData] = useState<Paginated<Product> | null>(null)
  const [loading, setLoading] = useState(!!q0)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setQInput(q0)
  }, [q0])

  useEffect(() => {
    if (!q0) {
      setData(null)
      setLoading(false)
      setErr(null)
      return
    }
    let c = false
    setLoading(true)
    setErr(null)
    fetchProductsPage({ page: 1, search: q0, sort: 'popular', pageSize: 24 }).then((d) => {
      if (c) return
      if (!d) {
        setErr('Не удалось загрузить результаты')
        setData(null)
      } else {
        setData(d)
      }
      setLoading(false)
    })
    return () => {
      c = true
    }
  }, [q0])

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = qInput.trim()
    if (!t) {
      setSp({})
      return
    }
    setSp({ q: t })
  }

  const title = q0 ? `Поиск: ${q0}` : 'Поиск'
  const pageTitle = seoDefaults.titleSuffix ? `${title} ${seoDefaults.titleSuffix}` : title
  const canonical = `${site}/search${q0 ? `?q=${encodeURIComponent(q0)}` : ''}`

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={q0 ? `Результаты поиска «${q0}» в каталоге.` : 'Поиск товаров в каталоге.'} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <SiteHeader />
      <main className="fabric-page min-w-0">
        <div className="fabric-page-main min-w-0 max-w-6xl overflow-x-clip px-4 py-6 md:px-6 md:py-8">
          <nav className="font-body text-sm text-text-muted">
            <Link to="/" className="hover:text-accent">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <span className="text-text">Поиск</span>
          </nav>

          <h1 className="font-heading mt-4 text-2xl font-bold text-text md:text-3xl">Поиск товаров</h1>
          <Form
            onSubmit={onSearchSubmit}
            className="mt-6 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-stretch"
            role="search"
          >
            <label className="sr-only" htmlFor="search-q">
              Поисковый запрос
            </label>
            <input
              id="search-q"
              name="q"
              className="min-w-0 flex-1 rounded-2xl border border-border bg-surface px-4 py-3 font-body text-base text-text"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Название, артикул…"
              maxLength={200}
              autoComplete="off"
            />
            <button
              type="submit"
              className="fabric-strap-btn inline-flex h-12 shrink-0 items-center justify-center rounded-[40px] bg-accent px-8 font-body text-sm font-medium text-[#0d121c]"
            >
              Найти
            </button>
          </Form>

          {q0 ? (
            <p className="mt-3 font-body text-sm text-text-muted">
              Запрос: <span className="font-medium text-text">{q0}</span>
              {data?.count != null ? ` · ${data.count} ${data.count === 1 ? 'позиция' : 'позиций'}` : null}
            </p>
          ) : (
            <p className="mt-3 font-body text-sm text-text-muted">Введите запрос и нажмите «Найти».</p>
          )}

          {loading && q0 ? (
            <p className="mt-8 font-body text-text-muted">Загрузка…</p>
          ) : null}
          {err ? <p className="mt-6 font-body text-rose-600">{err}</p> : null}

          {!loading && q0 && data && data.results.length === 0 ? (
            <p className="mt-8 font-body text-text-muted">Ничего не найдено. Попробуйте другие слова или смотрите</p>
          ) : null}
          {!loading && q0 && data && data.results.length > 0 ? (
            <motion.div
              className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
              initial={reduce ? false : fadeUpHidden}
              animate={reduce ? undefined : fadeUpVisible}
              transition={easeOutSoft}
            >
              {data.results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </motion.div>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
