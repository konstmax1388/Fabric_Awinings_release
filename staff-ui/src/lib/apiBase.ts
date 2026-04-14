/** Origin API (пусто в dev при прокси Vite: запросы идут на тот же хост). */
export function apiOrigin(): string {
  return (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '')
}

export function staffApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${apiOrigin()}${p}`
}
