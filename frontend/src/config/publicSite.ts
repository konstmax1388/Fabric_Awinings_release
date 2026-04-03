/** Публичный origin сайта (канонические URL, sitemap). В проде задать VITE_SITE_URL. */
export function publicSiteUrl(): string {
  const raw = import.meta.env.VITE_SITE_URL?.trim()
  if (raw) return raw.replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return 'http://localhost:17300'
}
