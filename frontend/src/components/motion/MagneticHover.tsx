import { motion, useReducedMotion } from 'framer-motion'
import { useRef, useState } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  radius?: number
  strength?: number
}

/** Лёгкое "притягивание" кнопки к курсору в небольшом радиусе. */
export function MagneticHover({
  children,
  className = '',
  radius = 145,
  strength = 0.19,
}: Props) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const [xy, setXy] = useState({ x: 0, y: 0 })

  if (reduce) return <span className={className}>{children}</span>

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.hypot(dx, dy)
    if (dist > radius) {
      setXy({ x: 0, y: 0 })
      return
    }
    setXy({ x: dx * strength, y: dy * strength })
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      animate={{ x: xy.x, y: xy.y }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, mass: 0.62 }}
      onMouseMove={onMove}
      onMouseLeave={() => setXy({ x: 0, y: 0 })}
    >
      {children}
    </motion.span>
  )
}
