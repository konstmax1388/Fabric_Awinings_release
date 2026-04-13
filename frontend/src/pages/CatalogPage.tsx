import { Helmet } from 'react-helmet-async'
import { motion, useReducedMotion } from 'framer-motion'
import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/catalog/ProductCard'
import { OptimizedImage } from '../components/ui/OptimizedImage'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { useSiteSettings } from '../context/SiteSettingsContext'
import type { Product, ProductCategory } from '../data/products'
import {
  PAGE_SIZE,
  SORT_LABELS,
  type CatalogSortId,
} from '../lib/catalog-utils'
import { fetchProductCategories, fetchProductsPage, type Paginated, type ProductCategoryRow } from '../lib/api'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../lib/motion-presets'

function parseCategory(raw: string | null): ProductCategory | null {
  if (!raw || !/^[a-z0-9-]{1,64}$/i.test(raw)) return null
  return raw
}

function parseSort(raw: string | null): CatalogSortId {
  const allowed: CatalogSortId[] = ['popular', 'price-asc', 'price-desc', 'name', 'newest']
  return raw && allowed.includes(raw as CatalogSortId) ? (raw as CatalogSortId) : 'popular'
}

function parsePage(raw: string | null): number {
  const n = parseInt(raw ?? '1', 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

export function CatalogPage() {
  const [search, setSearch] = useSearchParams()
  const reduce = useReducedMotion()
  const { catalogIntro } = useSiteSettings()

  const category = parseCategory(search.get('category'))
  const sort = parseSort(search.get('sort'))
  const page = parsePage(search.get('page'))

  const [data, setData] = useState<Paginated<Product> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryRows, setCategoryRows] = useState<ProductCategoryRow[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchProductCategories().then((rows) => {
      if (!cancelled) setCategoryRows(rows ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    startTransition(() => {
      setLoading(true)
      setError(null)
    })
    fetchProductsPage({ page, category, sort, pageSize: PAGE_SIZE }).then((res) => {
      if (cancelled) return
      if (!res) {
        setData(null)
        setError('Не удалось загрузить каталог. Попробуйте обновить страницу позже.')
      } else {
        setData(res)
        setError(null)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [page, category, sort])

  const setParams = useCallback(
    (patch: { category?: ProductCategory | null; sort?: CatalogSortId; page?: number }) => {
      const next = new URLSearchParams(search)
      if (patch.category === undefined) {
        /* skip */
      } else if (patch.category === null) {
        next.delete('category')
      } else {
        next.set('category', patch.category)
      }
      if (patch.sort !== undefined) next.set('sort', patch.sort)
      if (patch.page !== undefined) {
        if (patch.page <= 1) next.delete('page')
        else next.set('page', String(patch.page))
      }
      setSearch(next, { replace: true })
    },
    [search, setSearch],
  )

  const total = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const slice = data?.results ?? []

  useEffect(() => {
    if (data && page > totalPages && totalPages >= 1) {
      setParams({ page: totalPages })
    }
  }, [data, page, totalPages, setParams])

  const showPager = useMemo(() => totalPages > 1 && !loading && !error, [totalPages, loading, error])

  return (
    <>
      <Helmet>
        <title>Каталог — Фабрика Тентов</title>
        <meta
          name="description"
          content="Каталог тентов, навесов и шатров: фильтр по категории, сортировка, цены «от»."
        />
      </Helmet>
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
        <motion.div
          initial={reduce ? false : fadeUpHidden}
          animate={reduce ? undefined : fadeUpVisible}
          transition={easeOutSoft}
        >
          <nav className="font-body text-sm text-text-muted">
            <Link to="/" className="hover:text-accent">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <span className="text-text">Каталог</span>
          </nav>
          <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-text md:text-5xl">
            Каталог
          </h1>
          <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">{catalogIntro}</p>
        </motion.div>

        <div className="mt-10 flex flex-col gap-10 lg:flex-row">
          <aside className="shrink-0 lg:w-56">
            <p className="font-body text-sm font-semibold text-text">Категория</p>
            <ul className="mt-3 flex flex-col gap-1 font-body text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => setParams({ category: null, page: 1 })}
                  className={`w-full rounded-xl px-3 py-2 text-left transition hover:bg-[#F5F0E8] ${
                    !category ? 'bg-[#F5F0E8] font-medium text-text' : 'text-text-muted'
                  }`}
                >
                  Все
                </button>
              </li>
              {categoryRows === null ? (
                <li className="px-3 py-2 font-body text-sm text-text-muted">Категории…</li>
              ) : (
                categoryRows.map((c) => (
                  <li key={c.slug}>
                    <button
                      type="button"
                      onClick={() => setParams({ category: c.slug, page: 1 })}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-[#F5F0E8] ${
                        category === c.slug ? 'bg-[#F5F0E8] font-medium text-text' : 'text-text-muted'
                      }`}
                    >
                      {c.imageUrl ? (
                        <OptimizedImage
                          src={c.imageUrl}
                          alt=""
                          widths={[64, 128, 160]}
                          sizes="36px"
                          className="h-9 w-9 shrink-0 rounded-lg object-cover"
                        />
                      ) : null}
                      <span className="min-w-0 flex-1">{c.title}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-body text-sm text-text-muted">
                {loading
                  ? 'Загрузка…'
                  : error
                    ? error
                    : `Показано ${slice.length} из ${total}`}
              </p>
              <label className="flex items-center gap-2 font-body text-sm text-text">
                <span className="text-text-muted">Сортировка</span>
                <select
                  value={sort}
                  onChange={(e) => setParams({ sort: e.target.value as CatalogSortId, page: 1 })}
                  className="h-11 rounded-xl border border-border bg-surface px-3 font-body text-text outline-none focus:border-accent"
                  disabled={loading}
                >
                  {(Object.keys(SORT_LABELS) as CatalogSortId[]).map((id) => (
                    <option key={id} value={id}>
                      {SORT_LABELS[id]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error && (
              <p className="mt-6 font-body text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <motion.div
              className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              key={`${category ?? 'all'}-${sort}-${currentPage}`}
            >
              {slice.map((p) => (
                <motion.div key={p.id} variants={staggerItem}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>

            {!loading && !error && slice.length === 0 && (
              <p className="mt-10 font-body text-text-muted">В этой категории пока нет позиций.</p>
            )}

            {showPager && (
              <nav
                className="mt-10 flex flex-wrap items-center justify-center gap-2"
                aria-label="Страницы каталога"
              >
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setParams({ page: currentPage - 1 })}
                  className="min-h-[44px] rounded-full border border-border px-4 font-body text-sm disabled:opacity-40 hover:border-accent"
                >
                  Назад
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setParams({ page: n })}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-full font-body text-sm ${
                      n === currentPage
                        ? 'bg-accent text-surface'
                        : 'border border-border hover:border-accent'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setParams({ page: currentPage + 1 })}
                  className="min-h-[44px] rounded-full border border-border px-4 font-body text-sm disabled:opacity-40 hover:border-accent"
                >
                  Вперёд
                </button>
              </nav>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
