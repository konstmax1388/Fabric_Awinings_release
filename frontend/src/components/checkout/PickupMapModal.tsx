import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useId, useState } from 'react'

function buildOsmEmbedSrc(lat: number, lng: number): string {
  const pad = 0.012
  const bbox = `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`
}

type Props = {
  open: boolean
  onClose: () => void
  title: string
  address: string
  lat: number | null
  lng: number | null
}

/**
 * Модальное окно с картой (OpenStreetMap embed). Без перехода на внешние сайты.
 * Если координат нет — один запрос к Nominatim для приблизительной точки по адресу.
 */
export function PickupMapModal({ open, onClose, title, address, lat: latIn, lng: lngIn }: Props) {
  const headingId = useId()
  const reduce = useReducedMotion()
  const [geocoded, setGeocoded] = useState<{ lat: number; lng: number } | null>(null)
  const [geoPhase, setGeoPhase] = useState<'idle' | 'loading' | 'done'>('idle')

  const mapLat = latIn != null && lngIn != null ? latIn : geocoded?.lat ?? null
  const mapLng = latIn != null && lngIn != null ? lngIn : geocoded?.lng ?? null
  const iframeSrc = mapLat != null && mapLng != null ? buildOsmEmbedSrc(mapLat, mapLng) : null

  useEffect(() => {
    if (!open) {
      setGeocoded(null)
      setGeoPhase('idle')
      return
    }
    if (latIn != null && lngIn != null) {
      setGeoPhase('done')
      return
    }
    const q = address.trim()
    if (!q) {
      setGeoPhase('done')
      return
    }
    setGeoPhase('loading')
    let cancelled = false
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`, {
      headers: { 'Accept-Language': 'ru,ru-RU' },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: unknown) => {
        if (cancelled) return
        const row = Array.isArray(data) && data[0] && typeof data[0] === 'object' ? (data[0] as Record<string, unknown>) : null
        const la = row?.lat != null ? Number(row.lat) : NaN
        const ln = row?.lon != null ? Number(row.lon) : NaN
        if (Number.isFinite(la) && Number.isFinite(ln)) {
          setGeocoded({ lat: la, lng: ln })
        }
        setGeoPhase('done')
      })
      .catch(() => {
        if (!cancelled) setGeoPhase('done')
      })
    return () => {
      cancelled = true
    }
  }, [open, latIn, lngIn, address])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="presentation"
          initial={reduce ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default border-0 bg-[#1a1a1a]/55 backdrop-blur-[4px]"
            aria-label="Закрыть"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            className="relative z-[101] m-0 flex max-h-[min(92dvh,820px)] w-full max-w-[min(100dvw,720px)] flex-col overflow-hidden rounded-t-3xl border border-border-light bg-surface shadow-2xl sm:m-auto sm:max-w-[720px] sm:rounded-3xl"
            initial={reduce ? undefined : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border-light bg-gradient-to-r from-bg-base to-surface px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 id={headingId} className="font-heading text-lg font-semibold text-text sm:text-xl">
                  {title || 'Как добраться'}
                </h2>
                {address.trim() ? (
                  <p className="mt-1 font-body text-sm leading-relaxed text-text-muted">{address.trim()}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-light text-text-muted transition hover:bg-bg-base hover:text-text"
                aria-label="Закрыть окно"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="relative min-h-[min(52dvh,420px)] flex-1 bg-[#e8e4df]">
              {geoPhase === 'loading' ? (
                <div className="flex h-[min(52dvh,420px)] flex-col items-center justify-center gap-3 px-6">
                  <span className="h-9 w-9 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden />
                  <p className="text-center font-body text-sm text-text-muted">Ищем точку на карте…</p>
                </div>
              ) : iframeSrc ? (
                <iframe
                  title="Карта пункта выдачи"
                  src={iframeSrc}
                  className="h-[min(52dvh,420px)] w-full border-0 sm:h-[420px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex h-[min(52dvh,420px)] flex-col items-center justify-center gap-2 px-6 text-center">
                  <p className="font-body text-sm text-text-muted">
                    Не удалось показать карту. Укажите широту и долготу пункта в настройках сайта или проверьте адрес.
                  </p>
                </div>
              )}
            </div>

            <p className="border-t border-border-light bg-bg-base/90 px-5 py-3 text-center font-body text-[11px] text-text-subtle sm:px-6">
              Данные карты: OpenStreetMap
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
