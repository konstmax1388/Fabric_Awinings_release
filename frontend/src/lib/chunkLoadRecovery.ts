/**
 * После выкладки новой сборки старый index.html может ссылаться на удалённые чанки /assets/*.js.
 * Vite шлёт vite:preloadError; в Safari/Chrome иногда только unhandledrejection с текстом про dynamic import.
 */
const STORAGE_KEY = 'fabric:chunk-reload-at'
const MIN_MS_BETWEEN_RELOADS = 4000

function tryReload(reason: string): void {
  const now = Date.now()
  const last = Number(sessionStorage.getItem(STORAGE_KEY) || '0')
  if (now - last < MIN_MS_BETWEEN_RELOADS) return
  sessionStorage.setItem(STORAGE_KEY, String(now))
  console.warn('[fabric] reloading after chunk load failure:', reason)
  window.location.reload()
}

function isChunkLoadMessage(msg: string): boolean {
  return /Failed to fetch dynamically imported module|Loading chunk \d+ failed|ChunkLoadError|Importing a module script failed|error loading dynamically imported module/i.test(
    msg,
  )
}

export function installChunkLoadRecovery(): void {
  if (typeof window === 'undefined') return
  const w = window as Window & { __fabricChunkRecovery?: boolean }
  if (w.__fabricChunkRecovery) return
  w.__fabricChunkRecovery = true

  window.addEventListener('vite:preloadError', () => tryReload('vite:preloadError'))

  window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
    const r = ev.reason
    const msg =
      r && typeof r === 'object' && 'message' in r && typeof (r as Error).message === 'string'
        ? (r as Error).message
        : String(r ?? '')
    if (isChunkLoadMessage(msg)) {
      ev.preventDefault()
      tryReload('unhandledrejection')
    }
  })
}
