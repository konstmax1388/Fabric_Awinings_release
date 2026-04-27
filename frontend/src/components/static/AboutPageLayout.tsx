import { useCallback, useMemo, useState } from 'react'
import type { AboutIntro, AboutManufacturer, AboutPagePayload } from '../../types/aboutPage'
import { AboutFactValue } from './AboutFactValue'

type Props = {
  payload: AboutPagePayload
  pageTitle: string
}

function clampPct(n: number | undefined, fallback = 0): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback
  return Math.min(100, Math.max(0, n))
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
  const intro = payload.intro
  const hasCustomIntroH1 = Boolean(intro && (intro.title || intro.titleAccent))
  const facts = payload.facts
  const [galleryIdx, setGalleryIdx] = useState(0)

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
        <h1 className="font-heading text-3xl font-bold tracking-tight text-text md:text-4xl lg:text-5xl">{pageTitle}</h1>
      ) : null}
      {intro &&
      (intro.paragraphs?.length ||
        intro.title ||
        intro.titleAccent ||
        intro.imageUrl ||
        intro.videoUrl) ? (
        <section className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
          <div>
            {(intro.title || intro.titleAccent) && (
              <h1 className="font-heading text-3xl font-bold tracking-tight text-text md:text-4xl lg:text-5xl">
                {intro.title ? <span>{intro.title} </span> : null}
                {intro.titleAccent ? <span className="text-text">{intro.titleAccent}</span> : null}
              </h1>
            )}
            <div className="mt-6 space-y-4 font-body text-base leading-relaxed text-text-muted md:text-lg">
              {(intro.paragraphs || []).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          {intro.imageUrl || intro.videoUrl ? (
            <div className="min-w-0">
              <IntroMedia intro={intro} pageTitle={pageTitle} />
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
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text shadow-sm"
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

      {gallery.length > 0 ? (
        <section className="rounded-2xl border border-border bg-bg-base/40 p-4 shadow-sm md:p-6">
          <div className="flex gap-2 overflow-x-auto pb-1 md:gap-3">
            {gallery.map((g, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGalleryIdx(i)}
                className={`relative h-40 w-52 shrink-0 overflow-hidden rounded-xl border transition md:h-48 md:w-64 ${
                  i === galleryIdx
                    ? 'border-text/35 ring-1 ring-border'
                    : 'border-border/80 opacity-95 hover:opacity-100'
                }`}
              >
                {g.url ? (
                  <img src={g.url} alt={g.alt || ''} className="h-full w-full object-cover" loading="lazy" />
                ) : null}
              </button>
            ))}
          </div>
          {gallery.length > 1 ? (
            <div className="mt-4 flex justify-end gap-2">
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
          <div className="relative min-w-0">
            <ManufacturerMedia m={payload.manufacturer} />
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
                          <div className="h-full bg-text/30 transition-[width]" style={{ width: `${w}%` }} />
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

      {showFacts && facts ? (
        <section
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
        >
          <div className="relative z-[1] mx-auto max-w-3xl text-center">
            {facts.badge ? (
              <p className="inline-block rounded-lg border border-border bg-surface/90 px-4 py-2 font-heading text-base font-bold text-text shadow-sm md:text-lg">
                {facts.badge}
              </p>
            ) : null}
            {facts.subtitle ? (
              <p
                className={`mt-4 font-body text-sm md:text-base ${factsOnPhoto ? 'text-surface/90' : 'text-text-muted'}`}
              >
                {facts.subtitle}
              </p>
            ) : null}
          </div>
          {facts.items && facts.items.length > 0 ? (
            <ul className="relative z-[1] mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4 md:gap-4">
              {facts.items.map((it, i) => (
                <li key={i} className={`text-center ${factsOnPhoto ? 'text-surface' : 'text-text'}`}>
                  <AboutFactValue
                    value={it.value != null ? String(it.value) : ''}
                    className="font-heading text-3xl font-bold tabular-nums md:text-4xl"
                  />
                  <p className="mt-2 inline-block rounded-md border border-border/40 bg-surface/95 px-2 py-1.5 font-body text-xs font-medium text-text shadow-sm md:text-sm">
                    {it.label}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
