import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import type { WhyColumn, WhyStat } from '../../types/homePage'
import { AnimatedCounter } from '../motion/AnimatedCounter'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../../lib/motion-presets'

const DEFAULT_COLS: WhyColumn[] = [
  {
    title: 'Своё производство',
    text: 'Полный цикл: проектирование, раскрой, сварка и монтаж своими бригадами.',
    icon: '🏭',
  },
  {
    title: 'Материалы в наличии',
    text: 'ПВХ, ткани, фурнитура от проверенных поставщиков — без месяцев ожидания.',
    icon: '📦',
  },
  {
    title: 'Договор и гарантия',
    text: 'Фиксируем сроки и объём работ. Документы для B2B и тендеров.',
    icon: '📋',
  },
  {
    title: 'Поддержка после монтажа',
    text: 'Консультации по уходу, ремонт и доработки по запросу.',
    icon: '🛠',
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

function normalizeColumns(raw: unknown): WhyColumn[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_COLS
  const out: WhyColumn[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const title = typeof o.title === 'string' ? o.title : ''
    const text = typeof o.text === 'string' ? o.text : ''
    const icon = typeof o.icon === 'string' ? o.icon : '•'
    if (!title || !text) continue
    out.push({ title, text, icon })
  }
  return out.length ? out : DEFAULT_COLS
}

export function WhyUsSection() {
  const reduce = useReducedMotion()
  const { home } = useSiteSettings()
  const sectionRef = useRef<HTMLElement | null>(null)
  const [lineProgress, setLineProgress] = useState(0)
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
        <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">{heading}</h2>
        <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">{subheading}</p>

        <div className="mt-10 flex flex-col gap-6 rounded-2xl bg-surface px-4 py-8 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)] sm:flex-row sm:items-stretch sm:justify-center sm:gap-0 sm:divide-x sm:divide-border-light md:gap-8 md:px-10">
          {stats.map((s, idx) => (
            <div key={s.label} className="min-w-0 flex-1 px-0 text-center sm:px-4 md:px-6">
              <p className="font-body text-2xl font-bold tabular-nums tracking-tight text-text md:text-4xl lg:text-5xl">
                <AnimatedCounter value={s.value} suffix={s.suffix} duration={1.8} delay={0.12 * idx} />
              </p>
              <p className="mt-1 font-body text-xs text-text-muted md:text-sm">{s.label}</p>
            </div>
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
            {cols.map((c) => (
              <motion.div
                key={c.title}
                variants={staggerItem}
                className="rounded-2xl bg-surface p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)] lg:h-full lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none"
              >
                <div className="rounded-2xl bg-surface p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)] lg:h-full">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-base text-2xl"
                    aria-hidden
                  >
                    {c.icon}
                  </span>
                  <h3 className="mt-4 font-heading text-xl font-semibold text-text">{c.title}</h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-text-muted md:text-base">{c.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
