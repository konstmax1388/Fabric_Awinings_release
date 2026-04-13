import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { GLOBAL_MARKETPLACE_URLS, MARKETPLACES, type MarketplaceId } from '../../config/site'
import { MarketplaceLinks } from '../icons/MarketplaceLinks'

export function SiteFooter() {
  const {
    enabledMarketplaces,
    globalMarketplaceUrls,
    siteName,
    siteTagline,
    footerNote,
    phone,
    phoneHref,
    email,
    address,
    footerVkUrl,
    footerTelegramUrl,
    showSocialLinks,
  } = useSiteSettings()
  const mergedMpUrls = { ...GLOBAL_MARKETPLACE_URLS, ...globalMarketplaceUrls }
  const vkHref = footerVkUrl?.trim() || '#'
  const tgHref = footerTelegramUrl?.trim() || '#'

  return (
    <footer className="border-t border-border-light bg-bg-base">
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-heading text-xl font-semibold text-text">{siteName}</p>
            <p className="mt-3 max-w-xs font-body text-sm leading-relaxed text-text-muted">
              {siteTagline}. {footerNote}
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
              <MarketplaceLinks hrefById={mergedMpUrls} linkKeys={enabledMarketplaces} />
            </div>
            {showSocialLinks ? (
              <>
                <p className="mt-6 font-body text-sm font-semibold text-text">Соцсети</p>
                <ul className="mt-2 flex flex-col gap-1 font-body text-sm text-text-muted">
                  <li>
                    <a href={vkHref} className="hover:text-accent" target="_blank" rel="noopener noreferrer">
                      ВКонтакте
                    </a>
                  </li>
                  <li>
                    <a href={tgHref} className="hover:text-accent" target="_blank" rel="noopener noreferrer">
                      Telegram
                    </a>
                  </li>
                </ul>
              </>
            ) : null}
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-text">Контакты</p>
            <ul className="mt-4 flex flex-col gap-2 font-body text-sm text-text-muted">
              <li>
                <a href={phoneHref} className="hover:text-accent">
                  {phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${email}`} className="hover:text-accent">
                  {email}
                </a>
              </li>
              <li>{address}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border-light pt-8 text-sm text-text-subtle md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {siteName}. Все права защищены.
          </p>
          <div className="flex flex-wrap gap-4">
            {MARKETPLACES.filter((m) => enabledMarketplaces.includes(m.id as MarketplaceId)).map((m) => (
              <a
                key={m.id}
                href={mergedMpUrls[m.id] ?? m.href}
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
