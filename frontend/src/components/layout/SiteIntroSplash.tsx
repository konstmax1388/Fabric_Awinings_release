import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

const INTRO_SEEN_KEY = 'fabric_intro_seen_v2'
const INTRO_DURATION_MS = 7600
const INTRO_REDUCED_DURATION_MS = 1600

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
    if (!visible) return
    const t = window.setTimeout(
      () => setVisible(false),
      reduce ? INTRO_REDUCED_DURATION_MS : INTRO_DURATION_MS,
    )
    return () => window.clearTimeout(t)
  }, [reduce, visible])

  useEffect(() => {
    if (!visible || reduce) return
    const marks = [0, 2600, 5200]
    setStageIdx(0)
    const timers = marks.map((ms, idx) => window.setTimeout(() => setStageIdx(idx), ms))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [reduce, visible])

  const stageTransition = useMemo(
    () => ({ duration: 1.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }),
    [],
  )

  return (
    <>
      <div style={{ visibility: ready ? 'visible' : 'hidden' }}>{children}</div>
      <AnimatePresence>
        {visible ? (
          <motion.div
            className="fixed inset-0 z-[400] flex items-center justify-center bg-[#0f0f10]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.4, 0, 0.2, 1] } }}
            role="dialog"
            aria-label="Загрузка сайта"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(232,122,0,0.18),transparent_56%)]" />

            <motion.svg
              viewBox="0 0 1200 680"
              className="h-[min(74vh,520px)] w-[min(92vw,980px)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={stageTransition}
              aria-hidden
            >
              <motion.path
                d="M120 430 L360 430 L420 360 L620 360 L690 430 L1040 430"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.7, ease: 'easeInOut' }}
              />
              {/* truck */}
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
                transition={{ duration: 1.2, delay: 0.55 }}
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
                transition={{ duration: 0.9, delay: 0.85 }}
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
                transition={{ duration: 0.9, delay: 0.95 }}
              />
              {/* terrace */}
              <motion.path
                d="M470 520 L470 456 L620 456 L620 520"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.75 }}
              />
              {/* hangar */}
              <motion.path
                d="M815 520 C820 445, 1015 445, 1020 520"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.35, delay: 0.95 }}
              />
              <motion.path
                d="M180 510 L300 510 L340 455 L505 455 L540 510"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.75, delay: 0.28, ease: 'easeInOut' }}
              />
              <motion.path
                d="M730 520 L1050 520 L1080 460 L790 460 Z"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.85, delay: 0.45, ease: 'easeInOut' }}
              />

              <motion.path
                d="M170 420 C350 300, 650 270, 1040 420 L1040 570 L170 570 Z"
                fill="url(#fabricGradient)"
                initial={{ opacity: 0, y: -36, scaleY: 0.9 }}
                animate={{ opacity: 0.95, y: 0, scaleY: 1 }}
                transition={{ duration: 1.5, delay: 1.25, ease: [0.18, 1, 0.3, 1] }}
              />
              <motion.path
                d="M170 420 C350 300, 650 270, 1040 420"
                stroke="rgba(255,255,255,0.36)"
                strokeWidth="2"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.75, delay: 2.15 }}
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
                  transition={{ duration: 0.75, delay: 2.4 + idx * 0.2 }}
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
              transition={{ duration: 0.75, delay: 1.45 }}
            >
              <span className="rounded-full border border-white/25 bg-white/5 px-3 py-1 font-body text-white/80">Транспорт</span>
              <span className="rounded-full border border-white/25 bg-white/5 px-3 py-1 font-body text-white/80">Террасы</span>
              <span className="rounded-full border border-white/25 bg-white/5 px-3 py-1 font-body text-white/80">Склады и ангары</span>
            </motion.div>

            <motion.div
              className="absolute bottom-[10vh] text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.05, delay: 2.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-heading text-3xl font-semibold text-white md:text-4xl">Фабрика Тентов</p>
              <p className="mt-2 font-body text-sm text-white/70 md:text-base">
                Натяжные решения для транспорта, террас и складов
              </p>
              <p className="mt-3 font-body text-xs tracking-wide text-accent/90 md:text-sm">
                {stageIdx === 0 && 'Проектируем каркас'}
                {stageIdx === 1 && 'Натягиваем полотно'}
                {stageIdx === 2 && 'Фиксируем и сдаем объект'}
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
