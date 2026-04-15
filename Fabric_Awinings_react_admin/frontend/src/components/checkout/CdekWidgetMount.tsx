import { useEffect, useRef, useState } from 'react'

const SCRIPT_ID = 'fabric-cdek-widget-script-v3'

declare global {
  interface Window {
    CDEKWidget?: new (config: Record<string, unknown>) => {
      updateLocation?: (v: string | number[]) => void
    }
  }
}

function loadCdekScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing?.src === src) {
      if (window.CDEKWidget) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('CDEK script')), { once: true })
      return
    }
    if (existing) existing.remove()
    const s = document.createElement('script')
    s.id = SCRIPT_ID
    s.async = true
    s.charset = 'utf-8'
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('CDEK script load failed'))
    document.head.appendChild(s)
  })
}

/** Дождаться отрисовки лейаута: у Яндекс.Карт в iframe иногда «белый экран», если init до известных размеров контейнера. */
function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 120)
      })
    })
  })
}

export type CdekWidgetParcel = { width: number; height: number; length: number; weight: number }

/**
 * Виджет СДЭК v3: https://github.com/cdek-it/widget/wiki/Установка-3.0
 *
 * defaultMapLocation — город/адрес для центра карты (лучше совпадает с полем «Город» на checkout).
 */
export function CdekWidgetMount({
  scriptUrl,
  apiKey,
  servicePath,
  fromCity,
  defaultMapLocation,
  rootId,
  goods,
  onChoose,
}: {
  scriptUrl: string
  apiKey: string
  servicePath: string
  fromCity: string
  /** Центр карты (строка города или координаты в терминах виджета); приоритет над fromCity для defaultLocation */
  defaultMapLocation: string
  rootId: string
  goods: CdekWidgetParcel[]
  onChoose: (mode: string, tariff: unknown, address: Record<string, unknown>) => void
}) {
  const widgetRef = useRef<unknown>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const goodsJson = JSON.stringify(goods)
  const mapFocus = defaultMapLocation.trim() || fromCity.trim() || 'Москва'

  useEffect(() => {
    const src = scriptUrl.trim()
    const key = apiKey.trim()
    const svc = servicePath.trim()
    if (!src || !key || !svc) return
    setInitError(null)

    let cancelled = false
    const parcels: CdekWidgetParcel[] = (() => {
      try {
        const p = JSON.parse(goodsJson) as CdekWidgetParcel[]
        return Array.isArray(p) && p.length ? p : [{ width: 20, height: 20, length: 30, weight: 3000 }]
      } catch {
        return [{ width: 20, height: 20, length: 30, weight: 3000 }]
      }
    })()

    ;(async () => {
      try {
        await loadCdekScript(src)
        if (cancelled || !window.CDEKWidget) return
        const root = document.getElementById(rootId)
        if (root) root.innerHTML = ''
        await waitForLayout()
        if (cancelled || !window.CDEKWidget) return

        widgetRef.current = new window.CDEKWidget({
          from: fromCity.trim() || 'Москва',
          root: rootId,
          apiKey: key,
          servicePath: svc,
          defaultLocation: mapFocus,
          goods: parcels,
          lang: 'rus',
          currency: 'RUB',
          onChoose: (mode: string, tariff: unknown, addr: unknown) => {
            if (addr && typeof addr === 'object') onChoose(mode, tariff, addr as Record<string, unknown>)
          },
        })
      } catch {
        setInitError(
          'Не удалось загрузить виджет СДЭК. Проверьте ключ Яндекс.Карт, ограничения HTTP Referrer и доступность API.',
        )
      }
    })()

    return () => {
      cancelled = true
      const root = document.getElementById(rootId)
      if (root) root.innerHTML = ''
      widgetRef.current = null
    }
  }, [scriptUrl, apiKey, servicePath, fromCity, mapFocus, rootId, goodsJson, onChoose])

  const missingKey = !apiKey.trim()
  const missingService = !servicePath.trim()

  return (
    <div className="mt-4 rounded-xl border border-border-light bg-bg-base p-4">
      {missingKey ? (
        <p className="font-body text-xs text-amber-800 dark:text-amber-200">
          Укажите ключ JavaScript API Яндекс.Карт в админке (Настройки сайта → оформление → СДЭК). Без ключа карта в
          виджете не загрузится.
        </p>
      ) : null}
      {missingService ? (
        <p className="mt-2 font-body text-xs text-amber-800 dark:text-amber-200">
          Не задан URL прокси виджета (servicePath). Обычно он подставляется автоматически; проверьте{' '}
          <code className="rounded bg-surface px-1">VITE_API_URL</code> и доступность API с браузера.
        </p>
      ) : null}
      {!missingKey && !missingService ? (
        <>
          <p className="font-body text-xs leading-relaxed text-text-muted">
            Выберите ПВЗ или доставку до двери; код и адрес ПВЗ подставятся в поля ниже (можно изменить вручную).
          </p>
        </>
      ) : null}
      {initError ? <p className="mt-2 font-body text-xs text-red-700">{initError}</p> : null}
      {/*
        Важно: явная высота в px (не только min-h) — иначе движок карты в iframe может отрисовать пустой белый холст.
        isolate + z-0 — отдельный слой композиции, меньше глюков WebGL.
      */}
      <div
        id={rootId}
        className="relative isolate z-0 mt-3 h-[420px] w-full min-h-[420px] overflow-hidden rounded-lg border border-border-light bg-[#e8e5df] sm:h-[480px] sm:min-h-[480px]"
      />
    </div>
  )
}
