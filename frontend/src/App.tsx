import { HelmetProvider } from 'react-helmet-async'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { CartProvider } from './context/CartProvider'
import { BlogPage } from './pages/BlogPage'
import { BlogPostPage } from './pages/BlogPostPage'
import { CartPage } from './pages/CartPage'
import { CatalogPage } from './pages/CatalogPage'
import { ProductPage } from './pages/ProductPage'
import { ContactsPage } from './pages/ContactsPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PortfolioPage } from './pages/PortfolioPage'

function AppShell() {
  return (
    <CartProvider>
      <Outlet />
    </CartProvider>
  )
}

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/catalog/:slug', element: <ProductPage /> },
      { path: '/catalog', element: <CatalogPage /> },
      { path: '/portfolio', element: <PortfolioPage /> },
      { path: '/contacts', element: <ContactsPage /> },
      { path: '/blog', element: <BlogPage /> },
      { path: '/blog/:slug', element: <BlogPostPage /> },
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
