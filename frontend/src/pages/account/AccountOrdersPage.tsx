import { Helmet } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../hooks/useCart'
import type { CustomerOrderRow } from '../../lib/api'
import { fetchCustomerOrders } from '../../lib/api'
import { fulfillmentLabel } from '../../lib/orderStatusLabels'

export function AccountOrdersPage() {
  const { accessToken } = useAuth()
  const { mergeLinesFromOrder } = useCart()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<CustomerOrderRow[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [reorderHint, setReorderHint] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    fetchCustomerOrders(accessToken).then((data) => {
      if (cancelled) return
      if (data === null) setFailed(true)
      else setOrders(data)
    })
    return () => {
      cancelled = true
    }
  }, [accessToken])

  function onReorderAgain(o: CustomerOrderRow) {
    setReorderHint(null)
    const n = mergeLinesFromOrder(o.lines ?? [])
    if (n === 0) {
      setReorderHint(
        'Не удалось перенести позиции в корзину: данные заказа неполные или товары сняты с продажи.',
      )
      return
    }
    navigate('/cart')
  }

  return (
    <>
      <Helmet>
        <title>Мои заказы — Фабрика Тентов</title>
      </Helmet>
      <h1 className="font-heading text-2xl font-semibold text-text md:text-3xl">Мои заказы</h1>
      <p className="mt-2 font-body text-sm text-text-muted">
        История заказов с сайта. Оформите новый заказ в{' '}
        <Link to="/catalog" className="text-accent hover:underline">
          каталоге
        </Link>
        .
      </p>

      {reorderHint && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-body text-sm text-amber-900">
          {reorderHint}
        </p>
      )}

      {failed && (
        <p className="mt-6 font-body text-sm text-red-600">Не удалось загрузить заказы. Обновите страницу.</p>
      )}

      {orders && orders.length === 0 && (
        <p className="mt-8 rounded-2xl border border-border-light bg-bg-base p-6 font-body text-sm text-text-muted">
          Пока нет заказов. Добавьте товары в корзину и оформите заказ на странице{' '}
          <Link to="/checkout" className="text-accent hover:underline">
            оформления
          </Link>
          .
        </p>
      )}

      {orders && orders.length > 0 && (
        <ul className="mt-8 flex flex-col gap-3">
          {orders.map((o) => (
            <li
              key={o.orderRef}
              className="flex flex-col gap-3 rounded-2xl border border-border-light bg-bg-base p-4 sm:flex-row sm:items-stretch sm:justify-between"
            >
              <Link
                to={`/account/orders/${encodeURIComponent(o.orderRef)}`}
                className="flex min-w-0 flex-1 flex-col gap-2 transition-colors hover:text-accent sm:justify-center"
              >
                <div>
                  <p className="font-mono text-sm font-medium text-accent">{o.orderRef}</p>
                  <p className="mt-1 font-body text-xs text-text-muted">
                    {new Date(o.createdAt).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-border-light px-3 py-1 font-body text-xs text-text">
                    {fulfillmentLabel(o.fulfillment_status, o.fulfillmentStatusLabel)}
                  </span>
                  <span className="font-heading text-lg font-semibold text-text">
                    {o.totalApprox.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </Link>
              <div className="flex shrink-0 flex-col justify-center gap-2 border-t border-border-light pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <button
                  type="button"
                  onClick={() => onReorderAgain(o)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-accent bg-surface px-4 font-body text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
                >
                  Повторить заказ
                </button>
                <Link
                  to={`/account/orders/${encodeURIComponent(o.orderRef)}`}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 font-body text-xs text-text-muted hover:border-accent hover:text-accent"
                >
                  Подробнее
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
