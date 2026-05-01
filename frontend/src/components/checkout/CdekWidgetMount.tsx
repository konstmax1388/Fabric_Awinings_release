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

/**
 * Для defaultLocation виджета v3: длинная подпись «Город, область» иногда ломает геокодер Яндекса — берём первую часть.
 * @see https://github.com/cdek-it/widget/wiki/Настройка-3.0
 */
function cityLineForWidgetMap(raw: string): string {
  const t = raw.trim()
  if (!t) return 'Москва'
  const first = t.split(',')[0]?.trim()
  return first || t
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
  tariffs,
  onChoose,
  mapMissingKeyHelp,
  mapMissingServiceHelp,
  mapInitFailedHelp,
}: {
  scriptUrl: string
  apiKey: string
  servicePath: string
  fromCity: string
  /** Центр карты (строка города или координаты в терминах виджета); приоритет над fromCity для defaultLocation */
  defaultMapLocation: string
  rootId: string
  goods: CdekWidgetParcel[]
  /** Ограничение тарифов виджета (пустой объект — не передаём, все тарифы). */
  tariffs?: { office?: number[]; door?: number[]; pickup?: number[] }
  onChoose: (mode: string, tariff: unknown, address: Record<string, unknown>) => void
  /** Текст, если не задан ключ карты (покупателю). */
  mapMissingKeyHelp: string
  /** Текст, если не задан сервис виджета (покупателю). */
  mapMissingServiceHelp: string
  /** Текст при ошибке инициализации карты (покупателю). */
  mapInitFailedHelp: string
}) {
  const widgetRef = useRef<unknown>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const goodsJson = JSON.stringify(goods)
  const tariffsJson = JSON.stringify(tariffs ?? {})
  const mapFocus = defaultMapLocation.trim() || fromCity.trim() || 'Москва'
  const mapLine = cityLineForWidgetMap(mapFocus)

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

        const sender = (fromCity.trim() || 'Москва').trim()
        let tariffCfg: Record<string, number[]> | undefined
        try {
          const t = JSON.parse(tariffsJson) as { office?: number[]; door?: number[]; pickup?: number[] }
          const tw: Record<string, number[]> = {}
          if (t?.office?.length) tw.office = t.office
          if (t?.door?.length) tw.door = t.door
          if (t?.pickup?.length) tw.pickup = t.pickup
          if (Object.keys(tw).length) tariffCfg = tw
        } catch {
          tariffCfg = undefined
        }
        widgetRef.current = new window.CDEKWidget({
          // Объект «откуда» стабильнее строки для API СДЭК (wiki: from — string|object).
          from: { country_code: 'RU', city: sender },
          root: rootId,
          apiKey: key,
          servicePath: svc,
          defaultLocation: mapLine,
          goods: parcels,
          ...(tariffCfg ? { tariffs: tariffCfg } : {}),
          lang: 'rus',
          currency: 'RUB',
          onChoose: (mode: string, tariff: unknown, addr: unknown) => {
            if (addr && typeof addr === 'object') onChoose(mode, tariff, addr as Record<string, unknown>)
          },
        })
      } catch {
        setInitError(mapInitFailedHelp)
      }
    })()

    return () => {
      cancelled = true
      const root = document.getElementById(rootId)
      if (root) root.innerHTML = ''
      widgetRef.current = null
    }
  }, [scriptUrl, apiKey, servicePath, fromCity, mapLine, rootId, goodsJson, tariffsJson, onChoose, mapInitFailedHelp])

  const missingKey = !apiKey.trim()
  const missingService = !servicePath.trim()

  return (
    <div className="mt-4 rounded-xl border border-border-light bg-bg-base p-4">
      {missingKey ? (
        <p className="font-body text-xs text-amber-800 dark:text-amber-200">{mapMissingKeyHelp}</p>
      ) : null}
      {missingService ? (
        <p className="mt-2 font-body text-xs text-amber-800 dark:text-amber-200">{mapMissingServiceHelp}</p>
      ) : null}
      {!missingKey && !missingService ? (
        <>
          <p className="font-body text-xs leading-relaxed text-text-muted">
            Выберите ПВЗ или доставку до двери
          </p>
        </>
      ) : null}
      {initError ? <p className="mt-2 font-body text-xs text-red-700">{initError}</p> : null}
      {/*
        По wiki cdek-it/widget: элемент root — без «лишней» блочной модели (рамки и т.д. только на обёртке),
        иначе карта Яндекса может не отрисоваться. Рекомендуемая высота ≥600px.
      */}
      <div className="relative mt-3 w-full min-w-0 overflow-hidden rounded-lg border border-border-light bg-[#e8e5df] sm:min-h-[600px] min-h-[520px] h-[520px] sm:h-[600px]">
        <div id={rootId} className="h-full w-full min-h-0" />
      </div>
    </div>
  )
}
