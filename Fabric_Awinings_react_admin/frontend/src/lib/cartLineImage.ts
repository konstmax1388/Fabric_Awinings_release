import type { Product } from '../data/products'

/** Главное фото строки корзины: вариант или товар. */
export function resolveCartLineImage(product: Product, variantId?: string): string {
  const vid = (variantId ?? '').trim()
  if (vid && product.variants?.length) {
    const v = product.variants.find((x) => x.id === vid)
    const u = v?.images?.[0]
    if (u?.trim()) return u.trim()
  }
  const first = product.images[0]
  return typeof first === 'string' && first.trim() ? first.trim() : ''
}
