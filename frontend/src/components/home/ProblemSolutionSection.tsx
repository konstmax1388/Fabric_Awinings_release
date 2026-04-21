import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import type { ProblemCard, ProblemCardIconKind } from '../../types/homePage'
import {
  easeOutSoft,
  fadeUpHidden,
  fadeUpVisible,
  staggerContainer,
  staggerItem,
} from '../../lib/motion-presets'
import { OptimizedImage } from '../ui/OptimizedImage'

/** Допускаем только безопасные классы Font Awesome (латиница, цифры, пробел, дефис). */
function isSafeFontAwesomeClass(s: string): boolean {
  if (!s || s.length > 120) return false
  if (!/^[\d\w\s-]+$/.test(s)) return false
  return /\bfa-/.test(s)
}

function resolvedIconKind(card: ProblemCard): ProblemCardIconKind {
  const k = card.iconKind
  if (k === 'fontawesome' || k === 'image' || k === 'emoji') return k
  return 'emoji'
}

function ProblemSolutionIcon({ card }: { card: ProblemCard }) {
  const kind = resolvedIconKind(card)
  const url = (card.iconImageUrl || '').trim()

  if (kind === 'image' && url) {
    return (
      <OptimizedImage src={url} alt="" widths={[64, 128]} sizes="32px" className="h-8 w-8 object-contain" />
    )
  }

  const fa = (card.fontawesomeClass || '').trim()
  if (kind === 'fontawesome' && fa && isSafeFontAwesomeClass(fa)) {
    return <i className={`${fa} text-xl text-secondary`} aria-hidden />
  }

  return (
    <span className="font-heading text-xl text-secondary" aria-hidden>
      {card.icon?.trim() || '•'}
    </span>
  )
}

export function ProblemSolutionSection() {
  const reduce = useReducedMotion()
  const { home } = useSiteSettings()
  const [spotlight, setSpotlight] = useState<Record<string, { x: number; y: number; on: boolean }>>({})
  const ps = home?.problemSolution
  const heading = ps?.heading ?? ''
  const subheading = ps?.subheading ?? ''
  const raw = ps?.cards
  const items =
    Array.isArray(raw) && raw.length > 0 && raw.every((c) => c?.problem && c?.solution)
      ? (raw as ProblemCard[])
      : []

  return (
    <motion.section
      className="fabric-container min-w-0 py-12 md:py-24"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.12 }}
      transition={easeOutSoft}
    >
      {heading.trim() ? (
        <h2 className="break-words font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
          {heading}
        </h2>
      ) : null}
      {subheading.trim() ? (
        <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">{subheading}</p>
      ) : null}
      <motion.div
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {items.map((card, idx) => (
          <motion.article
            key={card.problem}
            variants={staggerItem}
            initial={reduce ? false : { opacity: 0, y: 18, scale: 0.985 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.18 }}
            whileHover={
              reduce
                ? undefined
                : {
                    y: -6,
                    boxShadow: '0 18px 36px -16px rgba(200,155,83,0.45)',
                  }
            }
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="relative overflow-hidden rounded-2xl border border-border-light bg-surface p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] transition-colors duration-300 hover:border-accent/45"
            onMouseMove={
              reduce
                ? undefined
                : (e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const y = e.clientY - rect.top
                    setSpotlight((prev) => ({
                      ...prev,
                      [String(idx)]: { x, y, on: true },
                    }))
                  }
            }
            onMouseLeave={
              reduce
                ? undefined
                : () =>
                    setSpotlight((prev) => ({
                      ...prev,
                      [String(idx)]: {
                        ...(prev[String(idx)] ?? { x: 0, y: 0 }),
                        on: false,
                      },
                    }))
            }
          >
            {!reduce && spotlight[String(idx)]?.on ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 transition-opacity duration-150"
                style={{
                  background: `radial-gradient(180px circle at ${spotlight[String(idx)]?.x ?? 0}px ${spotlight[String(idx)]?.y ?? 0}px, rgba(200,155,83,0.2), transparent 72%)`,
                }}
              />
            ) : null}
            <span
              className="relative z-10 flex h-12 w-12 items-center justify-center rounded-lg bg-[#F5F0E8]"
              aria-hidden
            >
              <ProblemSolutionIcon card={card} />
            </span>
            <h3 className="relative z-10 mt-4 font-heading text-xl font-semibold text-text">{card.problem}</h3>
            <p className="relative z-10 mt-2 font-body text-sm leading-relaxed text-text-muted md:text-base">{card.solution}</p>
          </motion.article>
        ))}
      </motion.div>
    </motion.section>
  )
}
