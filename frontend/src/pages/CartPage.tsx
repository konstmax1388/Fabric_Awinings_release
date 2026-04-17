import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { CartView } from '../components/cart/CartView'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'

export function CartPage() {
  return (
    <>
      <Helmet>
        <title>Корзина — Фабрика Тентов</title>
        <meta name="description" content="Состав заказа и оформление заявки." />
      </Helmet>
      <SiteHeader />
      <main className="mx-auto flex min-h-[60vh] min-w-0 max-w-[1280px] flex-col overflow-x-clip px-4 py-8 md:px-6 md:py-12">
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
      </main>
      <SiteFooter />
    </>
  )
}
