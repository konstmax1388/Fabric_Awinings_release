import type { CartLine } from '../cart/cartTypes'
import type { Product, ProductVariantRow } from '../data/products'

export type OrderLineApiPayload = {
  productId: string
  variantId: string
  slug: string
  title: string
  priceFrom: number
  /** База до акции (UI / локальные расчёты; в POST не уходит). */
  priceList?: number
  qty: number
  image: string
  ozonSku?: number
  cdekWeightGrams?: number | null
  cdekLengthCm?: number | null
  cdekWidthCm?: number | null
  cdekHeightCm?: number | null
}

/** Строки для POST /api/leads/one-click/ и /api/leads/cart/ (как в корзине, без lineId). */
export function orderLinesFromCartItems(items: CartLine[]): OrderLineApiPayload[] {
  return items.map((line) => {
    const row: OrderLineApiPayload = {
      productId: line.productId,
      variantId: line.variantId || '',
      slug: line.slug,
      title: line.title,
      priceFrom: line.priceFrom,
      qty: line.qty,
      image: line.image || '',
    }
    if (line.priceList != null && line.priceList > line.priceFrom) row.priceList = line.priceList
    if (line.ozonSku) row.ozonSku = line.ozonSku
    if (line.cdekWeightGrams) row.cdekWeightGrams = line.cdekWeightGrams
    if (line.cdekLengthCm) row.cdekLengthCm = line.cdekLengthCm
    if (line.cdekWidthCm) row.cdekWidthCm = line.cdekWidthCm
    if (line.cdekHeightCm) row.cdekHeightCm = line.cdekHeightCm
    return row
  })
}

export function orderLineFromProduct(
  product: Product,
  variant: ProductVariantRow | null,
  qty: number,
): OrderLineApiPayload {
  const v = variant ?? product.variants?.[0] ?? null
  const priceFrom = v ? v.priceFrom : product.priceFrom
  const priceListBase = v ? (v.priceList ?? v.priceFrom) : (product.priceList ?? product.priceFrom)
  const priceList = priceListBase > priceFrom ? priceListBase : undefined
  const mainImage = v?.images?.[0] || product.images[0] || ''
  return {
    productId: product.id,
    variantId: v ? v.id : '',
    slug: product.slug,
    title: product.title,
    priceFrom,
    ...(priceList !== undefined ? { priceList } : {}),
    qty,
    image: mainImage,
    cdekWeightGrams: product.cdekWeightGrams,
    cdekLengthCm: product.cdekLengthCm,
    cdekWidthCm: product.cdekWidthCm,
    cdekHeightCm: product.cdekHeightCm,
  }
}

export function subtotalFromOrderLines(lines: OrderLineApiPayload[]): number {
  return lines.reduce((s, l) => s + Math.max(0, l.priceFrom) * Math.max(1, l.qty), 0)
}
