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
import { problemCardIconAlt } from '../../lib/imageAlt'
import { OptimizedImage } from '../ui/OptimizedImage'
import { TextWithBr } from '../ui/TextWithBr'

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
      <OptimizedImage
        src={url}
        alt={problemCardIconAlt(card.problem)}
        widths={[48, 64, 96, 128]}
        sizes="44px"
        className="h-10 w-10 object-contain sm:h-11 sm:w-11"
      />
    )
  }

  const fa = (card.fontawesomeClass || '').trim()
  if (kind === 'fontawesome' && fa && isSafeFontAwesomeClass(fa)) {
    return <i className={`${fa} text-[2.5rem] leading-none text-current sm:text-[2.75rem]`} aria-hidden />
  }

  return (
    <span className="font-heading text-[2.5rem] leading-none text-current sm:text-[2.75rem]" aria-hidden>
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
          <TextWithBr>{heading}</TextWithBr>
        </h2>
      ) : null}
      {subheading.trim() ? (
        <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">
          <TextWithBr>{subheading}</TextWithBr>
        </p>
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
            key={`${idx}-${card.problem}`}
            variants={staggerItem}
            initial={reduce ? false : { opacity: 0, y: 22, scale: 0.98 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.18 }}
            whileHover={
              reduce
                ? undefined
                : {
                    y: -8,
                    scale: 1.012,
                    boxShadow:
                      '0 22px 48px -18px rgba(200,155,83,0.38), 0 18px 36px -22px rgba(0,0,0,0.35)',
                  }
            }
            whileTap={reduce ? undefined : { scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            className="group relative cursor-default overflow-hidden rounded-2xl border border-border-light bg-surface p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] transition-[border-color] duration-300 hover:border-accent/50"
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
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 transition duration-500 ease-out group-hover:scale-x-100 group-hover:opacity-100 motion-reduce:hidden"
            />
            {!reduce && spotlight[String(idx)]?.on ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[1] opacity-100 transition-opacity duration-200"
                style={{
                  background: [
                    `radial-gradient(240px circle at ${spotlight[String(idx)]?.x ?? 0}px ${spotlight[String(idx)]?.y ?? 0}px, rgba(255,255,255,0.07), transparent 58%)`,
                    `radial-gradient(200px circle at ${spotlight[String(idx)]?.x ?? 0}px ${spotlight[String(idx)]?.y ?? 0}px, rgba(200,155,83,0.26), rgba(200,155,83,0.06) 42%, transparent 68%)`,
                  ].join(', '),
                }}
              />
            ) : null}
            <span
              className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center text-secondary transition duration-300 ease-out group-hover:scale-110 group-hover:text-accent sm:h-11 sm:w-11 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              aria-hidden
            >
              <ProblemSolutionIcon card={card} />
            </span>
            <h3 className="relative z-10 mt-4 font-heading text-xl font-semibold text-text transition-colors duration-300 group-hover:text-accent motion-reduce:transition-none motion-reduce:group-hover:text-text">
              <TextWithBr>{card.problem}</TextWithBr>
            </h3>
            <div
              aria-hidden
              className="relative z-10 mt-3 h-px w-10 bg-gradient-to-r from-accent/70 to-transparent transition-all duration-500 ease-out group-hover:w-16 group-hover:from-accent motion-reduce:transition-none motion-reduce:group-hover:w-10"
            />
            <p className="relative z-10 mt-3 font-body text-sm leading-relaxed text-text-muted transition-colors duration-300 group-hover:text-text motion-reduce:transition-none motion-reduce:group-hover:text-text-muted md:text-base">
              <TextWithBr>{card.solution}</TextWithBr>
            </p>
          </motion.article>
        ))}
      </motion.div>
    </motion.section>
  )
}
