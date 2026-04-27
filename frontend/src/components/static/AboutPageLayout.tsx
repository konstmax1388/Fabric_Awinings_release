import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { AboutIntro, AboutManufacturer, AboutMetric, AboutPagePayload } from '../../types/aboutPage'
import { AboutFactValue } from './AboutFactValue'

const ABOUT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const ABOUT_VIEW = { once: true, amount: 0.2 } as const

type Props = {
  payload: AboutPagePayload
  pageTitle: string
}

function clampPct(n: number | undefined, fallback = 0): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback
  return Math.min(100, Math.max(0, n))
}

function AboutMetricRow({ m, index }: { m: AboutMetric; index: number }) {
  const w = clampPct(m.barPercent ?? m.valuePercent, 0)
  const reduce = useReducedMotion()
  const barRef = useRef<HTMLDivElement>(null)
  const inView = useInView(barRef, { once: true, amount: 0.45, margin: '0px 0px -8% 0px' })
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 10 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={ABOUT_VIEW}
      transition={{ duration: 0.5, delay: reduce ? 0 : index * 0.06, ease: ABOUT_EASE }}
    >
      <p className="font-body text-sm font-medium text-text">{m.label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <div
          ref={barRef}
          className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-border"
        >
          <motion.div
            className="h-full rounded-sm bg-gradient-to-r from-text/20 via-text/40 to-text/30"
            initial={reduce ? { width: `${w}%` } : { width: 0 }}
            animate={reduce || inView ? { width: `${w}%` } : { width: 0 }}
            transition={{ duration: reduce ? 0 : 1.12, delay: reduce ? 0 : 0.08 + index * 0.1, ease: ABOUT_EASE }}
          />
        </div>
        <span className="shrink-0 rounded bg-text px-2 py-0.5 font-body text-xs font-medium text-surface">
          {m.valuePercent != null ? `${Math.round(m.valuePercent)}%` : ''}
        </span>
      </div>
    </motion.li>
  )
}

function isDirectVideoUrl(url: string | undefined): boolean {
  const u = (url || '').trim()
  if (!u) return false
  return /\.(mp4|webm|ogg|ogv)(\?|#|$)/i.test(u.toLowerCase())
}

function ManufacturerMedia({ m }: { m: AboutManufacturer }) {
  const videoUrl = m.videoUrl?.trim()
  const imageUrl = m.imageUrl?.trim()
  const direct = isDirectVideoUrl(videoUrl)

  if (direct && videoUrl) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
        <video
          className="aspect-[4/3] w-full object-cover"
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
        />
      </div>
    )
  }

  if (imageUrl) {
    return (
      <div className="relative">
        <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
          <img
            src={imageUrl}
            alt={m.imageAlt || ''}
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        {videoUrl && !direct ? (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 left-4 flex max-w-[min(100%,280px)] items-center gap-3 rounded-xl border border-border/80 bg-bg-base/95 p-3 shadow-lg backdrop-blur-sm"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text" aria-hidden>
              <svg className="ml-0.5 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            </span>
            <span>
              <span className="block font-heading text-base font-semibold text-text">{m.videoCta || 'Смотреть видео'}</span>
              {m.videoSub ? <span className="mt-0.5 block font-body text-xs text-text-muted">{m.videoSub}</span> : null}
            </span>
          </a>
        ) : null}
      </div>
    )
  }

  if (videoUrl && !direct) {
    return (
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-bg-base/40 p-4 shadow-sm"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text" aria-hidden>
          <svg className="ml-0.5 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        </span>
        <span>
          <span className="block font-heading text-base font-semibold text-text">{m.videoCta || 'Смотреть видео'}</span>
          {m.videoSub ? <span className="mt-0.5 block font-body text-xs text-text-muted">{m.videoSub}</span> : null}
        </span>
      </a>
    )
  }

  return null
}

function IntroMedia({ intro, pageTitle }: { intro: AboutIntro; pageTitle: string }) {
  const m: AboutManufacturer = {
    imageUrl: intro.imageUrl,
    imageAlt: intro.imageAlt || pageTitle,
    videoUrl: intro.videoUrl,
    videoCta: intro.videoCta,
    videoSub: intro.videoSub,
  }
  return <ManufacturerMedia m={m} />
}

export function AboutPageLayout({ payload, pageTitle }: Props) {
  const reduce = useReducedMotion()
  const intro = payload.intro
  const hasCustomIntroH1 = Boolean(intro && (intro.title || intro.titleAccent))
  const facts = payload.facts
  const [galleryIdx, setGalleryIdx] = useState(0)
  const blockEnter = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: ABOUT_VIEW,
          transition: { duration: 0.6, delay, ease: ABOUT_EASE },
        }

  const gallery = useMemo(
    () => (payload.spotlightGallery || []).filter((g) => (g.url || '').trim()),
    [payload.spotlightGallery],
  )

  const galleryNext = useCallback(() => {
    if (!gallery.length) return
    setGalleryIdx((i) => (i + 1) % gallery.length)
  }, [gallery.length])
  const galleryPrev = useCallback(() => {
    if (!gallery.length) return
    setGalleryIdx((i) => (i - 1 + gallery.length) % gallery.length)
  }, [gallery.length])

  const showFacts = Boolean(facts && (facts.items?.length || facts.badge || facts.subtitle))
  const factsOnPhoto = showFacts && Boolean(facts?.backgroundUrl)

  return (
    <div className="min-w-0 space-y-16 pb-8 pt-4 md:space-y-20 md:pt-6">
      {!hasCustomIntroH1 ? (
        <motion.h1
          className="font-heading text-3xl font-bold tracking-tight text-text md:text-4xl lg:text-5xl"
          {...blockEnter(0)}
        >
          {pageTitle}
        </motion.h1>
      ) : null}
      {intro &&
      (intro.paragraphs?.length ||
        intro.title ||
        intro.titleAccent ||
        intro.imageUrl ||
        intro.videoUrl) ? (
        <motion.section
          className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12"
          {...blockEnter(0)}
        >
          <div>
            {(intro.title || intro.titleAccent) && (
              <h1 className="font-heading text-3xl font-bold tracking-tight text-text md:text-4xl lg:text-5xl">
                {intro.title ? <span>{intro.title} </span> : null}
                {intro.titleAccent ? <span className="text-text">{intro.titleAccent}</span> : null}
              </h1>
            )}
            <motion.div
              className="mt-6 space-y-4 font-body text-base leading-relaxed text-text-muted md:text-lg"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={ABOUT_VIEW}
              transition={{ duration: 0.55, delay: reduce ? 0 : 0.12, ease: ABOUT_EASE }}
            >
              {(intro.paragraphs || []).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </motion.div>
          </div>
          {intro.imageUrl || intro.videoUrl ? (
            <motion.div
              className="min-w-0"
              initial={reduce ? false : { opacity: 0, scale: 0.98 }}
              whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
              viewport={ABOUT_VIEW}
              transition={{ duration: 0.65, delay: reduce ? 0 : 0.08, ease: ABOUT_EASE }}
            >
              <IntroMedia intro={intro} pageTitle={pageTitle} />
            </motion.div>
          ) : null}
        </motion.section>
      ) : null}

      {payload.featureBullets && payload.featureBullets.length > 0 ? (
        <motion.section {...blockEnter(0)}>
          <ul className="grid gap-4 sm:grid-cols-2 lg:gap-x-12 lg:gap-y-3">
            {payload.featureBullets.map((text, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-3 font-body text-text md:text-lg"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={ABOUT_VIEW}
                transition={{ duration: 0.5, delay: reduce ? 0 : 0.06 * i, ease: ABOUT_EASE }}
              >
                <motion.span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text shadow-sm"
                  aria-hidden
                  initial={reduce ? false : { scale: 0.85, opacity: 0 }}
                  whileInView={reduce ? undefined : { scale: 1, opacity: 1 }}
                  viewport={ABOUT_VIEW}
                  transition={{ type: 'spring', stiffness: 400, damping: 22, delay: reduce ? 0 : 0.04 * i }}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12.5l4 4L19 6.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
                <span>{text}</span>
              </motion.li>
            ))}
          </ul>
        </motion.section>
      ) : null}

      {gallery.length > 0 ? (
        <motion.section
          className="rounded-2xl border border-border bg-bg-base/40 p-4 shadow-sm md:p-6"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={ABOUT_VIEW}
          transition={{ duration: 0.6, ease: ABOUT_EASE }}
        >
          <div className="flex gap-2 overflow-x-auto pb-1 md:gap-3">
            {gallery.map((g, i) => (
              <motion.button
                key={i}
                type="button"
                onClick={() => setGalleryIdx(i)}
                className={`relative h-40 w-52 shrink-0 overflow-hidden rounded-xl border transition md:h-48 md:w-64 ${
                  i === galleryIdx
                    ? 'border-text/35 ring-1 ring-border'
                    : 'border-border/80 opacity-95 hover:opacity-100'
                }`}
                initial={reduce ? false : { opacity: 0, y: 14, scale: 0.98 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
                viewport={ABOUT_VIEW}
                transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.07, ease: ABOUT_EASE }}
              >
                {g.url ? (
                  <img src={g.url} alt={g.alt || ''} className="h-full w-full object-cover" loading="lazy" />
                ) : null}
              </motion.button>
            ))}
          </div>
          {gallery.length > 1 ? (
            <motion.div
              className="mt-4 flex justify-end gap-2"
              initial={reduce ? false : { opacity: 0 }}
              whileInView={reduce ? undefined : { opacity: 1 }}
              viewport={ABOUT_VIEW}
              transition={{ delay: 0.15, duration: 0.35 }}
            >
              <button
                type="button"
                onClick={galleryPrev}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-base text-text transition hover:border-text/40"
                aria-label="Предыдущее фото"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={galleryNext}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-base text-text transition hover:border-text/40"
                aria-label="Следующее фото"
              >
                ›
              </button>
            </motion.div>
          ) : null}
        </motion.section>
      ) : null}

      {payload.manufacturer &&
      (payload.manufacturer.heading ||
        payload.manufacturer.lead ||
        payload.manufacturer.imageUrl ||
        payload.manufacturer.videoUrl) ? (
        <motion.section
          className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={ABOUT_VIEW}
          transition={{ duration: 0.65, ease: ABOUT_EASE }}
        >
          <motion.div
            className="relative min-w-0"
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
            viewport={ABOUT_VIEW}
            transition={{ duration: 0.65, ease: ABOUT_EASE }}
          >
            <ManufacturerMedia m={payload.manufacturer} />
          </motion.div>
          <div>
            {payload.manufacturer.heading ? (
              <h2 className="font-heading text-2xl font-bold text-text md:text-3xl">
                {payload.manufacturer.heading}
              </h2>
            ) : null}
            {payload.manufacturer.heading ? (
              <motion.div
                className="mt-3 h-0.5 w-12 max-w-full origin-left rounded-full bg-gradient-to-r from-accent/60 to-transparent"
                initial={reduce ? false : { scaleX: 0, opacity: 0 }}
                whileInView={reduce ? undefined : { scaleX: 1, opacity: 1 }}
                viewport={ABOUT_VIEW}
                transition={{ duration: 0.55, delay: 0.05, ease: ABOUT_EASE }}
              />
            ) : null}
            {payload.manufacturer.lead ? (
              <motion.p
                className="mt-4 font-body text-base text-text-muted md:text-lg"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={ABOUT_VIEW}
                transition={{ duration: 0.5, delay: 0.1, ease: ABOUT_EASE }}
              >
                {payload.manufacturer.lead}
              </motion.p>
            ) : null}
            {payload.manufacturer.legalText ? (
              <div className="mt-6 whitespace-pre-wrap font-body text-sm leading-relaxed text-text-muted">
                {payload.manufacturer.legalText}
              </div>
            ) : null}
            {payload.metrics && payload.metrics.length > 0 ? (
              <ul className="mt-8 space-y-4">
                {payload.metrics.map((m, i) => (
                  <AboutMetricRow key={i} m={m} index={i} />
                ))}
              </ul>
            ) : null}
          </div>
        </motion.section>
      ) : null}

      {showFacts && facts ? (
        <motion.section
          className={`relative overflow-hidden rounded-2xl border border-border/50 px-4 py-12 md:px-8 md:py-16 ${
            !factsOnPhoto ? 'bg-surface/50' : ''
          }`}
          style={
            factsOnPhoto
              ? {
                  backgroundImage: `linear-gradient(135deg, rgba(8,12,20,0.82) 0%, rgba(8,12,20,0.7) 100%), url(${facts.backgroundUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={ABOUT_VIEW}
          transition={{ duration: 0.7, ease: ABOUT_EASE }}
        >
          <div className="relative z-[1] mx-auto max-w-3xl text-center">
            {facts.badge ? (
              <motion.p
                className="inline-block rounded-lg border border-border bg-surface/90 px-4 py-2 font-heading text-base font-bold text-text shadow-sm md:text-lg"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={ABOUT_VIEW}
                transition={{ duration: 0.55, ease: ABOUT_EASE }}
              >
                {facts.badge}
              </motion.p>
            ) : null}
            {facts.subtitle ? (
              <motion.p
                className={`mt-4 font-body text-sm md:text-base ${factsOnPhoto ? 'text-surface/90' : 'text-text-muted'}`}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={ABOUT_VIEW}
                transition={{ duration: 0.5, delay: 0.08, ease: ABOUT_EASE }}
              >
                {facts.subtitle}
              </motion.p>
            ) : null}
          </div>
          {facts.items && facts.items.length > 0 ? (
            <ul className="relative z-[1] mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4 md:gap-4">
              {facts.items.map((it, i) => (
                <motion.li
                  key={i}
                  className={`text-center ${factsOnPhoto ? 'text-surface' : 'text-text'}`}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={ABOUT_VIEW}
                  transition={{ duration: 0.5, delay: reduce ? 0 : 0.08 * i, ease: ABOUT_EASE }}
                >
                  <motion.div
                    className="mx-auto mb-2 h-0.5 w-9 origin-center rounded-full bg-gradient-to-r from-transparent via-accent/55 to-transparent shadow-[0_0_12px_rgba(200,155,83,0.25)] md:mb-3"
                    initial={reduce ? false : { scaleX: 0, opacity: 0 }}
                    whileInView={reduce ? undefined : { scaleX: 1, opacity: 1 }}
                    viewport={ABOUT_VIEW}
                    transition={{ duration: 0.5, delay: reduce ? 0 : 0.04 + i * 0.06, ease: ABOUT_EASE }}
                  />
                  <AboutFactValue
                    value={it.value != null ? String(it.value) : ''}
                    className="font-heading text-3xl font-bold tabular-nums md:text-4xl"
                  />
                  <p className="mt-2 inline-block rounded-md border border-border/40 bg-surface/95 px-2 py-1.5 font-body text-xs font-medium text-text shadow-sm md:text-sm">
                    {it.label}
                  </p>
                </motion.li>
              ))}
            </ul>
          ) : null}
        </motion.section>
      ) : null}
    </div>
  )
}
