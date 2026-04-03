import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { submitCartOrder } from '../../lib/leads'

type Step = 'cart' | 'checkout' | 'done'

/** Полноэкранное содержимое корзины (страница `/cart`). */
export function CartView() {
  const navigate = useNavigate()
  const { items, removeLine, setQty, clear, totalQty, totalApprox } = useCart()
  const [step, setStep] = useState<Step>('cart')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderRef, setOrderRef] = useState('')
  const [clientAck, setClientAck] = useState('')

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const n = name.trim()
    const ph = phone.trim()
    if (n.length < 2) {
      setError('Укажите имя')
      return
    }
    if (ph.length < 10) {
      setError('Укажите телефон')
      return
    }
    if (items.length === 0) return

    setSending(true)
    try {
      const { ok, clientAck: ack, orderRef: ref } = await submitCartOrder({
        customer: {
          name: n,
          phone: ph,
          email: email.trim() || undefined,
          comment: comment.trim() || undefined,
        },
        lines: items,
        totalApprox,
      })
      if (ok && ref) {
        setOrderRef(ref)
        setClientAck(ack)
        clear()
        setStep('done')
      } else setError('Не удалось отправить заявку. Позвоните нам.')
    } catch {
      setError('Ошибка сети. Попробуйте позже.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-0 max-w-lg flex-1 flex-col">
      <h1 className="font-heading text-2xl font-semibold text-text md:text-3xl">Корзина</h1>

      {step === 'cart' && (
        <div className="mt-8 flex min-h-0 flex-1 flex-col">
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <p className="font-body text-text-muted">Корзина пуста</p>
              <Link
                to="/catalog"
                className="mt-6 inline-flex h-11 items-center rounded-[40px] bg-accent px-6 font-body text-sm font-medium text-surface"
              >
                В каталог
              </Link>
            </div>
          ) : (
            <>
              <ul className="flex flex-col gap-0 border-t border-border-light">
                {items.map((line) => (
                  <li
                    key={line.productId}
                    className="flex gap-3 border-b border-border-light py-4 last:border-0"
                  >
                    <Link
                      to={`/catalog/${line.slug}`}
                      className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-bg-base"
                    >
                      {line.image ? (
                        <img src={line.image} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/catalog/${line.slug}`}
                        className="font-body text-sm font-medium text-text hover:text-accent"
                      >
                        {line.title}
                      </Link>
                      <p className="mt-0.5 font-body text-xs text-text-muted">
                        от {line.priceFrom.toLocaleString('ru-RU')} ₽ × {line.qty}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          className="h-8 w-8 rounded-lg border border-border text-sm hover:border-accent"
                          onClick={() =>
                            line.qty <= 1
                              ? removeLine(line.productId)
                              : setQty(line.productId, line.qty - 1)
                          }
                          aria-label="Меньше"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-body text-sm tabular-nums">{line.qty}</span>
                        <button
                          type="button"
                          className="h-8 w-8 rounded-lg border border-border text-sm hover:border-accent"
                          onClick={() => setQty(line.productId, line.qty + 1)}
                          aria-label="Больше"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLine(line.productId)}
                          className="ml-auto font-body text-xs text-text-subtle hover:text-accent"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-2xl border border-border-light bg-bg-base p-4">
                <p className="flex justify-between font-body text-sm text-text-muted">
                  <span>Позиций</span>
                  <span>{totalQty}</span>
                </p>
                <p className="mt-2 flex justify-between font-heading text-lg font-semibold text-text">
                  <span>Ориентировочно</span>
                  <span>{totalApprox.toLocaleString('ru-RU')} ₽</span>
                </p>
                <p className="mt-1 font-body text-xs text-text-subtle">Итоговая цена после замера и КП.</p>
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-[40px] bg-accent font-body font-medium text-surface shadow-[0_4px_8px_0_rgba(232,122,0,0.25)]"
                >
                  Оформить заказ
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 'checkout' && (
        <form
          onSubmit={handleCheckout}
          className="mt-8 flex min-h-0 flex-1 flex-col"
        >
          <button
            type="button"
            onClick={() => setStep('cart')}
            className="mb-4 self-start font-body text-sm text-accent hover:underline"
          >
            ← Назад к корзине
          </button>
          <p className="font-body text-sm text-text-muted">
            Заявка уйдёт менеджеру с полным составом корзины. Ниже отобразим номер заказа и краткое подтверждение.
          </p>
          <label className="mt-4 block">
            <span className="mb-1 block font-body text-sm font-medium text-text">Имя</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
              autoComplete="name"
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block font-body text-sm font-medium text-text">Телефон</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
              autoComplete="tel"
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block font-body text-sm font-medium text-text">Email (необязательно)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
              autoComplete="email"
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block font-body text-sm font-medium text-text">Комментарий</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border px-3 py-2 font-body outline-none focus:border-accent"
            />
          </label>
          {error && (
            <p className="mt-3 font-body text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={sending}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-[40px] bg-accent font-body font-medium text-surface disabled:opacity-50"
          >
            {sending ? 'Отправка…' : 'Отправить заявку'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="mt-8 flex flex-1 flex-col">
          <p className="font-heading text-lg font-semibold text-text">Заявка отправлена</p>
          <p className="mt-2 font-body text-sm text-text-muted">
            Номер заказа: <span className="font-mono font-medium text-accent">{orderRef}</span>
          </p>
          <div className="mt-4 rounded-2xl border border-border-light bg-bg-base p-4">
            <p className="font-body text-xs font-medium uppercase tracking-wide text-text-subtle">
              Сообщение для клиента
            </p>
            <pre className="mt-2 whitespace-pre-wrap font-body text-sm leading-relaxed text-text">
              {clientAck}
            </pre>
          </div>
          <p className="mt-4 font-body text-xs text-text-subtle">
            Этот текст можно продублировать клиенту в письме или SMS.
          </p>
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-[40px] border-2 border-accent font-body font-medium text-accent"
          >
            В каталог
          </button>
        </div>
      )}
    </div>
  )
}
