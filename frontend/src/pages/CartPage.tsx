import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { CartView } from '../components/cart/CartView'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { publicSiteUrl } from '../config/publicSite'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { buildSeoTitle, truncateMetaDescription } from '../lib/seoVitrine'

export function CartPage() {
  const site = publicSiteUrl()
  const { seoDefaults, siteName } = useSiteSettings()
  const docTitle = buildSeoTitle('listing', { title: 'Корзина', siteName }, seoDefaults)
  const desc = truncateMetaDescription('Состав заказа и оформление заявки.', undefined, seoDefaults)
  return (
    <>
      <Helmet>
        <title>{docTitle}</title>
        <meta name="description" content={desc} />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${site}/cart`} />
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <div className="fabric-page-main flex min-h-[60vh] min-w-0 flex-col overflow-x-clip">
        <nav className="font-body text-sm text-text-muted">
          <Link to="/" className="hover:text-accent">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text">Корзина</span>
        </nav>
        <div className="mt-5 flex flex-1 flex-col md:mt-8">
          <CartView />
        </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
