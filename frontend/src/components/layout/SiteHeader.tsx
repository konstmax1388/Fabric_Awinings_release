import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { GLOBAL_MARKETPLACE_URLS, MARKETPLACES } from '../../config/site'
import { MagneticHover } from '../motion/MagneticHover'
import { useCart } from '../../hooks/useCart'
import { MarketplaceLinks } from '../icons/MarketplaceLinks'
import { OptimizedImage } from '../ui/OptimizedImage'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `font-body text-base font-medium tracking-wide transition-colors hover:text-accent ${
    isActive ? 'text-accent' : 'text-text'
  }`

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-2xl px-4 py-3.5 font-body text-[17px] font-semibold tracking-wide transition-colors ${
    isActive ? 'bg-accent/12 text-accent ring-1 ring-accent/25' : 'text-text hover:bg-[#EDE6DB]'
  }`

function CartHeaderLink({ className = '' }: { className?: string }) {
  const { totalQty } = useCart()
  return (
    <NavLink
      to="/cart"
      className={({ isActive }) =>
        `relative flex h-11 w-11 items-center justify-center rounded-xl text-text hover:bg-[#F5F0E8] ${
          isActive ? 'bg-[#F5F0E8] text-accent' : ''
        } ${className}`
      }
      aria-label={`Корзина${totalQty ? `, ${totalQty} поз.` : ''}`}
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="20" r="1" fill="currentColor" />
        <circle cx="17" cy="20" r="1" fill="currentColor" />
      </svg>
      {totalQty > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-body text-[10px] font-bold text-surface">
          {totalQty > 99 ? '99+' : totalQty}
        </span>
      )}
    </NavLink>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [logoBroken, setLogoBroken] = useState(false)
  const reduce = useReducedMotion()
  const {
    enabledMarketplaces,
    globalMarketplaceUrls,
    siteName,
    logoUrl,
    phone,
    phoneHref,
    home,
  } = useSiteSettings()
  const buyOnLabel = home?.ui?.buyOnMarketplaces ?? 'Купить на'
  const buyOnMobileLabel = home?.ui?.buyOnMarketplacesMobile ?? 'Купить на маркетплейсе'
  const mergedMpUrls: Partial<Record<(typeof MARKETPLACES)[number]['id'], string>> = {
    ...GLOBAL_MARKETPLACE_URLS,
    ...globalMarketplaceUrls,
  }

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-border-light bg-bg-base/95 backdrop-blur-md">
      <div className="mx-auto flex min-w-0 max-w-[1280px] items-center justify-between gap-3 px-4 py-4 md:gap-4 md:px-6">
        <Link
          to="/"
          className="flex min-w-0 max-w-[min(100%,220px)] items-center gap-2 md:max-w-[280px]"
          aria-label={siteName}
        >
          {!logoBroken ? (
            <OptimizedImage
              src={logoUrl}
              alt=""
              priority
              widths={[160, 320, 480]}
              sizes="(max-width: 768px) 160px, 200px"
              className="h-8 w-auto max-h-10 max-w-full object-contain object-left md:h-10"
              onError={() => setLogoBroken(true)}
            />
          ) : (
            <span className="font-heading text-xl font-semibold tracking-tight text-text md:text-2xl">
              {siteName}
            </span>
          )}
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

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <NavLink
            to="/account"
            className={({ isActive }) =>
              `hidden h-11 items-center rounded-xl px-3 font-body text-sm font-medium text-text hover:bg-[#F5F0E8] md:inline-flex ${
                isActive ? 'bg-[#F5F0E8] text-accent' : ''
              }`
            }
          >
            Кабинет
          </NavLink>
          <CartHeaderLink />
          <div className="hidden items-center gap-2.5 md:flex">
            <span className="hidden shrink-0 font-body text-[11px] font-medium text-text-muted xl:inline">
              {buyOnLabel}
            </span>
            <MarketplaceLinks compact hrefById={mergedMpUrls} linkKeys={enabledMarketplaces} />
            <span className="hidden h-8 w-px bg-border-light xl:block" aria-hidden />
            <MagneticHover radius={90} strength={0.1}>
              <a
                href={phoneHref}
                className="font-body text-sm font-medium text-text-muted hover:text-accent lg:text-base"
              >
                {phone}
              </a>
            </MagneticHover>
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
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              key="mobile-menu-backdrop"
              className="fixed inset-0 top-[73px] z-40 cursor-default bg-[#1a1a1a]/50 backdrop-blur-[3px] md:hidden"
              initial={reduce ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-label="Закрыть меню"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="mobile-menu-panel"
              className="fixed inset-y-0 right-0 top-[73px] z-[45] flex h-[calc(100dvh-73px)] w-full max-w-[min(100dvw,400px)] flex-col md:hidden"
              initial={reduce ? undefined : { x: '100%' }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduce ? undefined : { x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            >
              <div className="flex h-full min-h-0 flex-col border-l border-border-light bg-bg-base shadow-[-16px_0_48px_rgba(0,0,0,0.14)]">
                <div className="shrink-0 border-b border-border-light/80 bg-surface/90 px-5 py-4">
                  <p className="font-heading text-lg font-semibold text-text">Меню</p>
                  <p className="mt-0.5 font-body text-xs text-text-muted">Разделы сайта и контакты</p>
                </div>
                <nav
                  className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain px-4 py-5"
                  aria-label="Мобильное меню"
                >
                  <NavLink to="/" end className={mobileNavLinkClass} onClick={() => setOpen(false)}>
                    Главная
                  </NavLink>
                  <NavLink to="/catalog" className={mobileNavLinkClass} onClick={() => setOpen(false)}>
                    Каталог
                  </NavLink>
                  <NavLink to="/portfolio" className={mobileNavLinkClass} onClick={() => setOpen(false)}>
                    Портфолио
                  </NavLink>
                  <NavLink to="/contacts" className={mobileNavLinkClass} onClick={() => setOpen(false)}>
                    Контакты
                  </NavLink>
                  <NavLink to="/cart" className={mobileNavLinkClass} onClick={() => setOpen(false)}>
                    Корзина
                  </NavLink>
                  <NavLink to="/account" className={mobileNavLinkClass} onClick={() => setOpen(false)}>
                    Личный кабинет
                  </NavLink>
                  <a
                    href={phoneHref}
                    className="mt-1 flex items-center gap-3 rounded-2xl border border-border-light bg-surface px-4 py-4 font-body text-lg font-semibold text-accent shadow-sm ring-1 ring-border-light/60"
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent" aria-hidden>
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </span>
                    <span className="min-w-0 break-words">{phone}</span>
                  </a>
                  <div className="mt-4 rounded-2xl border border-border-light bg-surface/80 p-4 shadow-inner">
                    <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wider text-text-muted">
                      {buyOnMobileLabel}
                    </p>
                    <MarketplaceLinks compact hrefById={mergedMpUrls} linkKeys={enabledMarketplaces} />
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
