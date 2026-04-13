import { Helmet } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchCustomerOrder } from '../../lib/api'

const statusLabel: Record<string, string> = {
  new: 'Новый',
  processing: 'В работе',
  shipped: 'Отправлен',
  done: 'Выполнен',
  cancelled: 'Отменён',
}

function lineTitle(line: unknown): string {
  if (!line || typeof line !== 'object') return 'Позиция'
  const o = line as Record<string, unknown>
  return typeof o.title === 'string' ? o.title : 'Позиция'
}

function lineQty(line: unknown): number {
  if (!line || typeof line !== 'object') return 1
  const q = (line as Record<string, unknown>).qty
  return typeof q === 'number' && q > 0 ? q : 1
}

export function AccountOrderDetailPage() {
  const { orderRef } = useParams<{ orderRef: string }>()
  const { accessToken } = useAuth()
  const [data, setData] = useState<Record<string, unknown> | null | undefined>(undefined)
  const decodedRef = orderRef ? decodeURIComponent(orderRef) : ''

  useEffect(() => {
    if (!accessToken || !decodedRef) return
    let cancelled = false
    fetchCustomerOrder(accessToken, decodedRef).then((row) => {
      if (!cancelled) setData(row)
    })
    return () => {
      cancelled = true
    }
  }, [accessToken, decodedRef])

  if (data === undefined) {
    return <p className="font-body text-sm text-text-muted">Загрузка…</p>
  }

  if (data === null) {
    return (
      <>
        <Helmet>
          <title>Заказ не найден — Фабрика Тентов</title>
        </Helmet>
        <p className="font-body text-sm text-text-muted">Заказ не найден.</p>
        <Link to="/account/orders" className="mt-4 inline-block font-body text-sm text-accent hover:underline">
          К списку заказов
        </Link>
      </>
    )
  }

  const ref = typeof data.orderRef === 'string' ? data.orderRef : decodedRef
  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : ''
  const totalApprox = typeof data.totalApprox === 'number' ? data.totalApprox : 0
  const fulfillment = typeof data.fulfillment_status === 'string' ? data.fulfillment_status : ''
  const fulfillmentRu = statusLabel[fulfillment] ?? fulfillment
  const clientAck = typeof data.clientAck === 'string' ? data.clientAck : ''
  const lines = Array.isArray(data.lines) ? data.lines : []
  const delivery = data.deliverySnapshot
  const customerName = typeof data.customer_name === 'string' ? data.customer_name : ''
  const customerPhone = typeof data.customer_phone === 'string' ? data.customer_phone : ''

  return (
    <>
      <Helmet>
        <title>Заказ {ref} — Фабрика Тентов</title>
      </Helmet>
      <Link
        to="/account/orders"
        className="inline-block font-body text-sm text-accent hover:underline"
      >
        ← Все заказы
      </Link>
      <h1 className="mt-4 font-heading text-2xl font-semibold text-text md:text-3xl">Заказ {ref}</h1>
      <p className="mt-1 font-body text-sm text-text-muted">
        {createdAt
          ? new Date(createdAt).toLocaleString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : ''}
        {fulfillment ? ` · ${fulfillmentRu}` : ''}
      </p>

      <div className="mt-6 rounded-2xl border border-border-light bg-bg-base p-4">
        <p className="font-heading text-lg font-semibold text-text">{totalApprox.toLocaleString('ru-RU')} ₽</p>
        {customerName || customerPhone ? (
          <p className="mt-2 font-body text-sm text-text-muted">
            {customerName} {customerPhone}
          </p>
        ) : null}
      </div>

      {lines.length > 0 && (
        <div className="mt-6">
          <h2 className="font-body text-sm font-semibold text-text">Состав</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {lines.map((line, i) => (
              <li key={i} className="flex justify-between font-body text-sm text-text">
                <span>{lineTitle(line)}</span>
                <span className="text-text-muted">× {lineQty(line)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {delivery && typeof delivery === 'object' && !Array.isArray(delivery) && (() => {
        const d = delivery as Record<string, unknown>
        const city = typeof d.city === 'string' ? d.city.trim() : ''
        const address = typeof d.address === 'string' ? d.address.trim() : ''
        const comment = typeof d.comment === 'string' ? d.comment.trim() : ''
        const hasReadable = city || address || comment
        return (
          <div className="mt-6">
            <h2 className="font-body text-sm font-semibold text-text">Доставка</h2>
            <div className="mt-2 rounded-xl border border-border-light bg-bg-base p-4 font-body text-sm text-text-muted">
              {hasReadable ? (
                <>
                  {city ? (
                    <p>
                      <span className="text-text-subtle">Город:</span> {city}
                    </p>
                  ) : null}
                  {address ? (
                    <p className={city ? 'mt-1' : ''}>
                      <span className="text-text-subtle">Адрес:</span> {address}
                    </p>
                  ) : null}
                  {comment ? (
                    <p className={city || address ? 'mt-1' : ''}>
                      <span className="text-text-subtle">Комментарий:</span> {comment}
                    </p>
                  ) : null}
                </>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(delivery, null, 2)}</pre>
              )}
            </div>
          </div>
        )
      })()}

      {clientAck ? (
        <div className="mt-6">
          <h2 className="font-body text-sm font-semibold text-text">Детали для вас</h2>
          <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-border-light bg-bg-base p-4 font-body text-sm leading-relaxed text-text">
            {clientAck}
          </pre>
        </div>
      ) : null}
    </>
  )
}
