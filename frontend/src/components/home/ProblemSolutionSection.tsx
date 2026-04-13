import { motion, useReducedMotion } from 'framer-motion'
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

const FALLBACK_CARDS: ProblemCard[] = [
  {
    problem: 'Дорого?',
    solution: 'Своё производство — на 30% дешевле типовых предложений.',
    icon: '₽',
    iconKind: 'emoji',
  },
  {
    problem: 'Долго ждать?',
    solution: 'Изготовление от 5 рабочих дней, срочные заказы — по договорённости.',
    icon: '⏱',
    iconKind: 'emoji',
  },
  {
    problem: 'Ненадёжно?',
    solution: 'Гарантия на материалы и фурнитуру, договор и акты.',
    icon: '✓',
    iconKind: 'emoji',
  },
  {
    problem: 'Сложно с замером?',
    solution: 'Выезд специалиста или инструкция для самостоятельного замера.',
    icon: '📐',
    iconKind: 'emoji',
  },
]

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
  const ps = home?.problemSolution
  const heading = ps?.heading ?? 'Решаем ваши задачи'
  const subheading =
    ps?.subheading ??
    'Частые вопросы клиентов — и как мы на них отвечаем делом, а не обещаниями.'
  const raw = ps?.cards
  const items =
    Array.isArray(raw) && raw.length > 0 && raw.every((c) => c?.problem && c?.solution)
      ? (raw as ProblemCard[])
      : FALLBACK_CARDS

  return (
    <motion.section
      className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 md:py-24"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.12 }}
      transition={easeOutSoft}
    >
      <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">{heading}</h2>
      <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">{subheading}</p>
      <motion.div
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        {items.map((card) => (
          <motion.article
            key={card.problem}
            variants={staggerItem}
            whileHover={
              reduce
                ? undefined
                : { y: -4, boxShadow: '0 16px 32px -12px rgba(0,0,0,0.12)' }
            }
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="rounded-2xl border border-border-light bg-surface p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)]"
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F5F0E8]"
              aria-hidden
            >
              <ProblemSolutionIcon card={card} />
            </span>
            <h3 className="mt-4 font-heading text-xl font-semibold italic text-text">{card.problem}</h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-text-muted md:text-base">{card.solution}</p>
          </motion.article>
        ))}
      </motion.div>
    </motion.section>
  )
}
