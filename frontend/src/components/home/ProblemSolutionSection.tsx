import { motion, useReducedMotion } from 'framer-motion'
import {
  easeOutSoft,
  fadeUpHidden,
  fadeUpVisible,
  staggerContainer,
  staggerItem,
} from '../../lib/motion-presets'

const items = [
  { problem: 'Дорого?', solution: 'Своё производство — на 30% дешевле типовых предложений.', icon: '₽' },
  { problem: 'Долго ждать?', solution: 'Изготовление от 5 рабочих дней, срочные заказы — по договорённости.', icon: '⏱' },
  { problem: 'Ненадёжно?', solution: 'Гарантия на материалы и фурнитуру, договор и акты.', icon: '✓' },
  { problem: 'Сложно с замером?', solution: 'Выезд специалиста или инструкция для самостоятельного замера.', icon: '📐' },
]

export function ProblemSolutionSection() {
  const reduce = useReducedMotion()

  return (
    <motion.section
      className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 md:py-24"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.12 }}
      transition={easeOutSoft}
    >
      <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
        Решаем ваши задачи
      </h2>
      <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">
        Частые вопросы клиентов — и как мы на них отвечаем делом, а не обещаниями.
      </p>
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
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#F5F0E8] font-heading text-xl text-secondary"
              aria-hidden
            >
              {card.icon}
            </span>
            <h3 className="mt-4 font-heading text-xl font-semibold italic text-text">{card.problem}</h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-text-muted md:text-base">
              {card.solution}
            </p>
          </motion.article>
        ))}
      </motion.div>
    </motion.section>
  )
}
