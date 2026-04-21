import { motion, useReducedMotion } from 'framer-motion'
import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import type { HeroAction } from '../../types/homePage'
import { MagneticHover } from '../motion/MagneticHover'
import { PulsingCTA } from '../motion/PulsingCTA'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, subtleButtonHover, cardHoverTransition } from '../../lib/motion-presets'
import { HeroCallbackModal } from './HeroCallbackModal'

function isExternalHref(href: string) {
  return (
    /^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')
  )
}

function HeroCtaLink({
  href,
  className,
  style,
  children,
}: {
  href: string
  className: string
  style?: CSSProperties
  children: React.ReactNode
}) {
  if (isExternalHref(href)) {
    return (
      <a href={href} className={className} style={style} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link to={href} className={className} style={style}>
      {children}
    </Link>
  )
}

function resolveLinkHref(
  action: HeroAction | undefined,
  calculatorEnabled: boolean,
  role: 'primary' | 'secondary',
): string {
  if (action?.type === 'callback') return ''
  const h = action?.href?.trim() || ''
  if (h) return h
  if (role === 'primary') return calculatorEnabled ? '/#calculator' : '/catalog'
  return '/catalog'
}

const primaryBtnClass =
  'fabric-strap-btn inline-flex h-14 min-h-[44px] max-w-full items-center justify-center rounded-[40px] bg-accent px-5 font-body text-base font-medium text-surface hover:bg-[#c65f00] sm:px-8'
const secondaryBtnClass =
  'fabric-strap-btn inline-flex h-14 min-h-[44px] max-w-full items-center justify-center rounded-[40px] border-2 border-surface/80 bg-transparent px-5 font-body text-base font-medium text-surface hover:bg-surface/10 sm:px-8'
const HERO_VIDEO_START_TIMEOUT_MS = 5000

export function HeroSection() {
  const reduce = useReducedMotion()
  const { home, calculatorEnabled } = useSiteSettings()
  const hero = home?.hero
  const from = reduce ? fadeUpVisible : fadeUpHidden
  const to = fadeUpVisible

  const [callbackOpen, setCallbackOpen] = useState(false)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [failedVideoBySlide, setFailedVideoBySlide] = useState<Record<number, boolean>>({})
  const [startedVideoBySlide, setStartedVideoBySlide] = useState<Record<number, boolean>>({})

  const title = hero?.title ?? ''
  const subtitle = hero?.subtitle ?? ''
  const eyebrow = hero?.eyebrow?.trim() || ''
  const usp = hero?.usp?.trim() || ''
  const trustLine = hero?.trustLine?.trim() || ''
  const trustItems = Array.isArray(hero?.trustItems)
    ? hero.trustItems.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
    : []
  const heroStats = Array.isArray(hero?.stats)
    ? hero.stats
        .map((item) => ({
          value: String(item?.value || '').trim(),
          label: String(item?.label || '').trim(),
        }))
        .filter((item) => item.value && item.label)
        .slice(0, 3)
    : []
  const ctaPrimary = hero?.ctaPrimary ?? ''
  const ctaSecondary = hero?.ctaSecondary ?? ''
  const heroBg = hero?.bgImageUrl?.trim() || ''

  const slides = useMemo(() => {
    const raw = Array.isArray(hero?.slides) ? hero.slides : []
    const normalized = raw
      .map((s) => {
        if (!s || typeof s !== 'object') return null
        const imageUrl = typeof s.imageUrl === 'string' ? s.imageUrl.trim() : ''
        const videoUrl = typeof s.videoUrl === 'string' ? s.videoUrl.trim() : ''
        if (!imageUrl && !videoUrl) return null
        return { imageUrl, videoUrl }
      })
      .filter((s): s is { imageUrl: string; videoUrl: string } => s !== null)
    if (normalized.length) return normalized
    return heroBg ? [{ imageUrl: heroBg, videoUrl: '' }] : []
  }, [hero?.slides, heroBg])

  const hasSlides = slides.length > 0
  const activeSlide = hasSlides ? slides[currentSlide % slides.length] : null
  const activeImageUrl = activeSlide?.imageUrl || ''
  const activeVideoUrl = activeSlide?.videoUrl || ''
  const shouldShowVideo = Boolean(activeVideoUrl) && !failedVideoBySlide[currentSlide]
  const hasStartedActiveVideo = Boolean(startedVideoBySlide[currentSlide])

  const primaryAction = hero?.primaryAction
  const secondaryAction = hero?.secondaryAction
  const primaryIsCallback = primaryAction?.type === 'callback'
  const secondaryIsCallback = secondaryAction?.type === 'callback'
  const primaryHref = resolveLinkHref(primaryAction, calculatorEnabled, 'primary')
  const secondaryHref = resolveLinkHref(secondaryAction, calculatorEnabled, 'secondary')

  const openCallback = () => setCallbackOpen(true)

  useEffect(() => {
    if (slides.length <= 1) return
    const id = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 7000)
    return () => window.clearInterval(id)
  }, [slides.length])

  useEffect(() => {
    if (slides.length <= 1) {
      setCurrentSlide(0)
      return
    }
    setCurrentSlide((prev) => (prev >= slides.length ? 0 : prev))
  }, [slides.length])

  useEffect(() => {
    if (!shouldShowVideo || hasStartedActiveVideo) return
    const slideAtStart = currentSlide
    const timerId = window.setTimeout(() => {
      setFailedVideoBySlide((prev) => ({
        ...prev,
        [slideAtStart]: true,
      }))
    }, HERO_VIDEO_START_TIMEOUT_MS)
    return () => window.clearTimeout(timerId)
  }, [currentSlide, hasStartedActiveVideo, shouldShowVideo])
  useEffect(() => {
    if (reduce) return
    const onScroll = () => setScrollY(window.scrollY)
    const onMove = (e: MouseEvent) => {
      const x = e.clientX / Math.max(1, window.innerWidth) - 0.5
      const y = e.clientY / Math.max(1, window.innerHeight) - 0.5
      setMouse({ x, y })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMove)
    }
  }, [reduce])

  const depth = useMemo(() => {
    if (reduce) return { bgX: 0, bgY: 0, textX: 0, textY: 0, gradX: 0, gradY: 0 }
    const scrollShift = Math.min(30, scrollY * 0.05)
    return {
      bgX: mouse.x * 22,
      bgY: mouse.y * 16 + scrollShift,
      textX: -mouse.x * 12,
      textY: -mouse.y * 7 - scrollShift * 0.26,
      gradX: mouse.x * 16,
      gradY: mouse.y * 12 + scrollShift * 0.62,
    }
  }, [mouse.x, mouse.y, reduce, scrollY])

  return (
    <section className="fabric-container relative min-w-0 overflow-hidden rounded-[24px]">
      <HeroCallbackModal
        open={callbackOpen}
        onClose={() => setCallbackOpen(false)}
        modal={hero?.callbackModal ?? {}}
      />
      {shouldShowVideo ? (
        <motion.video
          key={`hero-video-${currentSlide}`}
          className="absolute inset-0 h-full w-full object-cover"
          src={activeVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={activeImageUrl || undefined}
          onError={() =>
            setFailedVideoBySlide((prev) => ({
              ...prev,
              [currentSlide]: true,
            }))
          }
          onPlaying={() =>
            setStartedVideoBySlide((prev) => ({
              ...prev,
              [currentSlide]: true,
            }))
          }
          onStalled={() =>
            setFailedVideoBySlide((prev) => ({
              ...prev,
              [currentSlide]: true,
            }))
          }
          onAbort={() =>
            setFailedVideoBySlide((prev) => ({
              ...prev,
              [currentSlide]: true,
            }))
          }
          animate={{ x: depth.bgX, y: depth.bgY, scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 62, damping: 16, mass: 1.2 }}
          aria-hidden
        />
      ) : activeImageUrl ? (
        <motion.div
          key={`hero-image-${currentSlide}`}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${activeImageUrl})` }}
          animate={{ x: depth.bgX, y: depth.bgY, scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 62, damping: 16, mass: 1.2 }}
          aria-hidden
        />
      ) : null}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/85 via-[#1a1a1a]/55 to-transparent"
        animate={{ x: depth.gradX, y: depth.gradY }}
        transition={{ type: 'spring', stiffness: 56, damping: 14 }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_24%,rgba(232,122,0,0.2),transparent_42%)]"
        animate={{ opacity: [0.12, 0.28, 0.12] }}
        transition={{ duration: 7.2, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden
      />
      <motion.div
        className="fabric-liquid-glass pointer-events-none absolute inset-y-8 right-6 hidden w-[38%] rounded-[28px] lg:block"
        initial={reduce ? false : { opacity: 0, x: 26 }}
        animate={reduce ? undefined : { opacity: 1, x: 0 }}
        transition={{ ...easeOutSoft, delay: 0.34 }}
        aria-hidden
      />
      <motion.div
        className="relative px-4 py-16 md:px-10 md:py-24 lg:py-28"
        animate={{ x: depth.textX, y: depth.textY }}
        transition={{ type: 'spring', stiffness: 74, damping: 16 }}
      >
        <div className="max-w-2xl min-w-0">
          {eyebrow ? (
            <motion.p
              className="fabric-hero-badge"
              initial={from}
              animate={to}
              transition={{ ...easeOutSoft, delay: 0.03 }}
            >
              {eyebrow}
            </motion.p>
          ) : null}
          {usp ? (
            <motion.p
              className="mt-5 font-heading text-sm uppercase tracking-[0.2em] text-accent sm:text-base"
              initial={from}
              animate={to}
              transition={{ ...easeOutSoft, delay: 0.06 }}
            >
              {usp}
            </motion.p>
          ) : null}
          <motion.h1
            className="fabric-h1 mt-4 break-words text-surface"
            initial={from}
            animate={to}
            transition={{ ...easeOutSoft, delay: 0.08 }}
          >
            {title}
          </motion.h1>
          <motion.p
            className="fabric-body mt-4 break-words text-surface/90"
            initial={from}
            animate={to}
            transition={{ ...easeOutSoft, delay: 0.18 }}
          >
            {subtitle}
          </motion.p>
          <motion.div
            className="mt-8 flex min-w-0 flex-wrap gap-3 sm:gap-4"
            initial={from}
            animate={to}
            transition={{ ...easeOutSoft, delay: 0.28 }}
          >
            {ctaPrimary.trim() ? (
              <PulsingCTA>
                <MagneticHover radius={155} strength={0.21}>
                  <motion.span
                    whileHover={reduce ? undefined : subtleButtonHover}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    transition={cardHoverTransition}
                    className="inline-flex shadow-[0_4px_8px_0_rgba(232,122,0,0.35)]"
                    style={{ borderRadius: 40 }}
                  >
                    {primaryIsCallback ? (
                      <button
                        type="button"
                        onClick={openCallback}
                        className={primaryBtnClass}
                        style={{ letterSpacing: '0.02em' }}
                      >
                        {ctaPrimary}
                      </button>
                    ) : (
                      <HeroCtaLink href={primaryHref} className={primaryBtnClass} style={{ letterSpacing: '0.02em' }}>
                        {ctaPrimary}
                      </HeroCtaLink>
                    )}
                  </motion.span>
                </MagneticHover>
              </PulsingCTA>
            ) : null}
            {ctaSecondary.trim() ? (
              <MagneticHover radius={145} strength={0.18}>
                <motion.span
                  whileHover={reduce ? undefined : subtleButtonHover}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  transition={cardHoverTransition}
                  className="inline-flex rounded-[40px]"
                >
                  {secondaryIsCallback ? (
                    <button
                      type="button"
                      onClick={openCallback}
                      className={secondaryBtnClass}
                      style={{ letterSpacing: '0.02em' }}
                    >
                      {ctaSecondary}
                    </button>
                  ) : (
                    <HeroCtaLink href={secondaryHref} className={secondaryBtnClass} style={{ letterSpacing: '0.02em' }}>
                      {ctaSecondary}
                    </HeroCtaLink>
                  )}
                </motion.span>
              </MagneticHover>
            ) : null}
          </motion.div>
          {heroStats.length ? (
            <motion.div
              className="fabric-liquid-glass-soft mt-8 grid max-w-xl grid-cols-1 gap-2 rounded-2xl p-3 sm:grid-cols-3"
              initial={from}
              animate={to}
              transition={{ ...easeOutSoft, delay: 0.35 }}
            >
              {heroStats.map((item, idx) => (
                <div
                  key={`hero-stat-${idx}`}
                  className="fabric-liquid-glass-soft rounded-xl px-3 py-2 text-center"
                >
                  <p className="font-heading text-lg text-surface">{item.value}</p>
                  <p className="font-body text-[11px] uppercase tracking-wider text-surface/75">{item.label}</p>
                </div>
              ))}
            </motion.div>
          ) : null}
          {trustLine || trustItems.length ? (
            <motion.div
              className="mt-6 space-y-3"
              initial={from}
              animate={to}
              transition={{ ...easeOutSoft, delay: 0.4 }}
            >
              {trustLine ? <p className="font-body text-sm text-surface/85 sm:text-base">{trustLine}</p> : null}
              {trustItems.length ? (
                <div className="flex flex-wrap gap-2">
                  {trustItems.map((item, idx) => (
                    <span
                      key={`hero-trust-${idx}`}
                      className="fabric-liquid-glass-soft inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-surface/90"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </motion.div>
          ) : null}
          {slides.length > 1 ? (
            <div className="mt-6 flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={`hero-slide-dot-${idx}`}
                  type="button"
                  aria-label={`Слайд ${idx + 1}`}
                  aria-pressed={idx === currentSlide}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === currentSlide ? 'w-8 bg-accent' : 'w-2.5 bg-surface/55 hover:bg-surface/80'
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </motion.div>
    </section>
  )
}
