import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { easeOutSoft, fadeUpHidden, fadeUpVisible } from '../../lib/motion-presets'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { TextWithBr } from '../ui/TextWithBr'

function isExternalHref(href: string) {
  return (
    /^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')
  )
}

function parseBullets(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
}

export function PurchasePathsSection() {
  const reduce = useReducedMotion()
  const { home } = useSiteSettings()
  const paths = home?.purchasePaths

  const eyebrow = paths?.eyebrow?.trim() || ''
  const heading = paths?.heading?.trim() || ''
  const subheading = paths?.subheading?.trim() || ''

  const readyTitle = paths?.readyTitle?.trim() || ''
  const readySubtitle = paths?.readySubtitle?.trim() || ''
  const readyPoints = parseBullets(paths?.readyBullets)
  const readyCta = paths?.readyCta?.trim() || ''
  const readyHref = paths?.readyHref?.trim() || ''

  const customTitle = paths?.customTitle?.trim() || ''
  const customSubtitle = paths?.customSubtitle?.trim() || ''
  const customPoints = parseBullets(paths?.customBullets)
  const customCta = paths?.customCta?.trim() || ''
  const customHref = paths?.customHref?.trim() || ''

  const hasHeader = Boolean(eyebrow || heading || subheading)
  const showReadyCta = Boolean(readyCta && readyHref)
  const showCustomCta = Boolean(customCta && customHref)
  const hasReadyCard = Boolean(readyTitle || readySubtitle || readyPoints.length > 0 || showReadyCta)
  const hasCustomCard = Boolean(customTitle || customSubtitle || customPoints.length > 0 || showCustomCta)
  const readyAboveCta = Boolean(readyTitle || readySubtitle || readyPoints.length > 0)
  const customAboveCta = Boolean(customTitle || customSubtitle || customPoints.length > 0)

  if (!hasHeader && !hasReadyCard && !hasCustomCard) {
    return null
  }

  return (
    <motion.section
      className="fabric-container min-w-0 py-8 md:py-12"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.2 }}
      transition={easeOutSoft}
    >
      <div className="fabric-card p-4 md:p-6">
        {hasHeader ? (
          <header className="space-y-3">
            {eyebrow ? (
              <p className="break-words font-heading text-xs uppercase tracking-[0.18em] text-accent md:text-sm">
                <TextWithBr text={eyebrow} />
              </p>
            ) : null}
            {heading ? (
              <h2 className="break-words font-heading text-2xl font-semibold text-text md:text-4xl">
                <TextWithBr text={heading} />
              </h2>
            ) : null}
            {subheading ? (
              <p className="max-w-3xl break-words font-body text-sm text-text-muted md:text-base">
                <TextWithBr text={subheading} />
              </p>
            ) : null}
          </header>
        ) : null}

        {hasReadyCard || hasCustomCard ? (
          <div
            className={`grid gap-4 ${hasHeader ? 'mt-6' : ''} ${hasReadyCard && hasCustomCard ? 'md:grid-cols-2' : 'md:max-w-xl md:mx-auto'}`}
          >
            {hasReadyCard ? (
              <motion.article
                className="rounded-2xl border border-border bg-bg-base/30 p-5"
                whileHover={reduce ? undefined : { y: -4 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              >
                {readyTitle ? (
                  <p className="break-words font-heading text-[11px] uppercase tracking-[0.16em] text-accent/90">
                    <TextWithBr text={readyTitle} />
                  </p>
                ) : null}
                {readySubtitle ? (
                  <h3
                    className={`break-words font-heading text-xl text-text ${readyTitle ? 'mt-2' : ''}`}
                  >
                    <TextWithBr text={readySubtitle} />
                  </h3>
                ) : null}
                {readyPoints.length > 0 ? (
                  <ul
                    className={`space-y-2 font-body text-sm text-text-muted ${readyTitle || readySubtitle ? 'mt-3' : ''}`}
                  >
                    {readyPoints.map((item, idx) => (
                      <li key={`ready-path-bullet-${idx}`} className="break-words">
                        <TextWithBr text={item} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {showReadyCta ? (
                  isExternalHref(readyHref) ? (
                    <a
                      href={readyHref}
                      className={`fabric-strap-btn inline-flex h-auto min-h-11 items-center justify-center rounded-full bg-accent px-5 py-2.5 font-body text-sm font-semibold text-bg-base hover:bg-[#d7ab67] ${
                        readyAboveCta ? 'mt-5' : ''
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <TextWithBr text={readyCta} />
                    </a>
                  ) : (
                    <Link
                      to={readyHref}
                      className={`fabric-strap-btn inline-flex h-auto min-h-11 items-center justify-center rounded-full bg-accent px-5 py-2.5 font-body text-sm font-semibold text-bg-base hover:bg-[#d7ab67] ${
                        readyAboveCta ? 'mt-5' : ''
                      }`}
                    >
                      <TextWithBr text={readyCta} />
                    </Link>
                  )
                ) : null}
              </motion.article>
            ) : null}

            {hasCustomCard ? (
              <motion.article
                className="rounded-2xl border border-accent/40 bg-accent/8 p-5"
                whileHover={reduce ? undefined : { y: -4 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              >
                {customTitle ? (
                  <p className="break-words font-heading text-[11px] uppercase tracking-[0.16em] text-accent">
                    <TextWithBr text={customTitle} />
                  </p>
                ) : null}
                {customSubtitle ? (
                  <h3
                    className={`break-words font-heading text-xl text-text ${customTitle ? 'mt-2' : ''}`}
                  >
                    <TextWithBr text={customSubtitle} />
                  </h3>
                ) : null}
                {customPoints.length > 0 ? (
                  <ul
                    className={`space-y-2 font-body text-sm text-text-muted ${customTitle || customSubtitle ? 'mt-3' : ''}`}
                  >
                    {customPoints.map((item, idx) => (
                      <li key={`custom-path-bullet-${idx}`} className="break-words">
                        <TextWithBr text={item} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {showCustomCta ? (
                  isExternalHref(customHref) ? (
                    <a
                      href={customHref}
                      className={`fabric-strap-btn inline-flex h-auto min-h-11 items-center justify-center rounded-full border border-accent/60 bg-transparent px-5 py-2.5 font-body text-sm font-semibold text-accent hover:bg-accent hover:text-bg-base ${
                        customAboveCta ? 'mt-5' : ''
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <TextWithBr text={customCta} />
                    </a>
                  ) : (
                    <a
                      href={customHref}
                      className={`fabric-strap-btn inline-flex h-auto min-h-11 items-center justify-center rounded-full border border-accent/60 bg-transparent px-5 py-2.5 font-body text-sm font-semibold text-accent hover:bg-accent hover:text-bg-base ${
                        customAboveCta ? 'mt-5' : ''
                      }`}
                    >
                      <TextWithBr text={customCta} />
                    </a>
                  )
                ) : null}
              </motion.article>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.section>
  )
}
