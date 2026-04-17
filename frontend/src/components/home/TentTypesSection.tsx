import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { fetchProductCategories } from '../../lib/api'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../../lib/motion-presets'
import { FabricDriftOverlay } from '../ui/FabricDriftOverlay'
import { OptimizedImage } from '../ui/OptimizedImage'

function categoryCardImage(_slug: string, imageUrl: string | null | undefined): string {
  if (imageUrl?.trim()) return imageUrl.trim()
  return '/branding/logo.svg'
}

export function TentTypesSection() {
  const reduce = useReducedMotion()
  const { home } = useSiteSettings()
  const tt = home?.tentTypes
  const heading = tt?.heading ?? ''
  const subheading = tt?.subheading ?? ''
  const [cards, setCards] = useState<Array<{ title: string; slug: string; img: string }>>([])

  useEffect(() => {
    fetchProductCategories().then((list) => {
      setCards(
        (list ?? []).map((c) => ({
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
        className="mx-auto min-w-0 max-w-[1280px] px-4 md:px-6"
        initial={reduce ? false : fadeUpHidden}
        whileInView={reduce ? undefined : fadeUpVisible}
        viewport={{ once: true, amount: 0.1 }}
        transition={easeOutSoft}
      >
        {heading.trim() ? (
          <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">{heading}</h2>
        ) : null}
        {subheading.trim() ? (
          <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">{subheading}</p>
        ) : null}
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
                  <div className="relative aspect-[288/200] overflow-hidden">
                    <OptimizedImage
                      src={c.img}
                      alt=""
                      widths={[480, 640, 800]}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <FabricDriftOverlay className="opacity-35 mix-blend-soft-light" />
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
