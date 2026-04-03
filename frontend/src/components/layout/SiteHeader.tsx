import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { GLOBAL_MARKETPLACE_URLS, MARKETPLACES, SITE } from '../../config/site'
import { PulsingCTA } from '../motion/PulsingCTA'
import { MarketplaceLinks } from '../icons/MarketplaceLinks'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `font-body text-base font-medium tracking-wide transition-colors hover:text-accent ${
    isActive ? 'text-accent' : 'text-text'
  }`

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()

  return (
    <header className="sticky top-0 z-50 border-b border-border-light bg-bg-base/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link
          to="/"
          className="font-heading text-xl font-semibold tracking-tight text-text md:text-2xl"
        >
          {SITE.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Основное меню">
          <NavLink to="/" end className={navLinkClass}>
            Главная
          </NavLink>
          <NavLink to="/catalog" className={navLinkClass}>
            Каталог
          </NavLink>
          <NavLink to="/portfolio" className={navLinkClass}>
            Портфолио
          </NavLink>
          <NavLink to="/contacts" className={navLinkClass}>
            Контакты
          </NavLink>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <MarketplaceLinks hrefById={GLOBAL_MARKETPLACE_URLS} />
          <a
            href={SITE.phoneHref}
            className="font-body text-sm font-medium text-text-muted hover:text-accent md:text-base"
          >
            {SITE.phone}
          </a>
          <PulsingCTA>
            <motion.span
              whileHover={reduce ? undefined : { scale: 1.02 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              className="inline-flex shadow-[0_4px_8px_0_rgba(232,122,0,0.25)]"
              style={{ borderRadius: 40 }}
            >
              <Link
                to="/#calculator"
                className="inline-flex h-11 items-center justify-center rounded-[40px] bg-accent px-6 font-body text-sm font-medium text-surface hover:bg-[#c65f00] md:h-14 md:px-8 md:text-base"
                style={{ letterSpacing: '0.02em' }}
              >
                Заказать расчёт
              </Link>
            </motion.span>
          </PulsingCTA>
        </div>

        <button
          type="button"
          className="relative flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl md:hidden"
          aria-expanded={open}
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setOpen((v) => !v)}
        >
          <motion.span
            className="block h-0.5 w-6 origin-center rounded bg-text"
            animate={open ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          <motion.span
            className="block h-0.5 w-6 rounded bg-text"
            animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="block h-0.5 w-6 origin-center rounded bg-text"
            animate={open ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 top-[73px] z-40 flex max-w-full flex-col bg-surface shadow-[-8px_0_24px_rgba(0,0,0,0.08)] md:hidden"
            initial={reduce ? undefined : { x: '100%', opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduce ? undefined : { x: '100%', opacity: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            <nav className="flex flex-col gap-1 p-6" aria-label="Мобильное меню">
              <NavLink
                to="/"
                end
                className="py-3 font-body text-lg font-medium"
                onClick={() => setOpen(false)}
              >
                Главная
              </NavLink>
              <NavLink
                to="/catalog"
                className="py-3 font-body text-lg font-medium"
                onClick={() => setOpen(false)}
              >
                Каталог
              </NavLink>
              <NavLink
                to="/portfolio"
                className="py-3 font-body text-lg font-medium"
                onClick={() => setOpen(false)}
              >
                Портфолио
              </NavLink>
              <NavLink
                to="/contacts"
                className="py-3 font-body text-lg font-medium"
                onClick={() => setOpen(false)}
              >
                Контакты
              </NavLink>
              <a href={SITE.phoneHref} className="py-3 font-body text-lg text-accent">
                {SITE.phone}
              </a>
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-sm text-text-muted">Маркетплейсы</p>
                <div className="flex flex-col gap-2">
                  {MARKETPLACES.map((m) => (
                    <a
                      key={m.id}
                      href={m.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-text-muted hover:text-accent"
                    >
                      {m.label}
                    </a>
                  ))}
                </div>
              </div>
              <Link
                to="/#calculator"
                className="mt-6 inline-flex h-14 items-center justify-center rounded-[40px] bg-accent font-body font-medium text-surface"
                style={{ letterSpacing: '0.02em' }}
                onClick={() => setOpen(false)}
              >
                Заказать расчёт
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
