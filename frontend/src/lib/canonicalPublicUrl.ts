/**
 * Канонический абсолютный URL для витрины (Яндекс/Google): общий origin + путь + «очищенный» query.
 */

/** Параметры, не меняющие смысл страницы — из канонического URL убираем (дубли с рекламы/меток). */
export const TRACKING_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'utm_id',
  'gclid',
  'fbclid',
  'yclid',
  '_openstat',
  'from',
  'dm_i',
  'roistat_visit',
])

/** Стабильная строка query: без трекинга, ключи по алфавиту. Пустая строка или «?a=1&b=2». */
export function normalizeQueryForCanonical(search: string): string {
  const raw = (search || '').trim()
  if (!raw || raw === '?') return ''
  const qs = raw.startsWith('?') ? raw.slice(1) : raw
  const incoming = new URLSearchParams(qs)
  const out = new URLSearchParams()
  const keys = [...new Set([...incoming.keys()])]
    .filter((k) => k && !TRACKING_QUERY_PARAMS.has(k))
    .sort()
  for (const k of keys) {
    for (const v of incoming.getAll(k)) {
      if (v !== '') out.append(k, v)
    }
  }
  const s = out.toString()
  return s ? `?${s}` : ''
}

export function defaultCanonicalHref(siteBase: string, pathname: string, search: string): string {
  const base = siteBase.replace(/\/$/, '')
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  const q = normalizeQueryForCanonical(search)
  return `${base}${path}${q}`
}

/**
 * Абсолютный каноникал из админки/товара: полный URL или путь от корня сайта.
 * При несовпадении хоста с витриной возвращает fallback.
 */
export function absolutizeCustomCanonical(
  siteBase: string,
  custom: string | null | undefined,
  fallback: string,
): string {
  const t = typeof custom === 'string' ? custom.trim() : ''
  if (!t) return fallback
  const base = siteBase.replace(/\/$/, '')
  if (t.startsWith('http://') || t.startsWith('https://')) {
    try {
      const u = new URL(t)
      const b = new URL(`${base}/`)
      if (u.hostname !== b.hostname) return fallback
      const q = normalizeQueryForCanonical(u.search)
      return `${u.origin}${u.pathname}${q}`
    } catch {
      return fallback
    }
  }
  const path = t.startsWith('/') ? t : `/${t}`
  return `${base}${path}`
}
