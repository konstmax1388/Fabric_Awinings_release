import { motion, useReducedMotion } from 'framer-motion'
import { type CSSProperties, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import type { HeroAction } from '../../types/homePage'
import { PulsingCTA } from '../motion/PulsingCTA'
import { easeOutSoft, fadeUpHidden, fadeUpVisible } from '../../lib/motion-presets'
import { HeroCallbackModal } from './HeroCallbackModal'

const FALLBACK_BG =
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80'

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
  'inline-flex h-14 min-h-[44px] items-center justify-center rounded-[40px] bg-accent px-8 font-body text-base font-medium text-surface hover:bg-[#c65f00]'
const secondaryBtnClass =
  'inline-flex h-14 min-h-[44px] items-center justify-center rounded-[40px] border-2 border-surface/80 bg-transparent px-8 font-body text-base font-medium text-surface hover:bg-surface/10'

export function HeroSection() {
  const reduce = useReducedMotion()
  const { home, calculatorEnabled } = useSiteSettings()
  const hero = home?.hero
  const from = reduce ? fadeUpVisible : fadeUpHidden
  const to = fadeUpVisible

  const [callbackOpen, setCallbackOpen] = useState(false)

  const title = hero?.title ?? 'Тенты на заказ'
  const subtitle =
    hero?.subtitle ??
    'Любая форма и размер: от навесов для техники до тентов для мероприятий. Своё производство — сроки и цена под контролем.'
  const ctaPrimary = hero?.ctaPrimary ?? 'Рассчитать стоимость'
  const ctaSecondary = hero?.ctaSecondary ?? 'Смотреть каталог'
  const heroBg = hero?.bgImageUrl?.trim() || FALLBACK_BG

  const primaryAction = hero?.primaryAction
  const secondaryAction = hero?.secondaryAction
  const primaryIsCallback = primaryAction?.type === 'callback'
  const secondaryIsCallback = secondaryAction?.type === 'callback'
  const primaryHref = resolveLinkHref(primaryAction, calculatorEnabled, 'primary')
  const secondaryHref = resolveLinkHref(secondaryAction, calculatorEnabled, 'secondary')

  const openCallback = () => setCallbackOpen(true)

  return (
    <section className="relative overflow-hidden rounded-[24px] md:mx-6 lg:mx-auto lg:max-w-[1280px]">
      <HeroCallbackModal
        open={callbackOpen}
        onClose={() => setCallbackOpen(false)}
        modal={hero?.callbackModal ?? {}}
      />
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/85 via-[#1a1a1a]/55 to-transparent" />
      <div className="relative px-4 py-16 md:px-10 md:py-24 lg:py-28">
        <div className="max-w-2xl">
          <motion.h1
            className="font-heading text-4xl font-black tracking-tight text-surface md:text-5xl lg:text-7xl"
            initial={from}
            animate={to}
            transition={{ ...easeOutSoft, delay: 0.08 }}
          >
            {title}
          </motion.h1>
          <motion.p
            className="mt-4 font-body text-lg text-surface/90 md:text-xl"
            initial={from}
            animate={to}
            transition={{ ...easeOutSoft, delay: 0.18 }}
          >
            {subtitle}
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap gap-4"
            initial={from}
            animate={to}
            transition={{ ...easeOutSoft, delay: 0.28 }}
          >
            <PulsingCTA>
              <motion.span
                whileHover={reduce ? undefined : { scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
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
            </PulsingCTA>
            <motion.span
              whileHover={reduce ? undefined : { scale: 1.02 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
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
          </motion.div>
        </div>
      </div>
    </section>
  )
}
