import { animate, useInView, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

type NumericSpec = { target: number; format: (n: number) => string }

function parseFactValue(raw: string): NumericSpec | null {
  const t = (raw || '').trim()
  if (!t) return null
  if (/^[\d\s]+$/.test(t)) {
    const target = parseInt(t.replace(/\s/g, ''), 10)
    if (!Number.isFinite(target)) return null
    return {
      target,
      format: (n: number) =>
        Math.round(n)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
    }
  }
  const m = t.match(/^(\d+)(.*)$/)
  if (m) {
    const target = parseInt(m[1] || '', 10)
    const suffix = m[2] ?? ''
    if (!Number.isFinite(target)) return null
    return {
      target,
      format: (n: number) => `${Math.round(n)}${suffix}`,
    }
  }
  return null
}

type Props = {
  value: string
  className?: string
}

export function AboutFactValue({ value, className }: Props) {
  const ref = useRef<HTMLParagraphElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-8%' })
  const reduceMotion = useReducedMotion()
  const spec = useMemo(() => parseFactValue(value), [value])
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!spec) return
    if (reduceMotion) {
      setN(spec.target)
      return
    }
    if (!isInView) return
    const controls = animate(0, spec.target, {
      duration: 1.15,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setN(v),
    })
    return () => {
      controls.stop()
    }
  }, [isInView, reduceMotion, spec])

  if (!spec) {
    return (
      <p ref={ref} className={className}>
        {value}
      </p>
    )
  }

  return (
    <p ref={ref} className={className}>
      {spec.format(n)}
    </p>
  )
}
