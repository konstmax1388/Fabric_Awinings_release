import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { BlogPage } from './pages/BlogPage'
import { BlogPostPage } from './pages/BlogPostPage'
import { CatalogPage } from './pages/CatalogPage'
import { ContactsPage } from './pages/ContactsPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PortfolioPage } from './pages/PortfolioPage'

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/catalog', element: <CatalogPage /> },
  { path: '/portfolio', element: <PortfolioPage /> },
  { path: '/contacts', element: <ContactsPage /> },
  { path: '/blog', element: <BlogPage /> },
  { path: '/blog/:slug', element: <BlogPostPage /> },
  { path: '*', element: <NotFoundPage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
