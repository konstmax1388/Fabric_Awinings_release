import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartLine } from '../cart/cartTypes'
import { CartContext } from '../cart/cartContext'
import type { Product, ProductVariantRow } from '../data/products'

const STORAGE_KEY = 'fabric-awnings-cart-v1'

function lineIdFor(productId: string, variantId?: string): string {
  return variantId ? `${productId}::v${variantId}` : productId
}

function sanitizeCartLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return []
  const out: CartLine[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const productId = r.productId
    const slug = r.slug
    const title = r.title
    const qty = typeof r.qty === 'number' ? r.qty : Number(r.qty)
    const priceFrom = typeof r.priceFrom === 'number' ? r.priceFrom : Number(r.priceFrom)
    const image = typeof r.image === 'string' ? r.image : ''
    const variantId =
      typeof r.variantId === 'string' && r.variantId.trim() ? r.variantId.trim() : undefined
    const lineId =
      typeof r.lineId === 'string' && r.lineId.trim()
        ? r.lineId.trim()
        : lineIdFor(
            typeof productId === 'string' ? productId : '',
            variantId,
          )
    if (
      typeof productId !== 'string' ||
      typeof slug !== 'string' ||
      typeof title !== 'string' ||
      !Number.isFinite(qty) ||
      qty < 1 ||
      !Number.isFinite(priceFrom) ||
      priceFrom < 0
    ) {
      continue
    }
    out.push({
      lineId,
      productId,
      variantId,
      slug,
      title,
      priceFrom,
      image,
      qty: Math.min(99, Math.floor(qty)),
    })
  }
  return out
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown
        return sanitizeCartLines(parsed)
      }
    } catch {
      /* ignore */
    }
    return []
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* ignore */
    }
  }, [items])

  const addProduct = useCallback((product: Product, qty = 1, variant?: ProductVariantRow) => {
    const q = Math.min(99, Math.max(1, Math.floor(qty)))
    const lid = lineIdFor(product.id, variant?.id)
    const title = variant?.label
      ? `${product.title} (${variant.label})`
      : product.title
    const priceFrom = variant ? variant.priceFrom : product.priceFrom
    const image = variant?.images?.[0] ?? product.images[0] ?? ''
    setItems((prev) => {
      const i = prev.findIndex((l) => l.lineId === lid)
      if (i >= 0) {
        const next = [...prev]
        next[i] = { ...next[i], qty: Math.min(99, next[i].qty + q) }
        return next
      }
      return [
        ...prev,
        {
          lineId: lid,
          productId: product.id,
          variantId: variant?.id,
          slug: product.slug,
          title,
          priceFrom,
          image,
          qty: q,
        },
      ]
    })
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((l) => l.lineId !== lineId))
  }, [])

  const setQty = useCallback((lineId: string, qty: number) => {
    const q = Math.min(99, Math.max(1, Math.floor(qty)))
    setItems((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, qty: q } : l)))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const totalQty = useMemo(() => items.reduce((s, l) => s + l.qty, 0), [items])
  const totalApprox = useMemo(
    () => items.reduce((s, l) => s + l.priceFrom * l.qty, 0),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      addProduct,
      removeLine,
      setQty,
      clear,
      totalQty,
      totalApprox,
    }),
    [items, addProduct, removeLine, setQty, clear, totalQty, totalApprox],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
