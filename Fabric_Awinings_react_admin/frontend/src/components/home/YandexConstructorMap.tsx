import { useEffect, useRef } from 'react'

type Props = {
  scriptSrc: string
  /** Для доступности (регион без iframe). */
  title: string
  /** Из query height= в URL конструктора, иначе классы по умолчанию. */
  minHeightPx?: number
}

/**
 * Виджет конструктора Яндекс.Карт (script), не путать с iframe map-widget.
 */
export function YandexConstructorMap({ scriptSrc, title, minHeightPx }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.replaceChildren()
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.charset = 'utf-8'
    script.async = true
    script.src = scriptSrc
    el.appendChild(script)
    return () => {
      el.replaceChildren()
    }
  }, [scriptSrc])

  return (
    <div
      ref={ref}
      role="region"
      aria-label={title}
      className="w-full min-h-[320px] border-0 md:min-h-[400px]"
      style={minHeightPx ? { minHeight: minHeightPx } : undefined}
    />
  )
}
