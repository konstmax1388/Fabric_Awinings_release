import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'

const SHOW_AFTER_PX = 380

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goUp = useCallback(() => {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [reduce])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          initial={reduce ? false : { opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, scale: 0.85, y: 8 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="fixed bottom-5 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 bg-surface text-accent shadow-lg shadow-accent/15 ring-1 ring-border-light/80 transition hover:bg-accent hover:text-surface hover:shadow-accent/25 md:bottom-8 md:right-8 md:h-14 md:w-14"
          aria-label="Наверх"
          onClick={goUp}
        >
          <svg className="h-6 w-6 md:h-7 md:w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </motion.button>
      ) : null}
    </AnimatePresence>
  )
}
