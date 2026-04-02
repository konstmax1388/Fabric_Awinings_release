import { Link } from 'react-router-dom'
import { SITE, MARKETPLACES } from '../../config/site'
import { MarketplaceLinks } from '../icons/MarketplaceLinks'

export function SiteFooter() {
  return (
    <footer className="border-t border-border-light bg-bg-base">
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-heading text-xl font-semibold text-text">{SITE.name}</p>
            <p className="mt-3 max-w-xs font-body text-sm leading-relaxed text-text-muted">
              {SITE.tagline}. Производство и монтаж под ключ.
            </p>
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-text">Навигация</p>
            <ul className="mt-4 flex flex-col gap-2 font-body text-sm text-text-muted">
              <li>
                <Link to="/" className="hover:text-accent">
                  Главная
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="hover:text-accent">
                  Каталог
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-accent">
                  Портфолио
                </Link>
              </li>
              <li>
                <Link to="/contacts" className="hover:text-accent">
                  Контакты
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-accent">
                  Блог
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-text">Маркетплейсы</p>
            <div className="mt-4">
              <MarketplaceLinks />
            </div>
            <p className="mt-6 font-body text-sm font-semibold text-text">Соцсети</p>
            <ul className="mt-2 flex flex-col gap-1 font-body text-sm text-text-muted">
              <li>
                <a href="#" className="hover:text-accent">
                  ВКонтакте
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent">
                  Telegram
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-text">Контакты</p>
            <ul className="mt-4 flex flex-col gap-2 font-body text-sm text-text-muted">
              <li>
                <a href={SITE.phoneHref} className="hover:text-accent">
                  {SITE.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="hover:text-accent">
                  {SITE.email}
                </a>
              </li>
              <li>{SITE.address}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border-light pt-8 text-sm text-text-subtle md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. Все права защищены.</p>
          <div className="flex flex-wrap gap-4">
            {MARKETPLACES.map((m) => (
              <a
                key={m.id}
                href={m.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent"
              >
                {m.label}
              </a>
            ))}
            <a href="#" className="hover:text-accent">
              Политика конфиденциальности
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
