import type { Product, ProductCategory } from '../data/products'

export type CatalogSortId = 'popular' | 'price-asc' | 'price-desc' | 'name' | 'newest'

export const SORT_LABELS: Record<CatalogSortId, string> = {
  popular: 'По популярности',
  'price-asc': 'Сначала дешевле',
  'price-desc': 'Сначала дороже',
  name: 'По названию',
  newest: 'Сначала новые',
}

const PAGE_SIZE = 9

export function filterProducts(
  products: Product[],
  category: ProductCategory | null,
): Product[] {
  if (!category) return products
  return products.filter((p) => p.category === category)
}

export function sortProducts(products: Product[], sort: CatalogSortId): Product[] {
  const copy = [...products]
  switch (sort) {
    case 'price-asc':
      return copy.sort((a, b) => a.priceFrom - b.priceFrom)
    case 'price-desc':
      return copy.sort((a, b) => b.priceFrom - a.priceFrom)
    case 'name':
      return copy.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
    case 'newest':
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    case 'popular':
    default:
      return copy.sort((a, b) => b.priceFrom - a.priceFrom)
  }
}

export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    slice: items.slice(start, start + pageSize),
    totalPages,
    page: safePage,
    pageSize,
    total: items.length,
  }
}

export { PAGE_SIZE }
