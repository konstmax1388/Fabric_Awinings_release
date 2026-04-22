import { motion, useReducedMotion } from 'framer-motion'
import { type FormEventHandler, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { LEGAL_SLUGS, staticPagePathBySlug } from '../../lib/legalPages'
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
  const REVIEW_PREVIEW_LIMIT = 190
  const reduce = useReducedMotion()
  const { home, staticPages } = useSiteSettings()
  const rv = home?.reviews
  const heading = rv?.heading ?? 'Отзывы клиентов'
  const subheading = rv?.subheading ?? 'Реальные заказчики B2B и частные лица.'
  const loadingText = rv?.loading ?? 'Загрузка отзывов…'
  const videoCaption = rv?.videoCaption ?? 'Видеоотзыв'
  const readMoreLabel = rv?.readMoreLabel ?? 'Читать весь отзыв'
  const collapseLabel = rv?.collapseLabel ?? 'Свернуть отзыв'
  const formHeading = rv?.formHeading ?? 'Оставить отзыв'
  const formSubheading =
    rv?.formSubheading ?? 'Публикуем только после проверки менеджером и подтверждения согласия.'
  const namePlaceholder = rv?.namePlaceholder ?? 'Имя'
  const cityPlaceholder = rv?.cityPlaceholder ?? 'Город'
  const textPlaceholder = rv?.textPlaceholder ?? 'Текст отзыва'
  const consentPrefix =
    rv?.consentPrefix ?? 'Согласен на публикацию отзыва и обработку персональных данных согласно'
  const consentLinkLabel = rv?.consentLinkLabel ?? 'политике конфиденциальности'
  const privacyPath = staticPagePathBySlug(staticPages, LEGAL_SLUGS.privacy, '/')
  const submitButton = rv?.submitButton ?? 'Отправить отзыв'
  const submittingLabel = rv?.submitting ?? 'Отправка...'
  const successMessage =
    rv?.successMessage ?? 'Спасибо! Отзыв получен и отправлен менеджеру на модерацию.'
  const errorMessage =
    rv?.errorMessage ?? 'Не удалось отправить отзыв. Проверьте поля и попробуйте еще раз.'

  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({})
  const [sending, setSending] = useState(false)
  const [submitOk, setSubmitOk] = useState<string>('')
  const [submitErr, setSubmitErr] = useState<string>('')
  const [form, setForm] = useState({
    name: '',
    city: '',
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
      text: form.text.trim(),
      publicationConsent: form.publicationConsent,
    })
    setSending(false)
    if (!ok) {
      setSubmitErr(errorMessage)
      return
    }
    setForm({ name: '', city: '', text: '', publicationConsent: false })
    setSubmitOk(successMessage)
  }

  const toggleReviewExpand = (reviewId: string) => {
    setExpandedReviews((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }))
  }

  return (
    <motion.section
      className="fabric-container min-w-0 py-12 md:py-24"
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
              className="flex h-full flex-col rounded-2xl border border-border-light bg-surface p-5 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.06)] md:p-6"
            >
              {(() => {
                const text = (r.text || '').trim()
                const isLong = text.length > REVIEW_PREVIEW_LIMIT
                const isExpanded = Boolean(expandedReviews[r.id])
                const previewText = isLong ? `${text.slice(0, REVIEW_PREVIEW_LIMIT).trimEnd()}...` : text
                const shownText = isExpanded ? text : previewText
                return (
                  <>
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
              <p className="mt-4 flex-1 font-body text-sm leading-relaxed text-text-muted md:text-[15px]">
                «{shownText}»
              </p>
              {isLong ? (
                <button
                  type="button"
                  onClick={() => toggleReviewExpand(r.id)}
                  className="mt-1 self-start font-body text-xs font-semibold text-accent transition hover:underline"
                >
                  {isExpanded ? collapseLabel : readMoreLabel}
                </button>
              ) : null}
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
                  </>
                )
              })()}
            </motion.article>
          ))}
        </motion.div>
      )}
      <div className="mt-10 rounded-2xl border border-border-light bg-surface p-5 md:p-6">
        <h3 className="font-heading text-2xl font-semibold text-text">{formHeading}</h3>
        <p className="mt-2 text-sm text-text-muted">{formSubheading}</p>
        <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <input
            className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder={namePlaceholder}
            value={form.name}
            onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
            required
            minLength={2}
            maxLength={120}
          />
          <input
            className="rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder={cityPlaceholder}
            value={form.city}
            onChange={(e) => setForm((v) => ({ ...v, city: e.target.value }))}
            required
            minLength={2}
            maxLength={120}
          />
          <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm md:col-span-2">
            <input
              id="review-consent"
              type="checkbox"
              checked={form.publicationConsent}
              onChange={(e) => setForm((v) => ({ ...v, publicationConsent: e.target.checked }))}
              required
            />
            <label htmlFor="review-consent">
              {consentPrefix}{' '}
              <Link to={privacyPath} className="text-accent hover:underline">
                {consentLinkLabel}
              </Link>
              .
            </label>
          </div>
          <textarea
            className="md:col-span-2 min-h-28 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder={textPlaceholder}
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
              {sending ? submittingLabel : submitButton}
            </button>
            {submitOk ? <p className="text-sm text-emerald-700">{submitOk}</p> : null}
            {submitErr ? <p className="text-sm text-rose-700">{submitErr}</p> : null}
          </div>
        </form>
      </div>
    </motion.section>
  )
}
