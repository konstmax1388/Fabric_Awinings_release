import { Helmet } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { useCart } from '../../hooks/useCart'
import { useResolvedLineImages } from '../../hooks/useResolvedLineImages'
import { fetchCustomerOrder } from '../../lib/api'
import { fulfillmentLabel, paymentLabel } from '../../lib/orderStatusLabels'
import { cartLineImageFrameClass } from '../../lib/productPhotoAspect'
import { OptimizedImage } from '../../components/ui/OptimizedImage'

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
  const { productPhotoAspect } = useSiteSettings()
  const { mergeLinesFromOrder } = useCart()
  const navigate = useNavigate()
  const [data, setData] = useState<Record<string, unknown> | null | undefined>(undefined)
  const [reorderHint, setReorderHint] = useState<string | null>(null)
  const decodedRef = orderRef ? decodeURIComponent(orderRef) : ''

  const linesForImages =
    data !== undefined && data !== null && Array.isArray(data.lines) ? data.lines : []
  const refForImages =
    data !== undefined && data !== null && typeof data.orderRef === 'string'
      ? data.orderRef
      : decodedRef
  const resolvedImages = useResolvedLineImages(refForImages, linesForImages)

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
  const fulfillmentApi =
    typeof data.fulfillmentStatusLabel === 'string' ? data.fulfillmentStatusLabel : undefined
  const payment = typeof data.payment_status === 'string' ? data.payment_status : ''
  const paymentApi = typeof data.paymentStatusLabel === 'string' ? data.paymentStatusLabel : undefined
  const fulfillmentRu = fulfillmentLabel(fulfillment, fulfillmentApi)
  const paymentRu = paymentLabel(payment, paymentApi)
  const clientAck = typeof data.clientAck === 'string' ? data.clientAck : ''
  const lines = linesForImages
  const delivery = data.deliverySnapshot
  const customerName = typeof data.customer_name === 'string' ? data.customer_name : ''
  const customerPhone = typeof data.customer_phone === 'string' ? data.customer_phone : ''

  function onReorder() {
    setReorderHint(null)
    const n = mergeLinesFromOrder(lines)
    if (n === 0) {
      setReorderHint(
        'Не удалось перенести позиции в корзину. Возможно, в заказе нет сохранённого состава или данные устарели.',
      )
      return
    }
    navigate('/cart')
  }

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
      </p>

      <div className="mt-4 flex flex-col gap-2 font-body text-sm text-text">
        <p>
          <span className="text-text-muted">Статус заказа:</span>{' '}
          <span className="font-medium text-text">{fulfillmentRu}</span>
        </p>
        {payment ? (
          <p>
            <span className="text-text-muted">Оплата:</span>{' '}
            <span className="font-medium text-text">{paymentRu}</span>
          </p>
        ) : null}
      </div>

      {reorderHint && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-body text-sm text-amber-900">
          {reorderHint}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-2xl border border-border-light bg-bg-base p-4 sm:flex-1">
          <p className="font-heading text-lg font-semibold text-text">
            {totalApprox.toLocaleString('ru-RU')} ₽
          </p>
          {customerName || customerPhone ? (
            <p className="mt-2 font-body text-sm text-text-muted">
              {customerName} {customerPhone}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onReorder}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-[40px] border-2 border-accent px-6 font-body font-medium text-accent transition-colors hover:bg-accent hover:text-white"
        >
          Повторить заказ
        </button>
      </div>

      {lines.length > 0 && (
        <div className="mt-6">
          <h2 className="font-body text-sm font-semibold text-text">Состав</h2>
          <ul className="mt-3 flex flex-col divide-y divide-border-light rounded-xl border border-border-light bg-surface">
            {lines.map((line, i) => {
              const o = line && typeof line === 'object' ? (line as Record<string, unknown>) : {}
              const slug = typeof o.slug === 'string' ? o.slug : ''
              const stored =
                typeof o.image === 'string' && o.image.trim() ? o.image.trim() : ''
              const src = stored || resolvedImages[i] || ''
              return (
                <li key={i} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                  {slug ? (
                    <Link
                      to={`/catalog/${slug}`}
                      className={`${cartLineImageFrameClass(productPhotoAspect)} max-h-20 max-w-[4.5rem] sm:max-h-24 sm:max-w-[5.25rem]`}
                    >
                      {src ? (
                        <OptimizedImage
                          src={src}
                          alt=""
                          widths={[128, 256, 384]}
                          sizes="72px"
                          className="h-full w-full object-contain p-0.5"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center px-1 text-center font-body text-[10px] leading-tight text-text-subtle">
                          Нет фото
                        </span>
                      )}
                    </Link>
                  ) : (
                    <div
                      className={`${cartLineImageFrameClass(productPhotoAspect)} max-h-20 max-w-[4.5rem] sm:max-h-24 sm:max-w-[5.25rem]`}
                    >
                      {src ? (
                        <OptimizedImage
                          src={src}
                          alt=""
                          widths={[128, 256, 384]}
                          sizes="72px"
                          className="h-full w-full object-contain p-0.5"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center px-1 text-center font-body text-[10px] leading-tight text-text-subtle">
                          Нет фото
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 justify-between gap-3 font-body text-sm text-text">
                    <span className="min-w-0">{lineTitle(line)}</span>
                    <span className="shrink-0 text-text-muted">× {lineQty(line)}</span>
                  </div>
                </li>
              )
            })}
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
