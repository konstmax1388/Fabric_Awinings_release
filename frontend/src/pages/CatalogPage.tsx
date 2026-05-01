import { Helmet } from 'react-helmet-async'
import { motion, useReducedMotion } from 'framer-motion'
import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CatalogSpecFilters } from '../components/catalog/CatalogSpecFilters'
import { ProductCard } from '../components/catalog/ProductCard'
import { OptimizedImage } from '../components/ui/OptimizedImage'
import { catalogCategoryFilterAlt } from '../lib/imageAlt'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { publicSiteUrl } from '../config/publicSite'
import type { Product, ProductCategory } from '../data/products'
import {
  PAGE_SIZE,
  SORT_LABELS,
  parseCatalogSpecFiltersFromSearchParams,
  type CatalogSortId,
} from '../lib/catalog-utils'
import {
  fetchCatalogFilterFacets,
  fetchProductCategories,
  fetchProductsPage,
  type CatalogFilterFacetKey,
  type Paginated,
  type ProductCategoryRow,
} from '../lib/api'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../lib/motion-presets'
import { buildSeoTitle, truncateMetaDescription } from '../lib/seoVitrine'

/** Слаг категории с API: только латиница, цифры, `_` и `-` (без кириллицы в URL). */
function parseCategory(raw: string | null): ProductCategory | null {
  if (!raw) return null
  const v = raw.trim()
  if (!v || v.length > 128) return null
  if (!/^[a-z0-9_-]+$/i.test(v)) return null
  return v
}

function parseSort(raw: string | null): CatalogSortId {
  const allowed: CatalogSortId[] = ['popular', 'price-asc', 'price-desc', 'name', 'newest']
  return raw && allowed.includes(raw as CatalogSortId) ? (raw as CatalogSortId) : 'popular'
}

function parsePage(raw: string | null): number {
  const n = parseInt(raw ?? '1', 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

function parseSearch(raw: string | null): string {
  if (!raw) return ''
  return raw.trim().slice(0, 120)
}

function buildPageWindow(current: number, total: number): Array<number | 'ellipsis-left' | 'ellipsis-right'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) out.push('ellipsis-left')
  for (let n = start; n <= end; n += 1) out.push(n)
  if (end < total - 1) out.push('ellipsis-right')
  out.push(total)
  return out
}

function CatalogSkeletonGrid() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border-light bg-surface p-4 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.08)]">
          <div className="skeleton-shimmer aspect-[4/3] rounded-xl" />
          <div className="mt-4 skeleton-shimmer h-4 w-1/3 rounded" />
          <div className="mt-2 skeleton-shimmer h-5 w-5/6 rounded" />
          <div className="mt-2 skeleton-shimmer h-4 w-full rounded" />
          <div className="mt-1 skeleton-shimmer h-4 w-4/5 rounded" />
          <div className="mt-4 skeleton-shimmer h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function CatalogPage() {
  const [search, setSearch] = useSearchParams()
  const reduce = useReducedMotion()
  const { catalogIntro, seoDefaults, siteName } = useSiteSettings()
  const site = publicSiteUrl()

  const category = parseCategory(search.get('category'))
  const sort = parseSort(search.get('sort'))
  const page = parsePage(search.get('page'))
  const searchTerm = parseSearch(search.get('search'))
  const specFilterMap = useMemo(
    () => parseCatalogSpecFiltersFromSearchParams(search),
    [search],
  )
  const searchKey = useMemo(() => search.toString(), [search])

  /** Убираем из адреса устаревший `?category=` с кириллицей после смены слагов на латиницу. */
  useEffect(() => {
    const raw = search.get('category')
    if (!raw || parseCategory(raw) !== null) return
    const next = new URLSearchParams(search)
    next.delete('category')
    setSearch(next, { replace: true })
  }, [search, setSearch])

  const [data, setData] = useState<Paginated<Product> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryRows, setCategoryRows] = useState<ProductCategoryRow[] | null>(null)
  const [filterFacets, setFilterFacets] = useState<CatalogFilterFacetKey[] | null>(null)

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
    setFilterFacets(null)
    fetchCatalogFilterFacets({ category: category ?? undefined }).then((rows) => {
      if (!cancelled) setFilterFacets(rows)
    })
    return () => {
      cancelled = true
    }
  }, [category])

  useEffect(() => {
    let cancelled = false
    startTransition(() => {
      setLoading(true)
      setError(null)
    })
    fetchProductsPage({
      page,
      category,
      sort,
      search: searchTerm,
      pageSize: PAGE_SIZE,
      specFilters: specFilterMap,
    }).then((res) => {
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
  }, [searchKey])

  const setParams = useCallback(
    (patch: {
      category?: ProductCategory | null
      sort?: CatalogSortId
      page?: number
      search?: string
      specFilters?: Map<number, string[]>
    }) => {
      const next = new URLSearchParams(search)
      if (patch.category !== undefined) {
        if (patch.category === null) {
          next.delete('category')
        } else {
          next.set('category', patch.category)
        }
        for (const k of [...next.keys()]) {
          if (k.startsWith('f_')) next.delete(k)
        }
      }
      if (patch.sort !== undefined) next.set('sort', patch.sort)
      if (patch.search !== undefined) {
        const normalized = patch.search.trim()
        if (normalized) next.set('search', normalized)
        else next.delete('search')
      }
      if (patch.specFilters !== undefined) {
        for (const k of [...next.keys()]) {
          if (k.startsWith('f_')) next.delete(k)
        }
        for (const [id, values] of patch.specFilters) {
          for (const v of values) {
            const t = v.trim()
            if (t) next.append(`f_${id}`, t)
          }
        }
      }
      if (patch.page !== undefined) {
        if (patch.page <= 1) next.delete('page')
        else next.set('page', String(patch.page))
      } else if (patch.specFilters !== undefined || patch.category !== undefined) {
        next.delete('page')
      }
      setSearch(next, { replace: true })
    },
    [search, setSearch],
  )

  const onSpecFilterToggle = useCallback(
    (keyId: number, value: string, nextSelected: boolean) => {
      const m = new Map(specFilterMap)
      const cur = [...(m.get(keyId) ?? [])]
      if (nextSelected) {
        if (!cur.some((x) => (x || '').toLowerCase() === value.toLowerCase())) {
          cur.push(value)
        }
        m.set(keyId, cur)
      } else {
        const nextVals = cur.filter((x) => (x || '').toLowerCase() !== value.toLowerCase())
        if (nextVals.length) m.set(keyId, nextVals)
        else m.delete(keyId)
      }
      setParams({ specFilters: m, page: 1 })
    },
    [setParams, specFilterMap],
  )

  const onSpecFilterClear = useCallback(() => {
    setParams({ specFilters: new Map(), page: 1 })
  }, [setParams])

  const total = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const slice = data?.results ?? []
  const pageWindow = useMemo(() => buildPageWindow(currentPage, totalPages), [currentPage, totalPages])

  useEffect(() => {
    if (data && page > totalPages && totalPages >= 1) {
      setParams({ page: totalPages })
    }
  }, [data, page, totalPages, setParams])

  const showPager = useMemo(() => totalPages > 1 && !loading && !error, [totalPages, loading, error])

  const catPageTitle = buildSeoTitle('listing', { title: 'Каталог', siteName }, seoDefaults)
  const catPageDesc = truncateMetaDescription(
    seoDefaults.defaultMetaDescription?.trim() ||
      'Каталог тентов, навесов и шатров: фильтр по категории, сортировка, цены «от».',
    undefined,
    seoDefaults,
  )
  const tw = seoDefaults.twitterCard || 'summary_large_image'

  return (
    <>
      <Helmet>
        <title>{catPageTitle}</title>
        <meta name="description" content={catPageDesc} />
        {!seoDefaults.allowIndexing ? <meta name="robots" content="noindex, nofollow" /> : null}
        <link rel="canonical" href={`${site}/catalog`} />
        <meta name="twitter:card" content={tw} />
        {seoDefaults.ogImageUrl ? <meta name="twitter:image" content={seoDefaults.ogImageUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${site}/catalog`} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={catPageTitle} />
        <meta property="og:description" content={catPageDesc} />
        <meta property="og:locale" content={seoDefaults.locale.replace('_', '-')} />
        {seoDefaults.ogImageUrl ? <meta property="og:image" content={seoDefaults.ogImageUrl} /> : null}
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <div className="fabric-page-main min-w-0 overflow-x-clip">
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
          <h1 className="fabric-section-title mt-4">
            Каталог
          </h1>
          <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">{catalogIntro}</p>
        </motion.div>

        <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-start">
          <aside className="fabric-card shrink-0 self-start p-4 lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] lg:w-56 lg:p-5">
            <p className="font-body text-sm font-semibold text-text">Категория</p>
            <ul className="mt-3 flex flex-col gap-1 font-body text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => setParams({ category: null, page: 1 })}
                  className={`w-full rounded-xl px-3 py-2 text-left transition hover:bg-primary/80 ${
                    !category ? 'bg-primary/80 font-medium text-text' : 'text-text-muted'
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
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-primary/80 ${
                        category === c.slug ? 'bg-primary/80 font-medium text-text' : 'text-text-muted'
                      }`}
                    >
                      {c.imageUrl ? (
                        <OptimizedImage
                          src={c.imageUrl}
                          alt={catalogCategoryFilterAlt(c.title)}
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
            <CatalogSpecFilters
              facets={filterFacets}
              specFilters={specFilterMap}
              onToggleValue={onSpecFilterToggle}
              onClear={onSpecFilterClear}
            />
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <p className="font-body text-sm text-text-muted">
                  {loading
                    ? 'Загрузка…'
                    : error
                      ? error
                      : `Показано ${slice.length} из ${total}`}
                </p>
                <label className="flex min-w-0 flex-1 items-center gap-2 font-body text-sm text-text sm:max-w-md">
                  <span className="text-text-muted">Поиск</span>
                  <input
                    value={searchTerm}
                    onChange={(e) => setParams({ search: e.target.value, page: 1 })}
                    placeholder="Название или артикул"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 font-body text-text outline-none focus:border-accent"
                  />
                </label>
              </div>
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
              className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              key={searchKey}
            >
              {slice.map((p) => (
                <motion.div key={p.id} variants={staggerItem}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
            {loading && <CatalogSkeletonGrid />}

            {!loading && !error && slice.length === 0 && (
              <div className="fabric-card mt-10 border-dashed px-6 py-10 text-center">
                <p className="font-heading text-xl font-semibold text-text">Пока пусто в этой категории</p>
                <p className="mt-2 font-body text-sm text-text-muted">
                  {specFilterMap.size
                    ? 'Снимите лишние значения в блоке «Параметры» слева или сбросьте фильтры.'
                    : 'Попробуйте открыть другую категорию или сбросить фильтр до «Все».'}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  {specFilterMap.size > 0 ? (
                    <button
                      type="button"
                      onClick={onSpecFilterClear}
                      className="inline-flex h-11 items-center justify-center rounded-[40px] border border-border px-6 font-body text-sm font-medium text-text transition hover:border-accent hover:text-accent"
                    >
                      Сбросить параметры
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setParams({ category: null, page: 1 })}
                    className="inline-flex h-11 items-center justify-center rounded-[40px] border border-border px-6 font-body text-sm font-medium text-text transition hover:border-accent hover:text-accent"
                  >
                    Показать все товары
                  </button>
                </div>
              </div>
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
                {pageWindow.map((item, idx) =>
                  typeof item === 'number' ? (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setParams({ page: item })}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-full font-body text-sm ${
                        item === currentPage
                          ? 'bg-accent text-surface'
                          : 'border border-border hover:border-accent'
                      }`}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={`${item}-${idx}`} className="px-2 font-body text-sm text-text-muted">
                      ...
                    </span>
                  ),
                )}
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
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
