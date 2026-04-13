import { apiBase } from './api'

/** Относительный путь под /media/ из абсолютного URL (любой хост). */
export function mediaPathFromAbsoluteUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  try {
    const u = new URL(url, 'http://localhost')
    const mark = '/media/'
    const idx = u.pathname.indexOf(mark)
    if (idx === -1) return null
    return decodeURIComponent(u.pathname.slice(idx + mark.length))
  } catch {
    return null
  }
}

export function canOptimizeMediaUrl(url: string): boolean {
  const p = mediaPathFromAbsoluteUrl(url)
  if (!p) return false
  const lower = p.toLowerCase()
  if (lower.endsWith('.svg')) return false
  return true
}

/** URL превью через API (WebP/JPEG). */
export function imageVariantUrl(
  originalAbsoluteUrl: string,
  opts: { w: number; format?: 'webp' | 'jpeg' },
): string | null {
  const path = mediaPathFromAbsoluteUrl(originalAbsoluteUrl)
  if (!path) return null
  const f = opts.format ?? 'webp'
  const q = new URLSearchParams({ path, w: String(opts.w), f })
  return `${apiBase()}/api/image-variant/?${q.toString()}`
}

export function imageVariantSrcSet(
  originalAbsoluteUrl: string,
  widths: number[],
  format: 'webp' | 'jpeg' = 'webp',
): string {
  const parts: string[] = []
  for (const w of widths) {
    const u = imageVariantUrl(originalAbsoluteUrl, { w, format })
    if (u) parts.push(`${u} ${w}w`)
  }
  return parts.join(', ')
}
