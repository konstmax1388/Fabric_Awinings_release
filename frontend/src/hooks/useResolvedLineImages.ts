import { useEffect, useMemo, useState } from 'react'
import { resolveCartLineImage } from '../lib/cartLineImage'
import { fetchProductBySlug } from '../lib/api'

/**
 * Подгружает URL превью для строк заказа без поля image (старые заказы / урезанный JSON).
 * `orderRef` сбрасывает кэш при переключении заказа.
 */
export function useResolvedLineImages(orderRef: string, lines: unknown[]): Record<number, string> {
  const fetchKey = useMemo(() => {
    return lines
      .map((ln, i) => {
        if (!ln || typeof ln !== 'object') return ''
        const o = ln as Record<string, unknown>
        if (typeof o.image === 'string' && o.image.trim()) return ''
        const slug = typeof o.slug === 'string' ? o.slug.trim() : ''
        if (!slug) return ''
        const vid = typeof o.variantId === 'string' ? o.variantId : ''
        return `${i}\0${slug}\0${vid}`
      })
      .filter(Boolean)
      .sort()
      .join('|')
  }, [lines])

  const [extra, setExtra] = useState<Record<number, string>>({})

  useEffect(() => {
    setExtra({})
  }, [orderRef])

  useEffect(() => {
    if (!fetchKey) return
    let cancelled = false
    const parts = fetchKey.split('|')
    const slugToIndices = new Map<string, { index: number; variantId?: string }[]>()
    for (const part of parts) {
      const [iStr, slug, vid = ''] = part.split('\0')
      const index = Number(iStr)
      if (!Number.isFinite(index) || !slug) continue
      const list = slugToIndices.get(slug) ?? []
      list.push({ index, variantId: vid || undefined })
      slugToIndices.set(slug, list)
    }

    ;(async () => {
      const out: Record<number, string> = {}
      await Promise.all(
        [...slugToIndices.entries()].map(async ([slug, targets]) => {
          const prod = await fetchProductBySlug(slug)
          if (cancelled || !prod) return
          for (const { index, variantId } of targets) {
            const u = resolveCartLineImage(prod, variantId)
            if (u) out[index] = u
          }
        }),
      )
      if (!cancelled) setExtra((prev) => ({ ...prev, ...out }))
    })()

    return () => {
      cancelled = true
    }
  }, [fetchKey])

  return extra
}
