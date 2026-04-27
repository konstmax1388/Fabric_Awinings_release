import { Helmet } from 'react-helmet-async'
import { Link, useSearchParams } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { publicSiteUrl } from '../config/publicSite'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { buildSeoTitle, truncateMetaDescription } from '../lib/seoVitrine'

type Variant = 'success' | 'failed'

export function CheckoutOzonPaymentSuccessPage() {
  return <CheckoutOzonPaymentPage variant="success" />
}

export function CheckoutOzonPaymentFailedPage() {
  return <CheckoutOzonPaymentPage variant="failed" />
}

function CheckoutOzonPaymentPage({ variant }: { variant: Variant }) {
  const site = publicSiteUrl()
  const { siteName, seoDefaults } = useSiteSettings()
  const [sp] = useSearchParams()
  const orderRef = (sp.get('orderRef') ?? '').trim()

  const path = variant === 'success' ? '/checkout/payment/success' : '/checkout/payment/failed'
  const titleBase =
    variant === 'success' ? 'Оплата прошла успешно' : 'Оплата не выполнена'
  const description =
    variant === 'success'
      ? 'Заказ оформлен, платёж принят. Номер заказа и статус — в личном кабинете.'
      : 'Платёж не прошёл или был отменён. Выберите способ оплаты ещё раз или оформите заказ снова.'
  const metaDescription = truncateMetaDescription(description, undefined, seoDefaults)
  const docTitle = buildSeoTitle('emdash', { title: titleBase, siteName }, seoDefaults)
  const tw = seoDefaults.twitterCard || 'summary_large_image'

  return (
    <>
      <Helmet>
        <title>{docTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${site}${path}`} />
        <meta name="twitter:card" content={tw} />
        <meta name="twitter:title" content={docTitle} />
        {seoDefaults.ogImageUrl ? <meta name="twitter:image" content={seoDefaults.ogImageUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${site}${path}`} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={docTitle} />
        <meta property="og:description" content={metaDescription} />
        {seoDefaults.ogImageUrl ? <meta property="og:image" content={seoDefaults.ogImageUrl} /> : null}
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <div className="fabric-page-main min-w-0 overflow-x-clip">
          <div className="fabric-card p-6 md:p-8">
            <h1 className="font-heading text-2xl font-bold text-text md:text-3xl">{titleBase}</h1>
            <p className="mt-3 font-body text-base text-text-muted">{description}</p>
            {orderRef ? (
              <p className="mt-4 font-body text-sm text-text">
                Номер заказа:{' '}
                <span className="font-mono font-medium text-accent tabular-nums" translate="no">
                  {orderRef}
                </span>
              </p>
            ) : null}
            <ul className="mt-6 flex flex-col gap-2 font-body text-base sm:flex-row sm:flex-wrap sm:gap-4">
              <li>
                <Link
                  to="/account/orders"
                  className="text-accent underline decoration-accent/50 underline-offset-2 hover:decoration-accent"
                >
                  Мои заказы
                </Link>
              </li>
              <li>
                <Link
                  to="/catalog"
                  className="text-accent underline decoration-accent/50 underline-offset-2 hover:decoration-accent"
                >
                  Каталог
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="text-text-muted underline underline-offset-2 hover:text-text"
                >
                  На главную
                </Link>
              </li>
            </ul>
            {variant === 'failed' ? (
              <p className="mt-6 font-body text-sm text-text-muted">
                Оформить заказ заново:{' '}
                <Link
                  to="/checkout"
                  className="text-accent underline decoration-accent/50 underline-offset-2 hover:decoration-accent"
                >
                  оформление
                </Link>
                .
              </p>
            ) : null}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
