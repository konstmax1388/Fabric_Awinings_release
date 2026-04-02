import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../../lib/motion-presets'

const categories = [
  {
    title: 'Для грузового транспорта',
    slug: 'truck',
    img: 'https://images.unsplash.com/photo-1519003722824-cd6e866ed77c?w=600&q=80',
  },
  {
    title: 'Ангары и склады',
    slug: 'warehouse',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80',
  },
  {
    title: 'Кафе и террасы',
    slug: 'cafe',
    img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
  },
  {
    title: 'Мероприятия',
    slug: 'events',
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
  },
]

export function TentTypesSection() {
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
          Виды тентов
        </h2>
        <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">
          Выберите направление — в каталоге подберем конфигурацию под ваш объект.
        </p>
        <motion.div
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.08 }}
        >
          {categories.map((c) => (
            <motion.div key={c.slug} variants={staggerItem} className="h-full">
              <motion.div
                className="h-full overflow-hidden rounded-2xl bg-surface shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)]"
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
              >
                <Link to={`/catalog?category=${c.slug}`} className="group block h-full">
                  <div className="aspect-[288/200] overflow-hidden">
                    <img
                      src={c.img}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-base font-heading text-lg text-secondary"
                      aria-hidden
                    >
                      ◆
                    </span>
                    <span className="font-heading text-lg font-semibold italic text-text group-hover:text-accent">
                      {c.title}
                    </span>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
