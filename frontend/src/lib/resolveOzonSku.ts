import type { Product } from '../data/products'

/** Эффективный Ozon SKU для строки корзины: с варианта, иначе с товара. */
export function resolveOzonSkuForCartLine(product: Product, variantId?: string): number | undefined {
  if (variantId && product.variants?.length) {
    const v = product.variants.find((x) => x.id === variantId)
    if (v?.ozonSku != null && v.ozonSku > 0) return Math.floor(v.ozonSku)
  }
  if (product.ozonSku != null && product.ozonSku > 0) return Math.floor(product.ozonSku)
  return undefined
}
