import { HelmetProvider } from 'react-helmet-async'
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartProvider'
import { YandexMetrika } from './components/analytics/YandexMetrika'
import { BrandingFavicon } from './components/layout/BrandingFavicon'
import { ScrollToTopButton } from './components/layout/ScrollToTopButton'
import { ScrollToTopOnRoute } from './components/layout/ScrollToTopOnRoute'
import { RouteTransition } from './components/layout/RouteTransition'
import { SiteSettingsProvider } from './context/SiteSettingsContext'
import { RouteErrorPage } from './components/RouteErrorPage'
import { RequireAuth } from './pages/account/RequireAuth'

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })))
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
const PortfolioPage = lazy(() => import('./pages/PortfolioPage').then((m) => ({ default: m.PortfolioPage })))
const ContactsPage = lazy(() => import('./pages/ContactsPage').then((m) => ({ default: m.ContactsPage })))
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage').then((m) => ({ default: m.BlogPostPage })))
const PrivacyPolicyPage = lazy(() =>
  import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })),
)
const PublicOfferPage = lazy(() =>
  import('./pages/PublicOfferPage').then((m) => ({ default: m.PublicOfferPage })),
)
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-bg-base font-body text-sm text-text-muted">
      Загрузка…
    </div>
  )
}

function AppShell() {
  return (
    <SiteSettingsProvider>
      <ScrollToTopOnRoute />
      <BrandingFavicon />
      <YandexMetrika />
      <AuthProvider>
        <CartProvider>
          <ScrollToTopButton />
          <Suspense fallback={<RouteFallback />}>
            <RouteTransition />
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </SiteSettingsProvider>
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
      { path: '/catalog/:slug', element: <ProductPage /> },
      { path: '/catalog', element: <CatalogPage /> },
      { path: '/portfolio', element: <PortfolioPage /> },
      { path: '/contacts', element: <ContactsPage /> },
      { path: '/blog', element: <BlogPage /> },
      { path: '/blog/:slug', element: <BlogPostPage /> },
      { path: '/privacy', element: <PrivacyPolicyPage /> },
      { path: '/offer', element: <PublicOfferPage /> },
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
