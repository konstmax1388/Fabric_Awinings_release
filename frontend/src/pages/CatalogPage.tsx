import { motion, useReducedMotion } from 'framer-motion'
import { useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/catalog/ProductCard'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import {
  CATEGORY_LABELS,
  MOCK_PRODUCTS,
  type ProductCategory,
} from '../data/products'
import {
  PAGE_SIZE,
  SORT_LABELS,
  filterProducts,
  paginate,
  sortProducts,
  type CatalogSortId,
} from '../lib/catalog-utils'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../lib/motion-presets'

const CATEGORIES: ProductCategory[] = ['truck', 'warehouse', 'cafe', 'events']

function parseCategory(raw: string | null): ProductCategory | null {
  if (!raw) return null
  return CATEGORIES.includes(raw as ProductCategory) ? (raw as ProductCategory) : null
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

  const category = parseCategory(search.get('category'))
  const sort = parseSort(search.get('sort'))
  const page = parsePage(search.get('page'))

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

  const filtered = useMemo(() => filterProducts(MOCK_PRODUCTS, category), [category])
  const sorted = useMemo(() => sortProducts(filtered, sort), [filtered, sort])
  const { slice, totalPages, page: currentPage, total } = useMemo(
    () => paginate(sorted, page, PAGE_SIZE),
    [sorted, page],
  )

  return (
    <>
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
          <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">
            Тенты, навесы и шатры. Фильтры и сортировка — мок-данные до подключения API.
          </p>
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
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => setParams({ category: c, page: 1 })}
                    className={`w-full rounded-xl px-3 py-2 text-left transition hover:bg-[#F5F0E8] ${
                      category === c ? 'bg-[#F5F0E8] font-medium text-text' : 'text-text-muted'
                    }`}
                  >
                    {CATEGORY_LABELS[c]}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-body text-sm text-text-muted">
                Показано {slice.length} из {total}
              </p>
              <label className="flex items-center gap-2 font-body text-sm text-text">
                <span className="text-text-muted">Сортировка</span>
                <select
                  value={sort}
                  onChange={(e) => setParams({ sort: e.target.value as CatalogSortId, page: 1 })}
                  className="h-11 rounded-xl border border-border bg-surface px-3 font-body text-text outline-none focus:border-accent"
                >
                  {(Object.keys(SORT_LABELS) as CatalogSortId[]).map((id) => (
                    <option key={id} value={id}>
                      {SORT_LABELS[id]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

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

            {totalPages > 1 && (
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
