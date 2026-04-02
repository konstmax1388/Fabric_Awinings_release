import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { SITE, MARKETPLACES } from '../../config/site'
import { MarketplaceLinks } from '../icons/MarketplaceLinks'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `font-body text-base font-medium tracking-wide transition-colors hover:text-accent ${
    isActive ? 'text-accent' : 'text-text'
  }`

export function SiteHeader() {
  const [open, setOpen] = useState(false)

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
          <MarketplaceLinks />
          <a
            href={SITE.phoneHref}
            className="font-body text-sm font-medium text-text-muted hover:text-accent md:text-base"
          >
            {SITE.phone}
          </a>
          <Link
            to="/#calculator"
            className="inline-flex h-11 items-center justify-center rounded-[40px] bg-accent px-6 font-body text-sm font-medium text-surface shadow-[0_4px_8px_0_rgba(232,122,0,0.25)] transition hover:scale-[1.02] hover:bg-[#c65f00] md:h-14 md:px-8 md:text-base"
            style={{ letterSpacing: '0.02em' }}
          >
            Заказать расчёт
          </Link>
        </div>

        <button
          type="button"
          className="relative flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl md:hidden"
          aria-expanded={open}
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`block h-0.5 w-6 origin-center rounded bg-text transition ${
              open ? 'translate-y-2 rotate-45' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 rounded bg-text transition ${open ? 'scale-0 opacity-0' : ''}`}
          />
          <span
            className={`block h-0.5 w-6 origin-center rounded bg-text transition ${
              open ? '-translate-y-2 -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 top-[73px] z-40 flex flex-col bg-surface shadow-[-8px_0_24px_rgba(0,0,0,0.08)] md:hidden">
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
              <div className="flex gap-3">
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
        </div>
      )}
    </header>
  )
}
