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
  const startedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const mountScript = () => {
      if (startedRef.current) return
      startedRef.current = true
      el.replaceChildren()
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.charset = 'utf-8'
      script.async = true
      script.src = scriptSrc
      el.appendChild(script)
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          mountScript()
          io.disconnect()
        }
      },
      { rootMargin: '200px 0px' },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      el.replaceChildren()
      startedRef.current = false
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
