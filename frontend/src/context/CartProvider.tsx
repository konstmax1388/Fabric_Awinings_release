import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartLine } from '../cart/cartTypes'
import { CartContext } from '../cart/cartContext'
import type { Product } from '../data/products'

const STORAGE_KEY = 'fabric-awnings-cart-v1'

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
      productId,
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

  const addProduct = useCallback((product: Product, qty = 1) => {
    const q = Math.min(99, Math.max(1, Math.floor(qty)))
    setItems((prev) => {
      const i = prev.findIndex((l) => l.productId === product.id)
      if (i >= 0) {
        const next = [...prev]
        next[i] = { ...next[i], qty: Math.min(99, next[i].qty + q) }
        return next
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          title: product.title,
          priceFrom: product.priceFrom,
          image: product.images[0] ?? '',
          qty: q,
        },
      ]
    })
  }, [])

  const removeLine = useCallback((productId: string) => {
    setItems((prev) => prev.filter((l) => l.productId !== productId))
  }, [])

  const setQty = useCallback((productId: string, qty: number) => {
    const q = Math.min(99, Math.max(1, Math.floor(qty)))
    setItems((prev) => prev.map((l) => (l.productId === productId ? { ...l, qty: q } : l)))
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
