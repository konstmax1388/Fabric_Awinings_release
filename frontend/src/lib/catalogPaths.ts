import type { ProductCategory } from '../data/products'

/** Канонический URL листинга категории (SEO). */
export function catalogCategoryPath(slug: ProductCategory): string {
  return `/catalog/category/${encodeURIComponent(slug)}`
}
