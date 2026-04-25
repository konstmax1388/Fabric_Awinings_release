import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { buildMainNavItems, type MainNavItem } from '../../lib/headerNav'
import { GLOBAL_MARKETPLACE_URLS, MARKETPLACES } from '../../config/site'
import { MagneticHover } from '../motion/MagneticHover'
import { useCart } from '../../hooks/useCart'
import { MarketplaceLinks } from '../icons/MarketplaceLinks'
import { OptimizedImage } from '../ui/OptimizedImage'
import { HeaderSearchPanel } from './HeaderSearchPanel'

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-2xl px-4 py-3.5 font-body text-[17px] font-semibold tracking-wide transition-colors ${
    isActive ? 'bg-accent/15 text-accent ring-1 ring-accent/30' : 'text-text hover:bg-primary/70'
  }`

const mobileBarIcon = 'h-[22px] w-[22px] shrink-0'
function MobileBarHomeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  )
}
function MobileBarBagIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" />
      <path d="M4.2 7.2h15.6l-1.4 8.5a2 2 0 0 1-2 1.6H7.5a2 2 0 0 1-1.9-1.4L4.2 7.2Z" />
    </svg>
  )
}
function MobileBarGridIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
function MobileBarCartIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6.5 6h12l-1.2 6H7.2L6.5 6Z" />
      <path d="M6.5 6L5.5 3.5H3" />
      <circle cx="9" cy="20" r="1" fill="currentColor" />
      <circle cx="16" cy="20" r="1" fill="currentColor" />
    </svg>
  )
}
function MobileBarUserIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7.5" r="3.5" />
    </svg>
  )
}

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
  const headerRef = useRef<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const openHeaderSearch = useCallback(() => {
    setOpen(false)
    setSearchOpen(true)
  }, [])
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
    staticPages,
    headerNavigation,
  } = useSiteSettings()
  const buyOnLabel = home?.ui?.buyOnMarketplaces ?? 'Купить на'
  const buyOnMobileLabel = home?.ui?.buyOnMarketplacesMobile ?? 'Купить на маркетплейсе'
  const navHomeLabel = home?.ui?.navHome ?? 'Главная'
  const navCatalogLabel = home?.ui?.navCatalog ?? 'Каталог'
  const navPortfolioLabel = home?.ui?.navPortfolio ?? 'Портфолио'
  const navCartLabel = home?.ui?.navCart ?? 'Корзина'
  const navAccountLabel = home?.ui?.navAccount ?? 'Личный кабинет'
  const navMenuTitle = home?.ui?.navMenuTitle ?? 'Меню'
  const navMenuSubtitle = home?.ui?.navMenuSubtitle ?? 'Разделы сайта и контакты'
  const mobileBarProfileLabel = home?.ui?.mobileBarProfile ?? 'Профиль'
  const mainMenuAria = home?.ui?.headerMainMenuAria ?? 'Основное меню'
  const themeToLightAria = home?.ui?.headerThemeToLightAria ?? 'Включить светлую тему'
  const themeToDarkAria = home?.ui?.headerThemeToDarkAria ?? 'Включить тёмную тему'
  const themeLightTitle = home?.ui?.headerThemeLightTitle ?? 'Светлая тема'
  const themeDarkTitle = home?.ui?.headerThemeDarkTitle ?? 'Тёмная тема'
  const menuOpenAria = home?.ui?.headerMenuOpenAria ?? 'Открыть меню'
  const menuCloseAria = home?.ui?.headerMenuCloseAria ?? 'Закрыть меню'
  const mobileMenuAria = home?.ui?.headerMobileMenuAria ?? 'Мобильное меню'
  const bottomNavAria = home?.ui?.headerBottomNavAria ?? 'Нижняя навигация'
  const mergedMpUrls: Partial<Record<(typeof MARKETPLACES)[number]['id'], string>> = {
    ...GLOBAL_MARKETPLACE_URLS,
    ...globalMarketplaceUrls,
  }
  const mainNavItems = useMemo(
    () => buildMainNavItems(headerNavigation, home?.ui, { portfolioEnabled, staticPages }),
    [headerNavigation, home?.ui, portfolioEnabled, staticPages],
  )

  useEffect(() => {
    const root = document.documentElement
    const node = headerRef.current
    if (!node) return
    const update = () => {
      root.style.setProperty('--site-header-height', `${Math.ceil(node.getBoundingClientRect().height)}px`)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(node)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

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

  const mobileBarTabActive =
    theme === 'dark'
      ? '-mb-0 -mt-2.5 rounded-t-[14px] border border-b-0 border-accent/30 bg-primary/85 px-1.5 pb-1.5 pt-2.5 text-accent shadow-[0_-6px_24px_rgba(200,155,83,0.14)]'
      : '-mb-0 -mt-2.5 rounded-t-[14px] border border-b-0 border-accent/40 bg-surface px-1.5 pb-1.5 pt-2.5 text-accent shadow-[0_-4px_20px_rgba(180,134,58,0.1)]'
  const mobileBarTabIdle = 'py-1.5 text-text-muted'

  return (
    <>
    <header
      ref={headerRef}
      className="fabric-liquid-glass sticky inset-x-0 top-0 z-50 border-b border-border bg-bg-base/90 md:fixed md:top-0"
    >
      <div className="fabric-container flex min-w-0 flex-nowrap items-center gap-2 py-3 md:grid md:grid-cols-[minmax(7rem,auto)_minmax(0,1fr)_auto] md:items-center md:gap-3 md:py-2.5">
        <Link
          to="/"
          className="fabric-logo-link flex min-w-[7rem] shrink-0 max-w-[min(280px,42vw)] items-center md:min-w-0"
          aria-label={siteName}
        >
          {!logoBroken ? (
            <OptimizedImage
              src={logoUrl}
              alt=""
              priority
              widths={[160, 320, 480]}
              sizes="(max-width: 768px) 200px, min(280px, 28vw)"
              className="fabric-header-logo h-11 w-auto min-h-[40px] max-h-[52px] max-w-full object-contain object-left md:h-12"
              data-logo-tone={theme === 'dark' ? 'white' : 'black'}
              onError={() => setLogoBroken(true)}
            />
          ) : (
            <span className="font-heading text-xl font-semibold tracking-tight text-text md:text-2xl">
              {siteName}
            </span>
          )}
        </Link>

        <nav
          className="no-scrollbar hidden min-w-0 overflow-y-visible md:mx-0 md:flex md:max-w-none md:justify-center"
          aria-label={mainMenuAria}
        >
          <div className="flex max-w-full min-w-0 items-center justify-center gap-1.5 overflow-x-auto px-0.5 text-sm [scrollbar-width:none] sm:gap-2.5 md:gap-3 [&::-webkit-scrollbar]:hidden lg:gap-4">
            {mainNavItems.map((item: MainNavItem) => (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 font-body text-sm font-medium tracking-wide transition-colors first:pl-0 last:pr-0 sm:text-base md:text-sm lg:text-base ${
                    isActive ? 'text-accent' : 'text-text hover:text-accent'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
          <button
            type="button"
            className="fabric-theme-toggle hidden h-9 w-9 items-center justify-center md:inline-flex md:rounded-full md:text-lg"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? themeToLightAria : themeToDarkAria}
            title={theme === 'dark' ? themeLightTitle : themeDarkTitle}
          >
            <span aria-hidden>{theme === 'dark' ? '☾' : '☀'}</span>
          </button>
          <NavLink
            to="/account"
            className={({ isActive }) =>
              `hidden h-10 w-10 items-center justify-center rounded-full border text-text transition md:inline-flex ${
                isActive
                  ? 'border-accent/50 bg-primary/80 text-accent'
                  : 'border-border/50 bg-primary/30 hover:border-accent/40 hover:bg-primary/50'
              }`
            }
            title={navAccountLabel}
            aria-label={navAccountLabel}
          >
            <span className="h-[22px] w-[22px]" aria-hidden>
              <MobileBarUserIcon className="h-full w-full" />
            </span>
          </NavLink>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-primary/15 text-text transition hover:border-accent/50 hover:bg-primary/35 md:border-border/50 md:bg-primary/20"
            onClick={openHeaderSearch}
            aria-label="Поиск по каталогу"
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
            title="Поиск"
          >
            <span className="material-symbols-outlined text-[22px] leading-none" aria-hidden>
              search
            </span>
          </button>
          <CartHeaderLink className="rounded-full border border-border/40 bg-primary/15 hover:border-accent/50 md:border-border/50 md:bg-primary/20" />
          <div className="hidden min-w-0 items-center gap-2 lg:flex">
            <span className="shrink-0 font-body text-[10px] font-medium uppercase tracking-wide text-text-muted xl:text-[11px]">
              {buyOnLabel}
            </span>
            <MarketplaceLinks compact hrefById={mergedMpUrls} linkKeys={enabledMarketplaces} />
            <span className="h-6 w-px bg-border-light" aria-hidden />
            <MagneticHover radius={90} strength={0.1}>
              <a
                href={phoneHref}
                className="max-w-[8.5rem] shrink-0 truncate font-body text-xs font-medium text-text-muted hover:text-accent sm:max-w-none sm:text-sm"
                title={phone}
              >
                {phone}
              </a>
            </MagneticHover>
          </div>
          <button
            type="button"
            className="relative flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl md:hidden"
            aria-expanded={open}
            aria-label={open ? menuCloseAria : menuOpenAria}
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
              className={[
                'fixed inset-0 z-40 cursor-default md:hidden',
                theme === 'dark' ? 'bg-[#060a11]' : 'bg-[#0f172a]',
              ].join(' ')}
              style={{ top: 'var(--site-header-height)' }}
              initial={reduce ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-label={menuCloseAria}
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="mobile-menu-panel"
              className={[
                'fixed inset-y-0 right-0 z-[45] flex w-full max-w-[min(100dvw,400px)] flex-col md:hidden',
                theme === 'dark'
                  ? 'shadow-[-16px_0_48px_rgba(0,0,0,0.52)]'
                  : 'shadow-[-10px_0_36px_rgba(15,23,42,0.16)]',
              ].join(' ')}
              style={{ top: 'var(--site-header-height)', height: 'calc(100dvh - var(--site-header-height))' }}
              initial={reduce ? undefined : { x: '100%' }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduce ? undefined : { x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            >
              <div className="flex h-full min-h-0 flex-col border-l border-border bg-bg-base">
                <div className="shrink-0 border-b border-border bg-bg-base px-5 py-4">
                  <p className="font-heading text-lg font-semibold text-text">{navMenuTitle}</p>
                  <p className="mt-0.5 font-body text-xs text-text-muted">{navMenuSubtitle}</p>
                </div>
                <nav
                  className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain px-4 py-5"
                  aria-label={mobileMenuAria}
                >
                  {mainNavItems.map((item: MainNavItem) => (
                    <NavLink
                      key={item.key}
                      to={item.to}
                      end={item.end}
                      className={mobileNavLinkClass}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  <NavLink to="/cart" className={mobileNavLinkClass} onClick={() => setOpen(false)}>
                    {navCartLabel}
                  </NavLink>
                  <NavLink to="/account" className={mobileNavLinkClass} onClick={() => setOpen(false)}>
                    {navAccountLabel}
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
                  <div className="mt-4 rounded-2xl border border-border bg-bg-base p-4">
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
      <div className="hidden md:block" style={{ height: 'var(--site-header-height)' }} aria-hidden />
      <nav
        className={[
          'fixed inset-x-0 bottom-0 z-40 md:hidden',
          'border-t pb-[calc(env(safe-area-inset-bottom)+0.5rem)]',
          'px-1.5 pt-1',
          theme === 'dark'
            ? 'border-border bg-bg-base/95 shadow-[0_-10px_32px_rgba(0,0,0,0.42)]'
            : 'border-border bg-bg-base/98 shadow-[0_-8px_28px_rgba(36,39,48,0.08)]',
        ].join(' ')}
        aria-label={bottomNavAria}
      >
        <div className="mx-auto flex max-w-[640px] items-end justify-between gap-0.5">
          <NavLink
            to="/"
            end
            className="flex min-w-0 flex-1 justify-center"
          >
            {({ isActive }) => (
              <div
                className={[
                  'flex w-full max-w-[92px] flex-col items-center justify-end text-center',
                  isActive ? mobileBarTabActive : mobileBarTabIdle,
                ].join(' ')}
              >
                <MobileBarHomeIcon className={mobileBarIcon} />
                <span className="mt-0.5 text-[10px] font-semibold leading-tight tracking-tight">{navHomeLabel}</span>
              </div>
            )}
          </NavLink>
          <NavLink
            to="/catalog"
            className="flex min-w-0 flex-1 justify-center"
          >
            {({ isActive }) => (
              <div
                className={[
                  'flex w-full max-w-[92px] flex-col items-center justify-end text-center',
                  isActive ? mobileBarTabActive : mobileBarTabIdle,
                ].join(' ')}
              >
                <MobileBarBagIcon className={mobileBarIcon} />
                <span className="mt-0.5 text-[10px] font-semibold leading-tight tracking-tight">{navCatalogLabel}</span>
              </div>
            )}
          </NavLink>
          {portfolioEnabled ? (
            <NavLink
              to="/portfolio"
              className="flex min-w-0 flex-1 justify-center"
            >
              {({ isActive }) => (
                <div
                  className={[
                    'flex w-full max-w-[92px] flex-col items-center justify-end text-center',
                    isActive ? mobileBarTabActive : mobileBarTabIdle,
                  ].join(' ')}
                >
                  <MobileBarGridIcon className={mobileBarIcon} />
                  <span className="mt-0.5 text-[10px] font-semibold leading-tight tracking-tight">{navPortfolioLabel}</span>
                </div>
              )}
            </NavLink>
          ) : null}
          <NavLink
            to="/cart"
            className="flex min-w-0 flex-1 justify-center"
          >
            {({ isActive }) => (
              <div
                className={[
                  'relative flex w-full max-w-[92px] flex-col items-center justify-end text-center',
                  isActive ? mobileBarTabActive : mobileBarTabIdle,
                ].join(' ')}
              >
                <span className="relative inline-flex">
                  <MobileBarCartIcon className={mobileBarIcon} />
                  {totalQty > 0 ? (
                    <span
                      className="absolute -right-2 -top-0.5 min-w-[1.1rem] rounded-full bg-accent px-0.5 text-center font-body text-[9px] font-bold text-surface ring-1 ring-border/30"
                    >
                      {totalQty > 99 ? '99+' : totalQty}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 text-[10px] font-semibold leading-tight tracking-tight">{navCartLabel}</span>
              </div>
            )}
          </NavLink>
          <NavLink
            to="/account"
            className="flex min-w-0 flex-1 justify-center"
          >
            {({ isActive }) => (
              <div
                className={[
                  'flex w-full max-w-[92px] flex-col items-center justify-end text-center',
                  isActive ? mobileBarTabActive : mobileBarTabIdle,
                ].join(' ')}
              >
                <MobileBarUserIcon className={mobileBarIcon} />
                <span className="mt-0.5 text-[10px] font-semibold leading-tight tracking-tight">{mobileBarProfileLabel}</span>
              </div>
            )}
          </NavLink>
        </div>
      </nav>
      <HeaderSearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
