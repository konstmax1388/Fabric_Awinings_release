import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { LEGAL_SLUGS, staticPagePathBySlug } from '../../lib/legalPages'
import { getPublicAdminLinks } from '../../config/adminLinks'
import { GLOBAL_MARKETPLACE_URLS } from '../../config/site'
import { MarketplaceLinks } from '../icons/MarketplaceLinks'
import { StaffEntryModal } from './StaffEntryModal'

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
    portfolioEnabled,
    home,
    staticPages,
  } = useSiteSettings()
  const ui = home?.ui ?? {}
  const navHomeLabel = ui.navHome ?? 'Главная'
  const navCatalogLabel = ui.navCatalog ?? 'Каталог'
  const navPortfolioLabel = ui.navPortfolio ?? 'Портфолио'
  const navContactsLabel = ui.navContacts ?? 'Контакты'
  const navBlogLabel = ui.navBlog ?? 'Блог'
  const footerNavTitle = ui.footerNavTitle ?? 'Навигация'
  const footerMarketplacesTitle = ui.footerMarketplacesTitle ?? 'Маркетплейсы'
  const footerSocialTitle = ui.footerSocialTitle ?? 'Соцсети'
  const footerContactsTitle = ui.footerContactsTitle ?? 'Контакты'
  const footerPaymentTitle = ui.footerPaymentTitle ?? 'Оплата'
  const footerDeliveryTitle = ui.footerDeliveryTitle ?? 'Доставка'
  const footerStaffLogin = ui.footerStaffLogin ?? 'Вход для сотрудников'
  const footerPrivacyLink = ui.footerPrivacyLink ?? 'Политика конфиденциальности'
  const footerOfferLink = ui.footerOfferLink ?? 'Публичная оферта'
  const footerCopyrightSuffix = ui.footerCopyrightSuffix ?? 'Все права защищены.'
  const staffModalCloseOverlayAria = ui.staffModalCloseOverlayAria ?? 'Закрыть окно'
  const staffModalCloseButtonAria = ui.staffModalCloseButtonAria ?? 'Закрыть'
  const staffModalTitle = ui.staffModalTitle ?? 'Вход для сотрудников'
  const staffModalSubtitle = ui.staffModalSubtitle ?? 'Выберите панель — откроется в новой вкладке.'
  const staffModalManagerLabel = ui.staffModalManagerLabel ?? 'Панель менеджера'
  const staffModalManagerHint = ui.staffModalManagerHint ?? '(Каталог, заказы, контент)'
  const staffModalAdminLabel = ui.staffModalAdminLabel ?? 'Настройки сайта'
  const staffModalAdminHint =
    ui.staffModalAdminHint ?? 'Полный доступ к моделям и сервисным страницам'
  const mergedMpUrls = { ...GLOBAL_MARKETPLACE_URLS, ...globalMarketplaceUrls }
  const vkHref = footerVkUrl?.trim() || '#'
  const tgHref = footerTelegramUrl?.trim() || '#'

  const { reactAdminUrl, djangoAdminUrl } = useMemo(() => getPublicAdminLinks(), [])
  const showStaffLinks = Boolean(reactAdminUrl || djangoAdminUrl)
  const [staffModalOpen, setStaffModalOpen] = useState(false)
  const footerStaticPages = staticPages.filter((p) => p.showInFooter)
  const footerPrivacyPath = staticPagePathBySlug(staticPages, LEGAL_SLUGS.privacy, '/')
  const footerOfferPath = staticPagePathBySlug(staticPages, LEGAL_SLUGS.offer, '/')

  return (
    <footer className="border-t border-border bg-bg-base">
      <div className="fabric-container py-12 md:py-16">
        <div className="fabric-card grid gap-10 p-6 md:grid-cols-2 md:p-8 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,0.72fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 lg:pr-2">
            <p className="font-heading text-xl font-semibold text-text">{siteName}</p>
            {siteTagline.trim() ? (
              <div className="relative mt-5 max-w-none pl-4 sm:pl-5">
                <span
                  className="absolute left-0 top-1 bottom-1 w-1 rounded-full bg-accent shadow-[2px_0_12px_rgba(200,155,83,0.35)]"
                  aria-hidden
                />
                <p className="font-heading text-xl font-semibold leading-snug tracking-tight text-text sm:text-2xl md:text-[1.75rem] md:leading-tight">
                  {siteTagline.trim()}
                </p>
              </div>
            ) : null}
            {footerNote.trim() ? (
              <p
                className={`max-w-none font-body text-sm leading-relaxed text-text-muted md:max-w-xl lg:max-w-2xl ${siteTagline.trim() ? 'mt-4' : 'mt-3'}`}
              >
                {footerNote.trim()}
              </p>
            ) : null}
          </div>
          <div className="min-w-0 lg:max-w-[200px]">
            <p className="font-body text-sm font-semibold text-text">{footerNavTitle}</p>
            <ul className="mt-4 flex flex-col gap-2 font-body text-sm text-text-muted">
              <li>
                <Link to="/" className="hover:text-accent">
                  {navHomeLabel}
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="hover:text-accent">
                  {navCatalogLabel}
                </Link>
              </li>
              {portfolioEnabled ? (
                <li>
                  <Link to="/portfolio" className="hover:text-accent">
                    {navPortfolioLabel}
                  </Link>
                </li>
              ) : null}
              <li>
                <Link to="/contacts" className="hover:text-accent">
                  {navContactsLabel}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-accent">
                  {navBlogLabel}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-text">{footerMarketplacesTitle}</p>
            <div className="mt-4">
              <MarketplaceLinks compact hrefById={mergedMpUrls} linkKeys={enabledMarketplaces} />
            </div>
            {showSocialLinks ? (
              <>
                <p className="mt-6 font-body text-sm font-semibold text-text">{footerSocialTitle}</p>
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
            <p className="font-body text-sm font-semibold text-text">{footerContactsTitle}</p>
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
            <div className="mt-5">
              <p className="font-body text-sm font-semibold text-text">{footerPaymentTitle}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <img src="/payments/ozon-bank-icon-logo.svg" alt="Ozon Bank" className="h-7 w-auto object-contain" />
                <img src="/payments/mir-logo.svg" alt="МИР" className="h-7 w-auto object-contain" />
                <img src="/payments/sbp-logo.svg" alt="СБП" className="h-7 w-auto object-contain" />
              </div>
            </div>
            <div className="mt-4">
              <p className="font-body text-sm font-semibold text-text">{footerDeliveryTitle}</p>
              <div className="mt-2 flex items-center gap-2">
                <img src="/delivery/cdek-logo.svg" alt="СДЭК" className="h-7 w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>

        {showStaffLinks ? (
          <div className="mt-10 flex justify-center border-t border-border pt-8 sm:justify-start">
            <button
              type="button"
              onClick={() => setStaffModalOpen(true)}
              className="group inline-flex items-center gap-2 font-body text-sm font-medium text-text-muted underline decoration-border underline-offset-4 transition hover:text-accent hover:decoration-accent"
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-accent/80 transition group-hover:bg-accent"
                aria-hidden
              />
              {footerStaffLogin}
            </button>
            <StaffEntryModal
              open={staffModalOpen}
              onClose={() => setStaffModalOpen(false)}
              reactAdminUrl={reactAdminUrl}
              djangoAdminUrl={djangoAdminUrl}
              closeOverlayAriaLabel={staffModalCloseOverlayAria}
              closeButtonAriaLabel={staffModalCloseButtonAria}
              title={staffModalTitle}
              subtitle={staffModalSubtitle}
              managerLabel={staffModalManagerLabel}
              managerHint={staffModalManagerHint}
              adminLabel={staffModalAdminLabel}
              adminHint={staffModalAdminHint}
            />
          </div>
        ) : null}

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 text-sm text-text-subtle md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {siteName}. {footerCopyrightSuffix}
          </p>
          <div className="flex flex-wrap gap-4">
            {footerStaticPages.length > 0 ? (
              footerStaticPages.map((p) => (
                <Link key={p.slug} to={p.path} className="hover:text-accent">
                  {p.footerLinkLabel || p.title}
                </Link>
              ))
            ) : (
              <>
                <Link to={footerPrivacyPath} className="hover:text-accent">
                  {footerPrivacyLink}
                </Link>
                <Link to={footerOfferPath} className="hover:text-accent">
                  {footerOfferLink}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
