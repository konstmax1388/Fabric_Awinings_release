import type { Transition, Variants } from 'framer-motion'

export const easeOutSoft: Transition = { duration: 0.82, ease: [0.2, 1, 0.32, 1] }
export const easeOutQuick: Transition = { duration: 0.42, ease: [0.2, 1, 0.32, 1] }
export const easeOutMicro: Transition = { duration: 0.2, ease: [0.2, 1, 0.32, 1] }

/** Fade-up для блоков при скролле */
export const fadeUpHidden = { opacity: 0, y: 20 }
export const fadeUpVisible = { opacity: 1, y: 0 }

/** Stagger для карточек (чуть более заметный ритм). */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.2, 1, 0.32, 1] },
  },
}

export const cardHoverTransition: Transition = { type: 'spring', stiffness: 320, damping: 20 }
export const subtleHoverLift = { y: -4, boxShadow: '0 16px 30px -12px rgba(0,0,0,0.14)' }
export const subtleButtonHover = { scale: 1.02 }
