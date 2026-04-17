import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

const INTRO_SEEN_KEY = 'fabric_intro_seen_v2'
const INTRO_REDUCED_DURATION_MS = 1600
const INTRO_FINISH_DELAY_MS = 1350

export function SiteIntroSplash({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return sessionStorage.getItem(INTRO_SEEN_KEY) !== '1'
    } catch {
      return true
    }
  })
  const [ready, setReady] = useState(() => typeof window === 'undefined')
  const [stageIdx, setStageIdx] = useState(0)
  const [isFinishing, setIsFinishing] = useState(false)

  useEffect(() => {
    try {
      if (visible) {
        sessionStorage.setItem(INTRO_SEEN_KEY, '1')
      }
    } catch {
      /* noop */
    }
    setReady(true)
  }, [visible])

  useEffect(() => {
    if (reduce && visible) {
      const t = window.setTimeout(() => setVisible(false), INTRO_REDUCED_DURATION_MS)
      return () => window.clearTimeout(t)
    }
  }, [reduce])

  useEffect(() => {
    if (!visible || !isFinishing) return
    const t = window.setTimeout(() => setVisible(false), reduce ? 700 : INTRO_FINISH_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [isFinishing, reduce, visible])

  useEffect(() => {
    if (!visible || reduce) return
    const marks = [0, 3200, 6500]
    setStageIdx(0)
    const timers = marks.map((ms, idx) => window.setTimeout(() => setStageIdx(idx), ms))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [reduce, visible])

  const stageTransition = useMemo(
    () => ({ duration: 1.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }),
    [],
  )

  return (
    <>
      <motion.div
        style={{ visibility: ready ? 'visible' : 'hidden' }}
        initial={false}
        animate={{ opacity: visible ? (isFinishing ? 1 : 0) : 1 }}
        transition={{ duration: reduce ? 0.35 : 1.15, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
      <AnimatePresence>
        {visible ? (
          <motion.div
            className="fixed inset-0 z-[400] flex items-center justify-center bg-[#0f0f10]"
            initial={{ opacity: 0 }}
            animate={{
              opacity: isFinishing ? 0 : 1,
              transition: {
                duration: isFinishing ? (reduce ? 0.55 : 1.15) : 0.95,
                ease: [0.22, 1, 0.36, 1],
              },
            }}
            exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.4, 0, 0.2, 1] } }}
            role="dialog"
            aria-label="Загрузка сайта"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(232,122,0,0.14),transparent_58%)]" />

            <motion.svg
              viewBox="0 0 1200 680"
              className="h-[min(74vh,520px)] w-[min(92vw,980px)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={stageTransition}
              aria-hidden
            >
              {/* blueprint grid */}
              {[180, 280, 380, 480].map((y, idx) => (
                <motion.path
                  key={`grid-h-${y}`}
                  d={`M140 ${y} L1060 ${y}`}
                  stroke="rgba(255,255,255,0.09)"
                  strokeWidth="1"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.25, delay: 0.15 + idx * 0.14, ease: 'easeInOut' }}
                />
              ))}
              {[220, 400, 580, 760, 940].map((x, idx) => (
                <motion.path
                  key={`grid-v-${x}`}
                  d={`M${x} 150 L${x} 560`}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, delay: 0.22 + idx * 0.12, ease: 'easeInOut' }}
                />
              ))}
              {/* contour line */}
              <motion.path
                d="M120 430 L360 430 L420 360 L620 360 L690 430 L1040 430"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.1, delay: 1.15, ease: 'easeInOut' }}
              />
              {/* transport unit */}
              <motion.rect
                x="165"
                y="460"
                width="165"
                height="46"
                rx="8"
                fill="none"
                stroke="rgba(255,255,255,0.26)"
                strokeWidth="2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.25, delay: 2.05 }}
              />
              <motion.circle
                cx="205"
                cy="513"
                r="10"
                fill="none"
                stroke="rgba(255,255,255,0.26)"
                strokeWidth="2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 2.35 }}
              />
              <motion.circle
                cx="295"
                cy="513"
                r="10"
                fill="none"
                stroke="rgba(255,255,255,0.26)"
                strokeWidth="2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 2.45 }}
              />
              {/* terrace frame */}
              <motion.path
                d="M470 520 L470 456 L620 456 L620 520"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.35, delay: 3.1 }}
              />
              {/* hangar arch */}
              <motion.path
                d="M815 520 C820 445, 1015 445, 1020 520"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 3.45 }}
              />
              <motion.path
                d="M180 510 L300 510 L340 455 L505 455 L540 510"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.95, delay: 3.8, ease: 'easeInOut' }}
              />
              <motion.path
                d="M730 520 L1050 520 L1080 460 L790 460 Z"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.05, delay: 4.1, ease: 'easeInOut' }}
              />

              {/* size marks */}
              <motion.path
                d="M175 548 L1035 548"
                stroke="rgba(255,255,255,0.24)"
                strokeWidth="1.2"
                strokeDasharray="8 8"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.1, delay: 5.2 }}
              />
              <motion.path
                d="M175 548 L175 520 M1035 548 L1035 520"
                stroke="rgba(255,255,255,0.24)"
                strokeWidth="1.2"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 5.65 }}
              />
              <motion.text
                x="605"
                y="540"
                textAnchor="middle"
                fill="rgba(255,255,255,0.58)"
                fontSize="16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 5.9 }}
              >
                12 400 mm
              </motion.text>

              <motion.path
                d="M170 420 C350 300, 650 270, 1040 420 L1040 570 L170 570 Z"
                fill="url(#fabricGradient)"
                initial={{ opacity: 0, y: -36, scaleY: 0.9 }}
                animate={{ opacity: 0.95, y: 0, scaleY: 1 }}
                transition={{ duration: 1.7, delay: 6.2, ease: [0.18, 1, 0.3, 1] }}
              />
              <motion.path
                d="M170 420 C350 300, 650 270, 1040 420"
                stroke="rgba(255,255,255,0.36)"
                strokeWidth="2"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.95, delay: 6.9 }}
              />

              {[
                { cx: 220, cy: 433 },
                { cx: 430, cy: 365 },
                { cx: 690, cy: 432 },
                { cx: 1000, cy: 425 },
              ].map((p, idx) => (
                <motion.circle
                  key={`${p.cx}-${p.cy}`}
                  cx={p.cx}
                  cy={p.cy}
                  r="7"
                  fill="#e87a00"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: [0.5, 1.22, 1] }}
                  transition={{ duration: 0.8, delay: 7.15 + idx * 0.22 }}
                />
              ))}

              <defs>
                <linearGradient id="fabricGradient" x1="180" y1="300" x2="980" y2="590" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4f5a5f" />
                  <stop offset="0.48" stopColor="#3d464b" />
                  <stop offset="1" stopColor="#2f3539" />
                </linearGradient>
              </defs>
            </motion.svg>

            <motion.div
              className="absolute top-[14vh] flex flex-wrap items-center justify-center gap-2 text-[11px] md:text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.85, delay: 2.2 }}
            >
              <span className="rounded-full border border-white/25 bg-white/5 px-3 py-1 font-body text-white/80">Чертеж</span>
              <span className="rounded-full border border-white/25 bg-white/5 px-3 py-1 font-body text-white/80">Точки крепления</span>
              <span className="rounded-full border border-white/25 bg-white/5 px-3 py-1 font-body text-white/80">Премиум ПВХ</span>
            </motion.div>

            <motion.div
              className="absolute bottom-[10vh] text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 7.45, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => {
                if (!isFinishing) {
                  setIsFinishing(true)
                }
              }}
            >
              <p className="font-heading text-3xl font-semibold text-white md:text-4xl">Фабрика Тентов</p>
              <p className="mt-2 font-body text-sm text-white/70 md:text-base">
                Инженерная геометрия. Премиальная ткань. Точная посадка.
              </p>
              <p className="mt-3 font-body text-xs tracking-wide text-accent/90 md:text-sm">
                {stageIdx === 0 && 'Строим техно-схему'}
                {stageIdx === 1 && 'Собираем каркас и узлы'}
                {stageIdx === 2 && 'Натягиваем полотно и фиксируем'}
              </p>
            </motion.div>

            <button
              type="button"
              onClick={() => setVisible(false)}
              className="absolute right-4 top-4 rounded-full border border-white/25 px-4 py-2 font-body text-sm text-white/85 transition hover:bg-white/10"
            >
              Пропустить
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
