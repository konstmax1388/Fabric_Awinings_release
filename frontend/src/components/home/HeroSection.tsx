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
  'inline-flex h-14 min-h-[44px] max-w-full items-center justify-center rounded-[40px] bg-accent px-5 font-body text-base font-medium text-surface hover:bg-[#c65f00] sm:px-8'
const secondaryBtnClass =
  'inline-flex h-14 min-h-[44px] max-w-full items-center justify-center rounded-[40px] border-2 border-surface/80 bg-transparent px-5 font-body text-base font-medium text-surface hover:bg-surface/10 sm:px-8'

export function HeroSection() {
  const reduce = useReducedMotion()
  const { home, calculatorEnabled } = useSiteSettings()
  const hero = home?.hero
  const from = reduce ? fadeUpVisible : fadeUpHidden
  const to = fadeUpVisible

  const [callbackOpen, setCallbackOpen] = useState(false)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)

  const title = hero?.title ?? ''
  const subtitle = hero?.subtitle ?? ''
  const ctaPrimary = hero?.ctaPrimary ?? ''
  const ctaSecondary = hero?.ctaSecondary ?? ''
  const heroBg = hero?.bgImageUrl?.trim() || ''

  const primaryAction = hero?.primaryAction
  const secondaryAction = hero?.secondaryAction
  const primaryIsCallback = primaryAction?.type === 'callback'
  const secondaryIsCallback = secondaryAction?.type === 'callback'
  const primaryHref = resolveLinkHref(primaryAction, calculatorEnabled, 'primary')
  const secondaryHref = resolveLinkHref(secondaryAction, calculatorEnabled, 'secondary')

  const openCallback = () => setCallbackOpen(true)
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
    <section className="relative min-w-0 overflow-hidden rounded-[24px] md:mx-6 lg:mx-auto lg:max-w-[1280px]">
      <HeroCallbackModal
        open={callbackOpen}
        onClose={() => setCallbackOpen(false)}
        modal={hero?.callbackModal ?? {}}
      />
      {heroBg ? (
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
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
        className="relative px-4 py-16 md:px-10 md:py-24 lg:py-28"
        animate={{ x: depth.textX, y: depth.textY }}
        transition={{ type: 'spring', stiffness: 74, damping: 16 }}
      >
        <div className="max-w-2xl min-w-0">
          <motion.h1
            className="break-words font-heading text-4xl font-black tracking-tight text-surface md:text-5xl lg:text-7xl"
            initial={from}
            animate={to}
            transition={{ ...easeOutSoft, delay: 0.08 }}
          >
            {title}
          </motion.h1>
          <motion.p
            className="mt-4 break-words font-body text-lg text-surface/90 md:text-xl"
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
        </div>
      </motion.div>
    </section>
  )
}
