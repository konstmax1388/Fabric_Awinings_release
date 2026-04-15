import { staffApiUrl } from './apiBase'

/** Публичный URL для превью по относительному пути в MEDIA (после загрузки). */
export function staffMediaPublicUrl(relativePath: string): string {
  const clean = relativePath.trim().replace(/^\/+/, '')
  if (!clean) return ''
  return staffApiUrl(`/media/${clean.split('/').map(encodeURIComponent).join('/')}`)
}
