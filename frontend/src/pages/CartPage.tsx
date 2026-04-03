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
      <main className="mx-auto flex min-h-[60vh] max-w-[1280px] flex-col px-4 py-10 md:px-6 md:py-14">
        <nav className="font-body text-sm text-text-muted">
          <Link to="/" className="hover:text-accent">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text">Корзина</span>
        </nav>
        <div className="mt-6 flex flex-1 flex-col">
          <CartView />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
