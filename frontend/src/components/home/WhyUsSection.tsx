import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import type { WhyColumn, WhyColumnIconKind, WhyStat } from '../../types/homePage'
import { AnimatedCounter } from '../motion/AnimatedCounter'
import { whyUsColumnIconAlt } from '../../lib/imageAlt'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../../lib/motion-presets'
import { OptimizedImage } from '../ui/OptimizedImage'
import { TextWithBr } from '../ui/TextWithBr'

const DEFAULT_COLS: WhyColumn[] = [
  {
    title: 'Своё производство',
    text: 'Полный цикл: проектирование, раскрой, сварка и монтаж своими бригадами.',
    icon: '•',
    iconKind: 'fontawesome',
    fontawesomeClass: 'fa-solid fa-industry',
  },
  {
    title: 'Материалы в наличии',
    text: 'ПВХ, ткани, фурнитура от проверенных поставщиков — без месяцев ожидания.',
    icon: '•',
    iconKind: 'fontawesome',
    fontawesomeClass: 'fa-solid fa-warehouse',
  },
  {
    title: 'Договор и гарантия',
    text: 'Фиксируем сроки и объём работ. Документы для B2B и тендеров.',
    icon: '•',
    iconKind: 'fontawesome',
    fontawesomeClass: 'fa-solid fa-file-contract',
  },
  {
    title: 'Поддержка после монтажа',
    text: 'Консультации по уходу, ремонт и доработки по запросу.',
    icon: '•',
    iconKind: 'fontawesome',
    fontawesomeClass: 'fa-solid fa-screwdriver-wrench',
  },
]

const DEFAULT_STATS: WhyStat[] = [
  { value: 500, suffix: '+', label: 'проектов' },
  { value: 12, suffix: '+', label: 'лет на рынке' },
  { value: 50, suffix: '+', label: 'типов изделий' },
]

function normalizeStats(raw: unknown): WhyStat[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_STATS
  const out: WhyStat[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const value = typeof o.value === 'number' ? o.value : Number(o.value)
    if (!Number.isFinite(value)) continue
    const suffix = typeof o.suffix === 'string' ? o.suffix : '+'
    const label = typeof o.label === 'string' ? o.label : ''
    if (!label) continue
    out.push({ value, suffix, label })
  }
  return out.length ? out : DEFAULT_STATS
}

function isSafeFontAwesomeClass(s: string): boolean {
  if (!s || s.length > 120) return false
  if (!/^[\d\w\s-]+$/.test(s)) return false
  return /\bfa-/.test(s)
}

function WhyUsColumnIcon({ col }: { col: WhyColumn }) {
  const url = (col.iconImageUrl || '').trim()
  if (col.iconKind === 'image' && url) {
    return (
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center text-current [&_img]:max-h-9 [&_img]:max-w-9 [&_img]:object-contain"
        aria-hidden
      >
        <OptimizedImage
          src={url}
          alt={whyUsColumnIconAlt(col.title)}
          widths={[64, 96, 128]}
          sizes="36px"
          className="max-h-9 max-w-9 object-contain"
        />
      </span>
    )
  }
  const fromClass = (col.fontawesomeClass || '').trim()
  const fromIcon = (col.icon || '').trim()
  const fa = fromClass || (fromIcon && /\bfa-/.test(fromIcon) ? fromIcon : '')
  if (fa && isSafeFontAwesomeClass(fa)) {
    const useFa = col.iconKind === 'fontawesome' || (!col.iconKind && (Boolean(fromClass) || /\bfa-/.test(fromIcon)))
    if (useFa) {
      return <i className={`${fa} text-xl text-current`} aria-hidden />
    }
  }
  const emoji = fromIcon && !/\bfa-/.test(fromIcon) ? fromIcon : '•'
  return (
    <span className="font-heading text-2xl leading-none text-current" aria-hidden>
      {col.iconKind === 'fontawesome' && !fa ? '•' : emoji}
    </span>
  )
}

function normalizeColumns(raw: unknown): WhyColumn[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_COLS
  const out: WhyColumn[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const title = typeof o.title === 'string' ? o.title : ''
    const text = typeof o.text === 'string' ? o.text : ''
    const icon = typeof o.icon === 'string' ? o.icon : '•'
    const fontawesomeClass = typeof o.fontawesomeClass === 'string' ? o.fontawesomeClass : undefined
    const iconImageUrl = typeof o.iconImageUrl === 'string' && o.iconImageUrl.trim() ? o.iconImageUrl.trim() : undefined
    let iconKind: WhyColumnIconKind | undefined
    if (o.iconKind === 'fontawesome' || o.iconKind === 'emoji' || o.iconKind === 'image') iconKind = o.iconKind
    if (!title || !text) continue
    out.push({
      title,
      text,
      icon: icon || '•',
      iconKind,
      fontawesomeClass: fontawesomeClass || undefined,
      ...(iconImageUrl ? { iconImageUrl } : {}),
    })
  }
  return out.length ? out : DEFAULT_COLS
}

export function WhyUsSection() {
  const reduce = useReducedMotion()
  const { home } = useSiteSettings()
  const sectionRef = useRef<HTMLElement | null>(null)
  const [lineProgress, setLineProgress] = useState(0)
  const [spotlight, setSpotlight] = useState<Record<string, { x: number; y: number; on: boolean }>>({})
  const w = home?.whyUs
  const heading = w?.heading ?? 'Почему выбирают нас'
  const subheading = w?.subheading ?? 'Работаем прозрачно: вы знаете этапы, сроки и ответственных.'
  const stats = useMemo(() => normalizeStats(w?.stats), [w?.stats])
  const cols = useMemo(() => normalizeColumns(w?.columns), [w?.columns])

  useEffect(() => {
    if (reduce) return
    const update = () => {
      const node = sectionRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const vh = Math.max(1, window.innerHeight)
      const start = vh * 0.9
      const end = -rect.height * 0.2
      const range = start - end
      const raw = (start - rect.top) / Math.max(1, range)
      const clamped = Math.max(0, Math.min(1, raw))
      setLineProgress(clamped)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [reduce])

  return (
    <section ref={sectionRef} className="bg-[#F5F0E8]/40 py-12 md:py-24">
      <motion.div
        className="fabric-container min-w-0"
        initial={reduce ? false : fadeUpHidden}
        whileInView={reduce ? undefined : fadeUpVisible}
        viewport={{ once: true, amount: 0.1 }}
        transition={easeOutSoft}
      >
        <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
          <TextWithBr>{heading}</TextWithBr>
        </h2>
        <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">
          <TextWithBr>{subheading}</TextWithBr>
        </p>

        <div className="mt-10 flex flex-col gap-6 rounded-2xl bg-surface px-4 py-8 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)] sm:flex-row sm:items-stretch sm:justify-center sm:gap-0 sm:divide-x sm:divide-border-light md:gap-8 md:px-10">
          {stats.map((s, idx) => (
            <motion.div
              key={s.label}
              className="min-w-0 flex-1 rounded-xl px-0 py-2 text-center transition-colors sm:px-4 md:px-6"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...easeOutSoft, delay: idx * 0.08 }}
              whileHover={
                reduce
                  ? undefined
                  : {
                      y: -3,
                      backgroundColor: 'rgba(200,155,83,0.08)',
                      boxShadow: '0 14px 26px -16px rgba(200,155,83,0.55)',
                    }
              }
            >
              <p className="font-body text-2xl font-bold tabular-nums tracking-tight text-text md:text-4xl lg:text-5xl">
                <AnimatedCounter value={s.value} suffix={s.suffix} duration={1.8} delay={0.12 * idx} />
              </p>
              <p className="mt-1 font-body text-xs text-text-muted md:text-sm">
                <TextWithBr>{s.label}</TextWithBr>
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.08 }}
        >
          <div className="hidden lg:mb-6 lg:block">
            <div className="relative h-[2px] rounded-full bg-border-light">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-accent"
                style={{ width: `${Math.max(6, lineProgress * 100)}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cols.map((c, idx) => (
              <motion.div
                key={c.title}
                variants={staggerItem}
                className="rounded-2xl bg-surface p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)] lg:h-full lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none"
                whileHover={
                  reduce
                    ? undefined
                    : {
                        y: -5,
                      }
                }
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              >
                <div
                  className="relative overflow-hidden rounded-2xl border border-transparent bg-surface p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)] transition-colors duration-300 hover:border-accent/40 hover:shadow-[0_18px_36px_-18px_rgba(200,155,83,0.45)] lg:h-full"
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
                        background: `radial-gradient(180px circle at ${spotlight[String(idx)]?.x ?? 0}px ${spotlight[String(idx)]?.y ?? 0}px, rgba(200,155,83,0.22), transparent 70%)`,
                      }}
                    />
                  ) : null}
                  <span
                    className="relative z-10 flex h-12 w-12 items-center justify-center rounded-lg bg-bg-base text-2xl"
                    aria-hidden
                  >
                    <WhyUsColumnIcon col={c} />
                  </span>
                  <h3 className="relative z-10 mt-4 font-heading text-xl font-semibold text-text">
                    <TextWithBr>{c.title}</TextWithBr>
                  </h3>
                  <p className="relative z-10 mt-2 font-body text-sm leading-relaxed text-text-muted md:text-base">
                    <TextWithBr>{c.text}</TextWithBr>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
