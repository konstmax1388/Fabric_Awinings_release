import { motion, useReducedMotion } from 'framer-motion'
import { AnimatedCounter } from '../motion/AnimatedCounter'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../../lib/motion-presets'

const cols = [
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

const stats = [
  { value: 500, suffix: '+', label: 'проектов' },
  { value: 12, suffix: '+', label: 'лет на рынке' },
  { value: 50, suffix: '+', label: 'типов изделий' },
]

export function WhyUsSection() {
  const reduce = useReducedMotion()

  return (
    <section className="bg-[#F5F0E8]/40 py-12 md:py-24">
      <motion.div
        className="mx-auto max-w-[1280px] px-4 md:px-6"
        initial={reduce ? false : fadeUpHidden}
        whileInView={reduce ? undefined : fadeUpVisible}
        viewport={{ once: true, amount: 0.1 }}
        transition={easeOutSoft}
      >
        <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
          Почему выбирают нас
        </h2>
        <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">
          Работаем прозрачно: вы знаете этапы, сроки и ответственных.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-4 divide-x divide-border-light rounded-2xl bg-surface px-4 py-8 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)] md:gap-8 md:px-10">
          {stats.map((s) => (
            <div key={s.label} className="px-2 text-center md:px-6">
              <p className="font-body text-2xl font-bold tabular-nums tracking-tight text-text md:text-4xl lg:text-5xl">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 font-body text-xs text-text-muted md:text-sm">{s.label}</p>
            </div>
          ))}
        </div>

        <motion.div
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.08 }}
        >
          {cols.map((c) => (
            <motion.div
              key={c.title}
              variants={staggerItem}
              className="rounded-2xl bg-surface p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)]"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-base text-2xl"
                aria-hidden
              >
                {c.icon}
              </span>
              <h3 className="mt-4 font-heading text-xl font-semibold text-text">{c.title}</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-text-muted md:text-base">
                {c.text}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
