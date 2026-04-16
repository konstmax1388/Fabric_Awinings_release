import { motion, useReducedMotion } from 'framer-motion'
import { type FormEventHandler, useEffect, useState } from 'react'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { fetchReviews, postReviewSubmission, type ReviewItem } from '../../lib/api'
import {
  easeOutSoft,
  fadeUpHidden,
  fadeUpVisible,
  staggerContainer,
  staggerItem,
} from '../../lib/motion-presets'
import { OptimizedImage } from '../ui/OptimizedImage'

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
  const { home } = useSiteSettings()
  const rv = home?.reviews
  const heading = rv?.heading ?? 'Отзывы клиентов'
  const subheading = rv?.subheading ?? 'Реальные заказчики B2B и частные лица.'
  const loadingText = rv?.loading ?? 'Загрузка отзывов…'
  const videoCaption = rv?.videoCaption ?? 'Видеоотзыв'

  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [submitOk, setSubmitOk] = useState<string>('')
  const [submitErr, setSubmitErr] = useState<string>('')
  const [form, setForm] = useState({
    name: '',
    city: '',
    reviewedOn: '',
    text: '',
    publicationConsent: false,
  })

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

  const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    if (sending) return
    setSubmitErr('')
    setSubmitOk('')
    setSending(true)
    const ok = await postReviewSubmission({
      name: form.name.trim(),
      city: form.city.trim(),
      reviewedOn: form.reviewedOn,
      text: form.text.trim(),
      publicationConsent: form.publicationConsent,
    })
    setSending(false)
    if (!ok) {
      setSubmitErr('Не удалось отправить отзыв. Проверьте поля и попробуйте еще раз.')
      return
    }
    setForm({ name: '', city: '', reviewedOn: '', text: '', publicationConsent: false })
    setSubmitOk('Спасибо! Отзыв получен и отправлен менеджеру на модерацию.')
  }

  return (
    <motion.section
      className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 md:py-24"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.08 }}
      transition={easeOutSoft}
    >
      <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">{heading}</h2>
      <p className="mt-3 font-body text-text-muted md:text-lg">{subheading}</p>

      {loading ? (
        <p className="mt-10 font-body text-text-muted">{loadingText}</p>
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
                <OptimizedImage
                  src={r.photo}
                  alt=""
                  widths={[64, 128, 160]}
                  sizes="64px"
                  className="h-14 w-14 shrink-0 rounded-full object-cover md:h-16 md:w-16"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-base font-semibold leading-snug text-text">{r.name}</p>
                  {r.city || r.reviewedOn ? (
                    <p className="mt-0.5 text-xs text-text-muted">
                      {[r.city, r.reviewedOn].filter(Boolean).join(' • ')}
                    </p>
                  ) : null}
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
                    {videoCaption}
                  </p>
                </div>
              )}
            </motion.article>
          ))}
        </motion.div>
      )}
      <div className="mt-10 rounded-2xl border border-border-light bg-surface p-5 md:p-6">
        <h3 className="font-heading text-2xl font-semibold text-text">Оставить отзыв</h3>
        <p className="mt-2 text-sm text-text-muted">
          Публикуем только после проверки менеджером и подтверждения согласия.
        </p>
        <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <input
            className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Имя"
            value={form.name}
            onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
            required
            minLength={2}
            maxLength={120}
          />
          <input
            className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Город"
            value={form.city}
            onChange={(e) => setForm((v) => ({ ...v, city: e.target.value }))}
            required
            minLength={2}
            maxLength={120}
          />
          <input
            className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            type="date"
            value={form.reviewedOn}
            onChange={(e) => setForm((v) => ({ ...v, reviewedOn: e.target.value }))}
            required
          />
          <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
            <input
              id="review-consent"
              type="checkbox"
              checked={form.publicationConsent}
              onChange={(e) => setForm((v) => ({ ...v, publicationConsent: e.target.checked }))}
              required
            />
            <label htmlFor="review-consent">Согласен на публикацию отзыва</label>
          </div>
          <textarea
            className="md:col-span-2 min-h-28 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Текст отзыва"
            value={form.text}
            onChange={(e) => setForm((v) => ({ ...v, text: e.target.value }))}
            required
            minLength={20}
            maxLength={4000}
          />
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-surface disabled:opacity-60"
            >
              {sending ? 'Отправка...' : 'Отправить отзыв'}
            </button>
            {submitOk ? <p className="text-sm text-emerald-700">{submitOk}</p> : null}
            {submitErr ? <p className="text-sm text-rose-700">{submitErr}</p> : null}
          </div>
        </form>
      </div>
    </motion.section>
  )
}
