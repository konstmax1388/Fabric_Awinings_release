import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { fetchProductCategories } from '../../lib/api'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../../lib/motion-presets'
import { OptimizedImage } from '../ui/OptimizedImage'

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80'

const IMG_BY_SLUG: Record<string, string> = {
  truck: 'https://images.unsplash.com/photo-1519003722824-cd6a866ed77c?w=600&q=80',
  warehouse: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80',
  cafe: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
  events: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
}

const FALLBACK_CARDS = [
  { title: 'Для грузового транспорта', slug: 'truck', img: IMG_BY_SLUG.truck },
  { title: 'Ангары и склады', slug: 'warehouse', img: IMG_BY_SLUG.warehouse },
  { title: 'Кафе и террасы', slug: 'cafe', img: IMG_BY_SLUG.cafe },
  { title: 'Мероприятия', slug: 'events', img: IMG_BY_SLUG.events },
]

function categoryCardImage(slug: string, imageUrl: string | null | undefined): string {
  if (imageUrl?.trim()) return imageUrl.trim()
  return IMG_BY_SLUG[slug] ?? DEFAULT_IMG
}

export function TentTypesSection() {
  const reduce = useReducedMotion()
  const { home } = useSiteSettings()
  const tt = home?.tentTypes
  const heading = tt?.heading ?? 'Виды тентов'
  const subheading =
    tt?.subheading ?? 'Выберите направление — в каталоге подберём конфигурацию под ваш объект.'
  const [cards, setCards] = useState(FALLBACK_CARDS)

  useEffect(() => {
    fetchProductCategories().then((list) => {
      if (!list?.length) return
      setCards(
        list.map((c) => ({
          title: c.title,
          slug: c.slug,
          img: categoryCardImage(c.slug, c.imageUrl),
        })),
      )
    })
  }, [])

  return (
    <section className="bg-[#F5F0E8]/40 py-12 md:py-24">
      <motion.div
        className="mx-auto max-w-[1280px] px-4 md:px-6"
        initial={reduce ? false : fadeUpHidden}
        whileInView={reduce ? undefined : fadeUpVisible}
        viewport={{ once: true, amount: 0.1 }}
        transition={easeOutSoft}
      >
        <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">{heading}</h2>
        <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">{subheading}</p>
        <motion.div
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.08 }}
        >
          {cards.map((c) => (
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
                <Link to={`/catalog?category=${encodeURIComponent(c.slug)}`} className="group block h-full">
                  <div className="aspect-[288/200] overflow-hidden">
                    <OptimizedImage
                      src={c.img}
                      alt=""
                      widths={[480, 640, 800]}
                      sizes="(max-width: 768px) 100vw, 33vw"
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
