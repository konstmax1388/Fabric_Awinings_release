import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartLine } from '../cart/cartTypes'
import { CartContext } from '../cart/cartContext'
import type { Product, ProductVariantRow } from '../data/products'
import { resolveCartLineImage } from '../lib/cartLineImage'
import { fetchProductBySlug } from '../lib/api'

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
    const productId =
      typeof r.productId === 'string' ? r.productId : r.productId != null ? String(r.productId) : ''
    const slug = typeof r.slug === 'string' ? r.slug : r.slug != null ? String(r.slug) : ''
    const title = typeof r.title === 'string' ? r.title : r.title != null ? String(r.title) : ''
    const qty = typeof r.qty === 'number' ? r.qty : Number(r.qty)
    const priceFrom = typeof r.priceFrom === 'number' ? r.priceFrom : Number(r.priceFrom)
    const image = typeof r.image === 'string' ? r.image.trim() : ''
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

  const imageEnrichmentKey = useMemo(
    () =>
      items
        .filter((l) => !(l.image || '').trim() && l.slug)
        .map((l) => `${l.lineId}\0${l.slug}\0${l.variantId ?? ''}`)
        .sort()
        .join('|'),
    [items],
  )

  useEffect(() => {
    if (!imageEnrichmentKey) return
    let cancelled = false
    const entries = imageEnrichmentKey.split('|').map((part) => {
      const [lineId, slug, vid = ''] = part.split('\0')
      return { lineId, slug, variantId: vid || undefined }
    })
    const slugSet = [...new Set(entries.map((e) => e.slug))]

    ;(async () => {
      const products = new Map<string, Product | null>()
      await Promise.all(
        slugSet.map(async (slug) => {
          const p = await fetchProductBySlug(slug)
          if (!cancelled) products.set(slug, p)
        }),
      )
      if (cancelled) return
      setItems((prev) => {
        let changed = false
        const next = prev.map((line) => {
          if ((line.image || '').trim()) return line
          if (!entries.some((e) => e.lineId === line.lineId)) return line
          const p = products.get(line.slug)
          if (!p) return line
          const img = resolveCartLineImage(p, line.variantId)
          if (!img) return line
          changed = true
          return { ...line, image: img }
        })
        return changed ? next : prev
      })
    })()

    return () => {
      cancelled = true
    }
  }, [imageEnrichmentKey])

  const addProduct = useCallback((product: Product, qty = 1, variant?: ProductVariantRow) => {
    const q = Math.min(99, Math.max(1, Math.floor(qty)))
    const lid = lineIdFor(product.id, variant?.id)
    const title = variant?.label
      ? `${product.title} (${variant.label})`
      : product.title
    const priceFrom = variant ? variant.priceFrom : product.priceFrom
    const rawImg = variant?.images?.[0] ?? product.images[0] ?? ''
    const image = typeof rawImg === 'string' ? rawImg.trim() : ''
    setItems((prev) => {
      const i = prev.findIndex((l) => l.lineId === lid)
      if (i >= 0) {
        const next = [...prev]
        const img = (next[i].image || '').trim() || (typeof image === 'string' ? image.trim() : '')
        next[i] = { ...next[i], qty: Math.min(99, next[i].qty + q), image: img }
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

  const mergeLinesFromOrder = useCallback((rawLines: unknown[]) => {
    const parsed = sanitizeCartLines(rawLines)
    if (!parsed.length) return 0
    setItems((prev) => {
      const next = [...prev]
      for (const line of parsed) {
        const i = next.findIndex((l) => l.lineId === line.lineId)
        if (i >= 0) {
          const mergedImg = (next[i].image || '').trim() || (line.image || '').trim() || ''
          next[i] = { ...next[i], qty: Math.min(99, next[i].qty + line.qty), image: mergedImg }
        } else {
          next.push(line)
        }
      }
      return next
    })
    return parsed.length
  }, [])

  const totalQty = useMemo(() => items.reduce((s, l) => s + l.qty, 0), [items])
  const totalApprox = useMemo(
    () => items.reduce((s, l) => s + l.priceFrom * l.qty, 0),
    [items],
  )

  const value = useMemo(
    () => ({
      items,
      addProduct,
      mergeLinesFromOrder,
      removeLine,
      setQty,
      clear,
      totalQty,
      totalApprox,
    }),
    [items, addProduct, mergeLinesFromOrder, removeLine, setQty, clear, totalQty, totalApprox],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
