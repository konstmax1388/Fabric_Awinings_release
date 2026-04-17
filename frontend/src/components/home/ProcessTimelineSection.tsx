import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { easeOutSoft, fadeUpHidden, fadeUpVisible } from '../../lib/motion-presets'

const STEPS = [
  { title: 'Заявка и консультация', text: 'Уточняем задачу, сроки и бюджет.' },
  { title: 'Замер и проект', text: 'Фиксируем размеры, материалы и конструктив.' },
  { title: 'Изготовление', text: 'Производим и проверяем каждый узел.' },
  { title: 'Монтаж и сдача', text: 'Устанавливаем, тестируем, передаём объект.' },
]

export function ProcessTimelineSection() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)

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
      className="mx-auto min-w-0 max-w-[1280px] px-4 py-12 md:px-6 md:py-24"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.1 }}
      transition={easeOutSoft}
    >
      <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
        От замера до монтажа
      </h2>
      <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">
        Прозрачный процесс: вы всегда понимаете, на каком этапе проект.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {STEPS.map((step, idx) => {
          const isActive = idx === active
          return (
            <article
              key={step.title}
              data-process-step={idx}
              className={`rounded-2xl border bg-surface p-4 transition md:p-5 ${
                isActive
                  ? 'border-accent shadow-[0_10px_26px_-14px_rgba(232,122,0,0.65)]'
                  : 'border-border-light'
              }`}
            >
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-bg-base font-body text-sm font-semibold text-accent">
                {idx + 1}
              </div>
              <h3 className="font-heading text-lg font-semibold text-text">{step.title}</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-text-muted">{step.text}</p>
            </article>
          )
        })}
      </div>
    </motion.section>
  )
}
