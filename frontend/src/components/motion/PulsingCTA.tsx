import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/** Пульс scale 1 → 1.05 → 1 каждые 5 с (отключается при prefers-reduced-motion) */
export function PulsingCTA({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <span className={`inline-flex ${className}`}>{children}</span>
  }

  return (
    <motion.span
      className={`inline-flex ${className}`}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
        times: [0, 0.5, 1],
      }}
    >
      {children}
    </motion.span>
  )
}
