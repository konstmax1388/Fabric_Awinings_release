import type { Transition, Variants } from 'framer-motion'

export const easeOutSoft: Transition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] }

/** Fade-up для блоков при скролле */
export const fadeUpHidden = { opacity: 0, y: 20 }
export const fadeUpVisible = { opacity: 1, y: 0 }

/** Stagger ~100 ms для карточек */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
}

export const cardHoverTransition: Transition = { type: 'spring', stiffness: 400, damping: 25 }
