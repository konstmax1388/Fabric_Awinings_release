import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { easeOutSoft, fadeUpHidden, fadeUpVisible } from '../../lib/motion-presets'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { TextWithBr } from '../ui/TextWithBr'

const STEPS = [
  { title: 'Заявка и консультация', text: 'Уточняем задачу, сроки и бюджет.' },
  { title: 'Замер и проект', text: 'Фиксируем размеры, материалы и конструктив.' },
  { title: 'Изготовление', text: 'Производим и проверяем каждый узел.' },
  { title: 'Монтаж и сдача', text: 'Устанавливаем, тестируем, передаём объект.' },
]

export function ProcessTimelineSection() {
  const { home } = useSiteSettings()
  const proc = home?.processTimeline
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const steps = (() => {
    const raw = proc?.steps
    if (!Array.isArray(raw)) return STEPS
    const normalized = raw
      .map((s) => ({
        title: String(s?.title || '').trim(),
        text: String(s?.text || '').trim(),
      }))
      .filter((s) => s.title && s.text)
    return normalized.length ? normalized : STEPS
  })()
  const progress = ((active + 1) / steps.length) * 100

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-process-step]'))
    if (!nodes.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        const idx = Number((visible.target as HTMLElement).dataset.processStep)
        if (Number.isFinite(idx)) setActive(idx)
      },
      { threshold: [0.35, 0.6, 0.85] },
    )
    nodes.forEach((n) => observer.observe(n))
    return () => observer.disconnect()
  }, [])

  return (
    <motion.section
      className="fabric-container min-w-0 py-12 md:py-24"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.1 }}
      transition={easeOutSoft}
    >
      <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
        <TextWithBr>{proc?.heading?.trim() || 'От замера до монтажа'}</TextWithBr>
      </h2>
      <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">
        <TextWithBr>
          {proc?.subheading?.trim() || 'Прозрачный процесс: вы всегда понимаете, на каком этапе проект.'}
        </TextWithBr>
      </p>

      <div className="mt-8">
        <div className="hidden md:block">
          <div className="relative mb-5 h-[2px] rounded-full bg-border-light">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-accent"
              style={{ width: `${Math.max(8, progress)}%` }}
              transition={{ duration: 0.22 }}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map((step, idx) => {
            const isActive = idx === active
            const isDone = idx < active
            return (
              <motion.article
                key={step.title}
                data-process-step={idx}
                className={`group rounded-2xl border bg-surface p-4 transition duration-300 md:p-5 md:hover:-translate-y-1 md:hover:border-accent md:hover:shadow-[0_16px_34px_-18px_rgba(232,122,0,0.65)] ${
                  isActive
                    ? 'border-accent shadow-[0_10px_26px_-14px_rgba(232,122,0,0.65)]'
                    : 'border-border-light'
                }`}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  ...easeOutSoft,
                  delay: reduce ? 0 : idx * 0.08,
                }}
                whileHover={
                  reduce
                    ? undefined
                    : {
                        y: -6,
                      }
                }
              >
                <div
                  className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full font-body text-sm font-semibold transition-colors duration-300 md:group-hover:text-bg-base ${
                    isActive || isDone
                      ? 'bg-accent text-bg-base md:group-hover:bg-accent'
                      : 'bg-bg-base text-accent md:group-hover:bg-accent'
                  }`}
                >
                  {idx + 1}
                </div>
                <h3 className="font-heading text-lg font-semibold text-text">
                  <TextWithBr>{step.title}</TextWithBr>
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-text-muted">
                  <TextWithBr>{step.text}</TextWithBr>
                </p>
              </motion.article>
            )
          })}
        </div>
      </div>
    </motion.section>
  )
}
