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
    isActive ? 'bg-accent/15 text-accent ring-1 ring-accent/30' : 'text-text hover:bg-primary/70'
  }`

function CartHeaderLink({ className = '' }: { className?: string }) {
  const { totalQty } = useCart()
  return (
    <NavLink
      to="/cart"
      className={({ isActive }) =>
        `relative flex h-11 w-11 items-center justify-center rounded-xl text-text hover:bg-primary/70 ${
          isActive ? 'bg-primary/80 text-accent' : ''
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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = window.localStorage.getItem('fabric:theme:v1')
      return saved === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })
  const reduce = useReducedMotion()
  const { totalQty } = useCart()
  const {
    enabledMarketplaces,
    globalMarketplaceUrls,
    siteName,
    logoUrl,
    phone,
    phoneHref,
    home,
    portfolioEnabled,
  } = useSiteSettings()
  const buyOnLabel = home?.ui?.buyOnMarketplaces ?? 'Купить на'
  const buyOnMobileLabel = home?.ui?.buyOnMarketplacesMobile ?? 'Купить на маркетплейсе'
  const mergedMpUrls: Partial<Record<(typeof MARKETPLACES)[number]['id'], string>> = {
    ...GLOBAL_MARKETPLACE_URLS,
    ...globalMarketplaceUrls,
  }

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    try {
      window.localStorage.setItem('fabric:theme:v1', theme)
    } catch {
      /* noop */
    }
  }, [theme])

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
    <header className="fabric-liquid-glass sticky top-0 z-50 border-b border-border bg-bg-base/90">
      <div className="fabric-container flex min-w-0 items-center justify-between gap-3 py-4 md:gap-4">
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
          {portfolioEnabled ? (
            <NavLink to="/portfolio" className={navLinkClass}>
              Портфолио
            </NavLink>
          ) : null}
          <NavLink to="/contacts" className={navLinkClass}>
            Контакты
          </NavLink>
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="fabric-theme-toggle hidden md:inline-flex"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            <span aria-hidden>{theme === 'dark' ? '☾' : '☀'}</span>
          </button>
          <NavLink
            to="/account"
            className={({ isActive }) =>
              `hidden h-11 items-center rounded-xl px-3 font-body text-sm font-medium text-text hover:bg-primary/70 md:inline-flex ${
                isActive ? 'bg-primary/70 text-accent' : ''
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
              className="fixed inset-0 top-[73px] z-40 cursor-default bg-[#060a11]/72 backdrop-blur-[3px] md:hidden"
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
              <div className="fabric-liquid-glass flex h-full min-h-0 flex-col border-l border-border shadow-[-16px_0_48px_rgba(0,0,0,0.42)]">
                <div className="fabric-liquid-glass-soft shrink-0 border-b border-border px-5 py-4">
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
                  {portfolioEnabled ? (
                    <NavLink to="/portfolio" className={mobileNavLinkClass} onClick={() => setOpen(false)}>
                      Портфолио
                    </NavLink>
                  ) : null}
                  <NavLink to="/contacts" className={mobileNavLinkClass} onClick={() => setOpen(false)}>
                    Контакты
                  </NavLink>
                  <NavLink to="/cart" className={mobileNavLinkClass} onClick={() => setOpen(false)}>
                    Корзина
                  </NavLink>
                  <NavLink to="/account" className={mobileNavLinkClass} onClick={() => setOpen(false)}>
                    Личный кабинет
                  </NavLink>
                  <button
                    type="button"
                    className="fabric-theme-toggle mt-1 justify-start rounded-2xl px-4"
                    onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                  >
                    <span aria-hidden>{theme === 'dark' ? '☾' : '☀'}</span>
                    <span className="font-body text-sm font-semibold">
                      {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
                    </span>
                  </button>
                  <a
                    href={phoneHref}
                    className="fabric-liquid-glass-soft mt-1 flex items-center gap-3 rounded-2xl border border-border px-4 py-4 font-body text-lg font-semibold text-accent shadow-sm ring-1 ring-border/70"
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
                  <div className="fabric-liquid-glass-soft mt-4 rounded-2xl border border-border p-4 shadow-inner">
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
      <nav className="fabric-liquid-glass fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-base/95 px-2 py-2 md:hidden">
        <div className="mx-auto flex max-w-[640px] items-stretch justify-between gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium ${
                isActive ? 'bg-accent/15 text-accent' : 'text-text-muted'
              }`
            }
          >
            <span className="inline-block h-1.5 w-6 rounded-full bg-current/80" aria-hidden />
            <span>Главная</span>
          </NavLink>
          <NavLink
            to="/catalog"
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium ${
                isActive ? 'bg-accent/15 text-accent' : 'text-text-muted'
              }`
            }
          >
            <span className="inline-block h-1.5 w-6 rounded-full bg-current/80" aria-hidden />
            <span>Каталог</span>
          </NavLink>
          {portfolioEnabled ? (
            <NavLink
              to="/portfolio"
              className={({ isActive }) =>
                `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium ${
                  isActive ? 'bg-accent/15 text-accent' : 'text-text-muted'
                }`
              }
            >
              <span className="inline-block h-1.5 w-6 rounded-full bg-current/80" aria-hidden />
              <span>Портфолио</span>
            </NavLink>
          ) : null}
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium ${
                isActive ? 'bg-accent/15 text-accent' : 'text-text-muted'
              }`
            }
          >
            <span className="inline-block h-1.5 w-6 rounded-full bg-current/80" aria-hidden />
            <span>Корзина</span>
            {totalQty > 0 ? (
              <span className="absolute right-3 top-1 rounded-full bg-accent px-1.5 text-[10px] text-white">
                {totalQty > 99 ? '99+' : totalQty}
              </span>
            ) : null}
          </NavLink>
          <NavLink
            to="/account"
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium ${
                isActive ? 'bg-accent/15 text-accent' : 'text-text-muted'
              }`
            }
          >
            <span className="inline-block h-1.5 w-6 rounded-full bg-current/80" aria-hidden />
            <span>Профиль</span>
          </NavLink>
        </div>
      </nav>
    </header>
  )
}
