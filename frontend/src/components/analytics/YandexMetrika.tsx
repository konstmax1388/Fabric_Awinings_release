import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'

declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: unknown[]) => void
  }
}

const TAG_SRC = 'https://mc.yandex.ru/metrika/tag.js'

/**
 * Яндекс Метрика из настроек сайта (номер счётчика в админке).
 */
export function YandexMetrika() {
  const { analyticsYandex, loading } = useSiteSettings()
  const location = useLocation()

  useEffect(() => {
    if (loading) return
    const { enabled, counterId } = analyticsYandex
    if (!enabled || !counterId || !/^\d+$/.test(counterId)) return
    const id = Number(counterId)
    if (!Number.isFinite(id)) return

    const init = () => {
      window.ym?.(id, 'init', {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true,
      })
    }

    const existing = document.querySelector(`script[src="${TAG_SRC}"]`)
    if (existing) {
      init()
      return
    }

    const s = document.createElement('script')
    s.async = true
    s.src = TAG_SRC
    s.onload = init
    document.head.appendChild(s)
  }, [loading, analyticsYandex.enabled, analyticsYandex.counterId])

  useEffect(() => {
    if (loading) return
    const { enabled, counterId } = analyticsYandex
    if (!enabled || !counterId || !/^\d+$/.test(counterId)) return
    const id = Number(counterId)
    if (!Number.isFinite(id) || typeof window.ym !== 'function') return
    const url = `${location.pathname}${location.search}${location.hash}`
    window.ym(id, 'hit', url)
  }, [
    loading,
    analyticsYandex.enabled,
    analyticsYandex.counterId,
    location.pathname,
    location.search,
    location.hash,
  ])

  if (loading || !analyticsYandex.enabled || !/^\d+$/.test(analyticsYandex.counterId)) {
    return null
  }

  const id = analyticsYandex.counterId
  return (
    <noscript>
      <div>
        <img
          src={`https://mc.yandex.ru/watch/${id}`}
          style={{ position: 'absolute', left: '-9999px' }}
          alt=""
        />
      </div>
    </noscript>
  )
}
