import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { fetchReviews, type ReviewItem } from '../../lib/api'
import {
  easeOutSoft,
  fadeUpHidden,
  fadeUpVisible,
  staggerContainer,
  staggerItem,
} from '../../lib/motion-presets'

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Оценка ${rating} из 5`}>
      {Array.from({ length: 5 }, (_, k) => (
        <span key={k} className={k < rating ? 'text-amber-500' : 'text-border'}>
          ★
        </span>
      ))}
    </div>
  )
}

export function ReviewsSection() {
  const reduce = useReducedMotion()
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchReviews().then((list) => {
      if (!cancelled) {
        setReviews(list)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <motion.section
      className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 md:py-24"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.08 }}
      transition={easeOutSoft}
    >
      <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
        Отзывы клиентов
      </h2>
      <p className="mt-3 font-body text-text-muted md:text-lg">
        Реальные заказчики B2B и частные лица.
      </p>

      {loading ? (
        <p className="mt-10 font-body text-text-muted">Загрузка отзывов…</p>
      ) : (
        <motion.div
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
        >
          {reviews.map((r) => (
            <motion.article
              key={r.id}
              variants={staggerItem}
              whileHover={
                reduce
                  ? undefined
                  : {
                      y: -4,
                      boxShadow: '0 16px 32px -12px rgba(0,0,0,0.12)',
                    }
              }
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="flex h-full flex-col rounded-2xl border border-border-light bg-[#F5F0E8] p-5 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)] md:bg-surface md:p-6"
            >
              <div className="flex items-start gap-3">
                <img
                  src={r.photo}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full object-cover md:h-16 md:w-16"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-base font-semibold leading-snug text-text">{r.name}</p>
                  <div className="mt-1">
                    <Stars rating={r.rating} />
                  </div>
                </div>
              </div>
              <p className="mt-4 flex-1 font-body text-sm italic leading-relaxed text-text-muted md:text-[15px]">
                «{r.text}»
              </p>
              {r.video && (
                <div className="relative mt-4 aspect-video overflow-hidden rounded-xl bg-text/10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/90 text-surface shadow-md">
                      ▶
                    </span>
                  </div>
                  <p className="absolute bottom-1.5 left-2 font-body text-[11px] text-text-muted">
                    Видеоотзыв
                  </p>
                </div>
              )}
            </motion.article>
          ))}
        </motion.div>
      )}
    </motion.section>
  )
}
