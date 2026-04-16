/** Origin API (пусто в dev при прокси Vite: запросы идут на тот же хост). */
export function apiOrigin(): string {
  return (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '')
}

export function staffApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${apiOrigin()}${p}`
}

/**
 * Классическая Django Admin (Unfold), обычно на том же хосте, что и API.
 * Задайте VITE_DJANGO_CLASSIC_ADMIN_URL, если вход не на /admin API-сервера.
 */
export function djangoClassicAdminUrl(): string {
  const raw = import.meta.env.VITE_DJANGO_CLASSIC_ADMIN_URL
  if (typeof raw === 'string' && raw.trim()) return raw.replace(/\/$/, '')
  const api = apiOrigin()
  if (api) return `${api}/admin`
  return 'http://127.0.0.1:18100/admin'
}
