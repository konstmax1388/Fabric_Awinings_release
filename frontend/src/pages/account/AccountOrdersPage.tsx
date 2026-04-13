import { Helmet } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { CustomerOrderRow } from '../../lib/api'
import { fetchCustomerOrders } from '../../lib/api'

const statusLabel: Record<string, string> = {
  new: 'Новый',
  processing: 'В работе',
  shipped: 'Отправлен',
  done: 'Выполнен',
  cancelled: 'Отменён',
}

export function AccountOrdersPage() {
  const { accessToken } = useAuth()
  const [orders, setOrders] = useState<CustomerOrderRow[] | null>(null)
  const [failed, setFailed] = useState(false)

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
            <li key={o.orderRef}>
              <Link
                to={`/account/orders/${encodeURIComponent(o.orderRef)}`}
                className="flex flex-col gap-2 rounded-2xl border border-border-light bg-bg-base p-4 transition-colors hover:border-accent sm:flex-row sm:items-center sm:justify-between"
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
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span className="rounded-full bg-border-light px-3 py-1 font-body text-xs text-text">
                    {statusLabel[o.fulfillment_status] ?? o.fulfillment_status}
                  </span>
                  <span className="font-heading text-lg font-semibold text-text">
                    {o.totalApprox.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
