import { useCallback, useMemo, useState } from 'react'
import type { AboutPagePayload } from '../../types/aboutPage'
import { OptimizedImage } from '../ui/OptimizedImage'

type Props = {
  payload: AboutPagePayload
  pageTitle: string
}

function clampPct(n: number | undefined, fallback = 0): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback
  return Math.min(100, Math.max(0, n))
}

export function AboutPageLayout({ payload, pageTitle }: Props) {
  const intro = payload.intro
  const hasCustomIntroH1 = Boolean(intro && (intro.title || intro.titleAccent))
  const facts = payload.facts
  const reviews = payload.reviewsStrip
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [reviewIdx, setReviewIdx] = useState(0)

  const gallery = useMemo(
    () => (payload.spotlightGallery || []).filter((g) => (g.url || '').trim()),
    [payload.spotlightGallery],
  )
  const reviewItems = useMemo(() => reviews?.items?.filter((x) => (x.text || '').trim()) ?? [], [reviews?.items])

  const galleryNext = useCallback(() => {
    if (!gallery.length) return
    setGalleryIdx((i) => (i + 1) % gallery.length)
  }, [gallery.length])
  const galleryPrev = useCallback(() => {
    if (!gallery.length) return
    setGalleryIdx((i) => (i - 1 + gallery.length) % gallery.length)
  }, [gallery.length])

  const reviewNext = useCallback(() => {
    if (!reviewItems.length) return
    setReviewIdx((i) => (i + 1) % reviewItems.length)
  }, [reviewItems.length])
  const reviewPrev = useCallback(() => {
    if (!reviewItems.length) return
    setReviewIdx((i) => (i - 1 + reviewItems.length) % reviewItems.length)
  }, [reviewItems.length])

  const currentReview = reviewItems[reviewIdx]

  return (
    <div className="min-w-0 space-y-16 pb-16 pt-4 md:space-y-24 md:pt-6">
      {!hasCustomIntroH1 ? (
        <h1 className="font-heading text-3xl font-bold tracking-tight text-text md:text-4xl lg:text-5xl">{pageTitle}</h1>
      ) : null}
      {intro && (intro.paragraphs?.length || intro.title || intro.titleAccent || intro.imageUrl) ? (
        <section className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
          <div>
            {(intro.title || intro.titleAccent) && (
              <h1 className="font-heading text-3xl font-bold tracking-tight text-text md:text-4xl lg:text-5xl">
                {intro.title ? <span>{intro.title} </span> : null}
                {intro.titleAccent ? <span className="text-accent">{intro.titleAccent}</span> : null}
              </h1>
            )}
            <div className="mt-6 space-y-4 font-body text-base leading-relaxed text-text-muted md:text-lg">
              {(intro.paragraphs || []).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          {intro.imageUrl ? (
            <div className="relative overflow-hidden rounded-2xl border border-border-light bg-primary/20 shadow-lg">
              <OptimizedImage
                src={intro.imageUrl}
                alt={intro.imageAlt || pageTitle}
                widths={[400, 640, 960]}
                className="aspect-[4/3] w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {payload.featureBullets && payload.featureBullets.length > 0 ? (
        <section>
          <ul className="grid gap-4 sm:grid-cols-2 lg:gap-x-12 lg:gap-y-3">
            {payload.featureBullets.map((text, i) => (
              <li key={i} className="flex items-start gap-3 font-body text-text md:text-lg">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-text text-surface"
                  aria-hidden
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12.5l4 4L19 6.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {payload.spotlight && (gallery.length > 0 || payload.spotlight.eyebrow || payload.spotlight.line) ? (
        <section className="relative">
          {gallery.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-4 md:gap-3 md:pb-6">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setGalleryIdx(i)}
                  className={`relative h-40 w-52 shrink-0 overflow-hidden rounded-xl border transition md:h-48 md:w-64 ${
                    i === galleryIdx ? 'border-accent ring-2 ring-accent/30' : 'border-border-light opacity-90'
                  }`}
                >
                  {g.url ? (
                    <img src={g.url} alt={g.alt || ''} className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
          {(payload.spotlight.eyebrow || payload.spotlight.line) && (
            <div className="relative z-10 -mt-6 max-w-lg rounded-2xl bg-[#1e6bd6] px-6 py-5 text-surface shadow-xl md:-mt-10 md:px-8 md:py-6">
              {payload.spotlight.eyebrow ? (
                <p className="font-heading text-sm font-bold uppercase tracking-widest md:text-base">{payload.spotlight.eyebrow}</p>
              ) : null}
              {payload.spotlight.line ? <p className="mt-2 font-body text-sm opacity-95 md:text-base">{payload.spotlight.line}</p> : null}
            </div>
          )}
          {gallery.length > 1 ? (
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={galleryPrev}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-base text-text hover:border-accent"
                aria-label="Предыдущее фото"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={galleryNext}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-base text-text hover:border-accent"
                aria-label="Следующее фото"
              >
                ›
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {payload.manufacturer &&
      (payload.manufacturer.heading ||
        payload.manufacturer.lead ||
        payload.manufacturer.imageUrl ||
        payload.manufacturer.videoUrl) ? (
        <section className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
          <div className="relative">
            {payload.manufacturer.imageUrl ? (
              <div className="overflow-hidden rounded-2xl border border-border-light shadow-md">
                <img
                  src={payload.manufacturer.imageUrl}
                  alt={payload.manufacturer.imageAlt || ''}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : null}
            {payload.manufacturer.videoUrl ? (
              <a
                href={payload.manufacturer.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 left-4 flex max-w-[min(100%,280px)] items-center gap-3 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur-sm"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1e6bd6] text-surface" aria-hidden>
                  <svg className="ml-0.5 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                </span>
                <span>
                  <span className="block font-heading text-base font-semibold text-text">
                    {payload.manufacturer.videoCta || 'Смотреть видео'}
                  </span>
                  {payload.manufacturer.videoSub ? (
                    <span className="mt-0.5 block font-body text-xs text-text-muted">{payload.manufacturer.videoSub}</span>
                  ) : null}
                </span>
              </a>
            ) : null}
          </div>
          <div>
            {payload.manufacturer.heading ? (
              <h2 className="font-heading text-2xl font-bold text-text md:text-3xl">{payload.manufacturer.heading}</h2>
            ) : null}
            {payload.manufacturer.lead ? <p className="mt-4 font-body text-base text-text-muted md:text-lg">{payload.manufacturer.lead}</p> : null}
            {payload.manufacturer.legalText ? (
              <div className="mt-6 whitespace-pre-wrap font-body text-sm leading-relaxed text-text-muted">
                {payload.manufacturer.legalText}
              </div>
            ) : null}
            {payload.metrics && payload.metrics.length > 0 ? (
              <ul className="mt-8 space-y-4">
                {payload.metrics.map((m, i) => {
                  const w = clampPct(m.barPercent ?? m.valuePercent, 0)
                  return (
                    <li key={i}>
                      <p className="font-body text-sm font-medium text-text">{m.label}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-border">
                          <div className="h-full bg-text transition-[width]" style={{ width: `${w}%` }} />
                        </div>
                        <span className="shrink-0 rounded bg-text px-2 py-0.5 font-body text-xs font-medium text-surface">
                          {m.valuePercent != null ? `${Math.round(m.valuePercent)}%` : ''}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {facts && (facts.items?.length || facts.badge || facts.subtitle) ? (
        <section
          className="relative overflow-hidden rounded-2xl px-4 py-12 md:px-8 md:py-16"
          style={
            facts.backgroundUrl
              ? {
                  backgroundImage: `linear-gradient(rgba(8,12,20,0.75), rgba(8,12,20,0.85)), url(${facts.backgroundUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }
          }
        >
          <div className="relative z-[1] mx-auto max-w-3xl text-center">
            {facts.badge ? (
              <p className="inline-block rounded-md bg-[#1e6bd6] px-4 py-2 font-heading text-base font-bold text-surface md:text-lg">
                {facts.badge}
              </p>
            ) : null}
            {facts.subtitle ? (
              <p className="mt-4 font-body text-sm text-surface/90 md:text-base">{facts.subtitle}</p>
            ) : null}
          </div>
          {facts.items && facts.items.length > 0 ? (
            <ul className="relative z-[1] mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4 md:gap-4">
              {facts.items.map((it, i) => (
                <li key={i} className="text-center text-surface">
                  <p className="font-heading text-3xl font-bold tabular-nums md:text-4xl">{it.value}</p>
                  <p className="mt-2 inline-block rounded-md bg-surface px-2 py-1.5 font-body text-xs font-medium text-text md:text-sm">
                    {it.label}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {reviews && reviewItems.length > 0 && currentReview ? (
        <section className="text-center">
          {(reviews.title || reviews.titleAccent) && (
            <h2 className="font-heading text-2xl font-bold text-text md:text-3xl">
              {reviews.title ? <span>{reviews.title} </span> : null}
              {reviews.titleAccent ? <span className="text-accent">{reviews.titleAccent}</span> : null}
            </h2>
          )}
          {reviews.subtitle ? <p className="mx-auto mt-3 max-w-2xl font-body text-text-muted md:text-lg">{reviews.subtitle}</p> : null}
          <div className="relative mx-auto mt-10 max-w-3xl">
            <button
              type="button"
              onClick={reviewPrev}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-bg-base px-2 py-3 text-xl text-text hover:border-accent md:-left-4"
              aria-label="Предыдущий отзыв"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={reviewNext}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-bg-base px-2 py-3 text-xl text-text hover:border-accent md:-right-4"
              aria-label="Следующий отзыв"
            >
              ›
            </button>
            <div className="relative px-10 md:px-14">
              <span
                className="pointer-events-none absolute right-6 top-0 font-heading text-6xl font-bold leading-none text-border md:text-7xl"
                aria-hidden
              >
                ”
              </span>
              {currentReview.productTitle ? (
                <p className="font-heading text-lg font-semibold text-text md:text-xl">{currentReview.productTitle}</p>
              ) : null}
              {currentReview.text ? (
                <blockquote className="mt-4 font-body text-base leading-relaxed text-text-muted md:text-lg">«{currentReview.text}»</blockquote>
              ) : null}
              <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
                {currentReview.avatarUrl ? (
                  <img
                    src={currentReview.avatarUrl}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                    width={48}
                    height={48}
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/60 font-body text-sm text-text">
                    {(currentReview.authorName || '?').slice(0, 1)}
                  </div>
                )}
                <div className="text-left">
                  {currentReview.authorName ? <p className="font-body font-semibold text-text">{currentReview.authorName}</p> : null}
                  {currentReview.source ? <p className="font-body text-sm text-text-muted">{currentReview.source}</p> : null}
                </div>
              </div>
            </div>
            {reviewItems.length > 1 ? (
              <div className="mt-6 flex justify-center gap-2">
                {reviewItems.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReviewIdx(i)}
                    className={`h-2.5 w-2.5 rounded-full ${i === reviewIdx ? 'bg-accent ring-2 ring-accent/40' : 'bg-border'}`}
                    aria-label={`Слайд ${i + 1}`}
                    aria-current={i === reviewIdx}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}
