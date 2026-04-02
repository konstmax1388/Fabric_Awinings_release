import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../../lib/motion-presets'

const categories = ['Все', 'Транспорт', 'Склады', 'Террасы']

const projects = [
  {
    id: '1',
    title: 'Тент на фуру 20 т',
    category: 'Транспорт',
    date: '12.03.2025',
    before: 'https://images.unsplash.com/photo-1519003722824-cd6e866ed77c?w=400&q=80',
    after: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80',
  },
  {
    id: '2',
    title: 'Навес для склада',
    category: 'Склады',
    date: '02.02.2025',
    before: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80',
    after: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80',
  },
  {
    id: '3',
    title: 'Терраса кафе',
    category: 'Террасы',
    date: '18.01.2025',
    before: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
    after: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  },
]

export function PortfolioSection() {
  const [filter, setFilter] = useState('Все')
  const filtered =
    filter === 'Все' ? projects : projects.filter((p) => p.category === filter)
  const reduce = useReducedMotion()

  return (
    <motion.section
      className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 md:py-24"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.08 }}
      transition={easeOutSoft}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
            Портфолио
          </h2>
          <p className="mt-3 max-w-xl font-body text-text-muted md:text-lg">
            Реальные объекты: до и после. Полная галерея — в разделе портфолио.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`rounded-full px-4 py-2 font-body text-sm font-medium transition ${
                filter === c
                  ? 'bg-accent text-surface'
                  : 'bg-surface text-text-muted ring-1 ring-border hover:text-accent'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={filter}
        className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {filtered.map((p) => (
          <motion.article
            key={p.id}
            variants={staggerItem}
            whileHover={
              reduce
                ? undefined
                : {
                    scale: 1.03,
                    y: -4,
                    boxShadow: '0 16px 32px -12px rgba(0,0,0,0.12)',
                  }
            }
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            className="overflow-hidden rounded-2xl bg-surface shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)]"
          >
            <div className="grid grid-cols-2 gap-0.5 bg-border">
              <img src={p.before} alt={`${p.title} — до`} className="aspect-[4/3] object-cover" />
              <img src={p.after} alt={`${p.title} — после`} className="aspect-[4/3] object-cover" />
            </div>
            <div className="p-4">
              <p className="font-body text-xs text-text-subtle">
                {p.category} · {p.date}
              </p>
              <h3 className="mt-1 font-heading text-lg font-semibold text-text">{p.title}</h3>
            </div>
          </motion.article>
        ))}
      </motion.div>

      <div className="mt-10 text-center">
        <motion.span whileHover={reduce ? undefined : { scale: 1.02 }} className="inline-block">
          <Link
            to="/portfolio"
            className="inline-flex h-12 items-center justify-center rounded-[40px] border-2 border-accent px-8 font-body font-medium text-accent hover:bg-[rgba(232,122,0,0.08)]"
            style={{ letterSpacing: '0.02em' }}
          >
            Все проекты
          </Link>
        </motion.span>
      </div>
    </motion.section>
  )
}
