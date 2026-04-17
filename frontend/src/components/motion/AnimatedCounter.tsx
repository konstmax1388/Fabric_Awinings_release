import { animate, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

type Props = {
  value: number
  suffix?: string
  prefix?: string
  className?: string
  duration?: number
  delay?: number
}

/** Счётчик 0 → value при появлении во вьюпорте */
export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  className = '',
  duration = 1.6,
  delay = 0,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.12, 0.84, 0.18, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [delay, duration, inView, value])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}
