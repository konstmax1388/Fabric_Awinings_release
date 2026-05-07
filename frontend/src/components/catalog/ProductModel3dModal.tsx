import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  onClose: () => void
  /** Абсолютный URL .glb */
  modelSrc: string
  title: string
}

type ModelLoadState = 'idle' | 'loading' | 'loaded' | 'error'

/** none → fade: ждём кадр с opacity 1, затем плавное скрытие; gone — оверлей снят с DOM */
type OverlayExit = 'none' | 'fade' | 'gone'

const VIEWER_MIN_H = 'min(70vh, 560px)'

/**
 * Полноэкранная модалка с интерактивной 3D-моделью (@google/model-viewer).
 * Пакет подгружается динамически при первом открытии; до готовности модели — понятный индикатор.
 */
export function ProductModel3dModal({ open, onClose, modelSrc, title }: Props) {
  const [viewerReady, setViewerReady] = useState(false)
  const [modelState, setModelState] = useState<ModelLoadState>('idle')
  const [modelProgress, setModelProgress] = useState(0)
  const [overlayExit, setOverlayExit] = useState<OverlayExit>('none')
  const viewerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) {
      setViewerReady(false)
      setModelState('idle')
      setModelProgress(0)
      setOverlayExit('none')
      return
    }
    let cancelled = false
    void import('@google/model-viewer').then(() => {
      if (!cancelled) setViewerReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open || !viewerReady) return
    const el = viewerRef.current
    if (!el) return

    setModelState('loading')
    setModelProgress(0)
    setOverlayExit('none')

    const onProgress = (e: Event) => {
      const ce = e as CustomEvent<{ totalProgress?: number }>
      const p = ce.detail?.totalProgress
      if (typeof p === 'number' && Number.isFinite(p)) {
        setModelProgress(Math.max(0, Math.min(1, p)))
      }
    }

    const onLoad = () => {
      setModelProgress(1)
      setModelState('loaded')
    }

    const onError = () => {
      setModelState('error')
    }

    el.addEventListener('progress', onProgress)
    el.addEventListener('load', onLoad)
    el.addEventListener('error', onError)

    return () => {
      el.removeEventListener('progress', onProgress)
      el.removeEventListener('load', onLoad)
      el.removeEventListener('error', onError)
    }
  }, [open, viewerReady, modelSrc])

  useEffect(() => {
    if (modelState !== 'loaded') {
      setOverlayExit('none')
      return
    }
    let a = 0
    let b = 0
    a = window.requestAnimationFrame(() => {
      b = window.requestAnimationFrame(() => setOverlayExit('fade'))
    })
    return () => {
      window.cancelAnimationFrame(a)
      window.cancelAnimationFrame(b)
    }
  }, [modelState])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const bundlePhase = !viewerReady
  const showBlockingOverlay =
    !viewerReady || modelState !== 'loaded' || overlayExit !== 'gone'

  const pctLabel = Math.round(modelProgress * 100)
  const ringCirc = 2 * Math.PI * 18
  const dashOffset = ringCirc * (1 - (bundlePhase ? 0.28 : modelProgress))

  return createPortal(
    <div
      className="fixed inset-0 z-[560] flex items-center justify-center bg-black/65 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Трёхмерная модель: ${title}`}
      aria-busy={modelState === 'loading' || bundlePhase}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex max-h-[min(92vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border-light bg-surface shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-border-light px-4 py-3">
          <p className="min-w-0 truncate font-heading text-base font-semibold text-text">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-border px-4 font-body text-sm text-text transition hover:border-accent hover:text-accent"
          >
            Закрыть
          </button>
        </div>
        <div
          className="relative w-full overflow-hidden bg-[#121820]"
          style={{ minHeight: VIEWER_MIN_H }}
        >
          {viewerReady ? (
            <model-viewer
              ref={viewerRef}
              src={modelSrc}
              alt={title}
              camera-controls
              touch-action="pan-y"
              shadow-intensity={1}
              exposure={1}
              environment-image="https://modelviewer.dev/shared-assets/environments/aircraft_workshop_01_1k.hdr"
              auto-rotate
              style={{ width: '100%', height: VIEWER_MIN_H, display: 'block' }}
            />
          ) : null}

          {showBlockingOverlay ? (
            <div
              className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[#0c1016]/88 px-6 backdrop-blur-[3px] transition-opacity duration-500 ease-out ${
                overlayExit === 'fade' || overlayExit === 'gone'
                  ? 'pointer-events-none opacity-0'
                  : 'opacity-100'
              }`}
              aria-live="polite"
              onTransitionEnd={(e) => {
                if (e.propertyName !== 'opacity') return
                if (modelState === 'loaded' && overlayExit === 'fade') setOverlayExit('gone')
              }}
            >
              <div
                className={`relative flex size-[4.5rem] items-center justify-center ${
                  bundlePhase ? 'motion-safe:animate-spin' : ''
                }`}
              >
                <svg
                  className={bundlePhase ? 'opacity-90' : ''}
                  width="72"
                  height="72"
                  viewBox="0 0 44 44"
                  aria-hidden
                >
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    className="stroke-white/[0.12]"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="stroke-[color:var(--color-accent)] transition-[stroke-dashoffset] duration-300 ease-out"
                    style={{
                      strokeDasharray: ringCirc,
                      strokeDashoffset: bundlePhase ? ringCirc * 0.72 : dashOffset,
                      transform: 'rotate(-90deg)',
                      transformOrigin: '22px 22px',
                    }}
                  />
                </svg>
              </div>
              <div className="max-w-[20rem] text-center">
                {modelState === 'error' ? (
                  <>
                    <p className="font-body text-sm font-medium text-[color:var(--color-text)]">
                      Не удалось загрузить модель
                    </p>
                    <p className="mt-1 font-body text-xs leading-relaxed text-text-muted">
                      Проверьте соединение и попробуйте снова. Если проблема останется, откройте страницу позже.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-body text-sm font-medium tracking-wide text-white/92">
                      {bundlePhase ? 'Подготовка просмотра' : 'Загрузка модели'}
                    </p>
                    <p className="mt-1.5 font-body text-xs text-white/48">
                      {bundlePhase
                        ? 'Совсем скоро можно вращать и рассматривать детали'
                        : 'Пожалуйста, подождите — учитываем размер файла'}
                    </p>
                    {!bundlePhase ? (
                      <>
                        <p className="mt-2 font-body text-[0.7rem] tabular-nums tracking-widest text-[color:var(--color-accent)]/90">
                          {pctLabel}%
                        </p>
                        {modelState === 'loading' ? (
                          <div
                            className="mx-auto mt-4 h-0.5 w-full max-w-[11rem] overflow-hidden rounded-full bg-white/10"
                            aria-hidden
                          >
                            <div
                              className="h-full rounded-full bg-[color:var(--color-accent)] transition-[width] duration-300 ease-out"
                              style={{ width: `${pctLabel}%` }}
                            />
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
        <p className="border-t border-border-light px-4 py-2 font-body text-xs text-text-muted">
          Вращение — перетаскиванием; масштаб — колёсико мыши или жест на сенсоре.
        </p>
      </div>
    </div>,
    document.body,
  )
}
