import { Helmet, HelmetProvider } from 'react-helmet-async'
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useParams } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartProvider'
import { AnalyticsSnippets } from './components/analytics/AnalyticsSnippets'
import { BrandingFavicon } from './components/layout/BrandingFavicon'
import { ScrollToTopButton } from './components/layout/ScrollToTopButton'
import { ScrollToTopOnRoute } from './components/layout/ScrollToTopOnRoute'
import { RouteTransition } from './components/layout/RouteTransition'
import { ConsentBanner } from './components/layout/ConsentBanner'
import { CanonicalUrlProvider, DocumentCanonical } from './context/CanonicalUrlContext'
import { SiteSettingsProvider, useSiteSettings } from './context/SiteSettingsContext'
import { RouteErrorPage } from './components/RouteErrorPage'
import { RequireAuth } from './pages/account/RequireAuth'

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })))
const CheckoutOzonPaymentSuccessPage = lazy(() =>
  import('./pages/CheckoutOzonPaymentPage').then((m) => ({ default: m.CheckoutOzonPaymentSuccessPage })),
)
const CheckoutOzonPaymentFailedPage = lazy(() =>
  import('./pages/CheckoutOzonPaymentPage').then((m) => ({ default: m.CheckoutOzonPaymentFailedPage })),
)
const AccountLoginPage = lazy(() =>
  import('./pages/account/AccountLoginPage').then((m) => ({ default: m.AccountLoginPage })),
)
const AccountRegisterPage = lazy(() =>
  import('./pages/account/AccountRegisterPage').then((m) => ({ default: m.AccountRegisterPage })),
)
const AccountChangePasswordPage = lazy(() =>
  import('./pages/account/AccountChangePasswordPage').then((m) => ({ default: m.AccountChangePasswordPage })),
)
const AccountLayout = lazy(() =>
  import('./pages/account/AccountLayout').then((m) => ({ default: m.AccountLayout })),
)
const AccountOrdersPage = lazy(() =>
  import('./pages/account/AccountOrdersPage').then((m) => ({ default: m.AccountOrdersPage })),
)
const AccountOrderDetailPage = lazy(() =>
  import('./pages/account/AccountOrderDetailPage').then((m) => ({ default: m.AccountOrderDetailPage })),
)
const AccountProfilePage = lazy(() =>
  import('./pages/account/AccountProfilePage').then((m) => ({ default: m.AccountProfilePage })),
)
const AccountAddressesPage = lazy(() =>
  import('./pages/account/AccountAddressesPage').then((m) => ({ default: m.AccountAddressesPage })),
)
const ProductPage = lazy(() => import('./pages/ProductPage').then((m) => ({ default: m.ProductPage })))
const CatalogPage = lazy(() => import('./pages/CatalogPage').then((m) => ({ default: m.CatalogPage })))
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const PortfolioPage = lazy(() => import('./pages/PortfolioPage').then((m) => ({ default: m.PortfolioPage })))
const ContactsPage = lazy(() => import('./pages/ContactsPage').then((m) => ({ default: m.ContactsPage })))
const ReviewsPage = lazy(() => import('./pages/ReviewsPage').then((m) => ({ default: m.ReviewsPage })))
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage').then((m) => ({ default: m.BlogPostPage })))
const PromotionsPage = lazy(() => import('./pages/PromotionsPage').then((m) => ({ default: m.PromotionsPage })))
const PromotionDetailPage = lazy(() =>
  import('./pages/PromotionDetailPage').then((m) => ({ default: m.PromotionDetailPage })),
)
const StaticPageRoute = lazy(() =>
  import('./pages/StaticPageRoute').then((m) => ({ default: m.StaticPageRoute })),
)
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const LEGACY_PRIVACY_REDIRECT = '/politika-konfidentsialnosti-i-soglasie-na-obrabotku-personalnykh-dannykh'
const LEGACY_OFFER_REDIRECT = '/publichnaia-oferta'

function LegacyAkciiListRedirect() {
  return <Navigate to="/sales" replace />
}

function LegacyAkciiDetailRedirect() {
  const { slug } = useParams<{ slug: string }>()
  if (!slug) return <Navigate to="/sales" replace />
  return <Navigate to={`/sales/${encodeURIComponent(slug)}`} replace />
}

function RouteFallback() {
  const { siteName } = useSiteSettings()
  return (
    <>
      <Helmet>
        <title>{siteName}</title>
      </Helmet>
      <div className="flex min-h-[50vh] items-center justify-center bg-bg-base font-body text-sm text-text-muted">
        Загрузка…
      </div>
    </>
  )
}

function AppShell() {
  return (
    <CanonicalUrlProvider>
      <DocumentCanonical />
      <SiteSettingsProvider>
        <ScrollToTopOnRoute />
        <BrandingFavicon />
        <AnalyticsSnippets />
        <AuthProvider>
          <CartProvider>
            <ScrollToTopButton />
            <Suspense fallback={<RouteFallback />}>
              <RouteTransition />
            </Suspense>
            <ConsentBanner />
          </CartProvider>
        </AuthProvider>
      </SiteSettingsProvider>
    </CanonicalUrlProvider>
  )
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/checkout/payment/success', element: <CheckoutOzonPaymentSuccessPage /> },
      { path: '/checkout/payment/failed', element: <CheckoutOzonPaymentFailedPage /> },
      { path: '/account/login', element: <AccountLoginPage /> },
      { path: '/account/register', element: <AccountRegisterPage /> },
      {
        path: '/account',
        element: <RequireAuth />,
        children: [
          { path: 'change-password', element: <AccountChangePasswordPage /> },
          {
            element: <AccountLayout />,
            children: [
              { index: true, element: <Navigate to="orders" replace /> },
              { path: 'orders', element: <AccountOrdersPage /> },
              { path: 'orders/:orderRef', element: <AccountOrderDetailPage /> },
              { path: 'profile', element: <AccountProfilePage /> },
              { path: 'addresses', element: <AccountAddressesPage /> },
            ],
          },
        ],
      },
      { path: '/catalog/category/:categorySlug', element: <CatalogPage /> },
      { path: '/catalog/:slug', element: <ProductPage /> },
      { path: '/catalog', element: <CatalogPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/portfolio', element: <PortfolioPage /> },
      { path: '/contacts', element: <ContactsPage /> },
      { path: '/reviews', element: <ReviewsPage /> },
      { path: '/blog', element: <BlogPage /> },
      { path: '/blog/:slug', element: <BlogPostPage /> },
      { path: '/sales', element: <PromotionsPage /> },
      { path: '/sales/:slug', element: <PromotionDetailPage /> },
      { path: '/akcii', element: <LegacyAkciiListRedirect /> },
      { path: '/akcii/:slug', element: <LegacyAkciiDetailRedirect /> },
      { path: '/privacy', element: <Navigate to={LEGACY_PRIVACY_REDIRECT} replace /> },
      { path: '/offer', element: <Navigate to={LEGACY_OFFER_REDIRECT} replace /> },
      { path: '/:slug', element: <StaticPageRoute /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return (
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  )
}
