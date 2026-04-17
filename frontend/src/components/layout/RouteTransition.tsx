import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

export function RouteTransition() {
  const location = useLocation()
  const reduce = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0, y: -10 }}
        transition={{ duration: 0.34, ease: [0.2, 1, 0.32, 1] }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}
