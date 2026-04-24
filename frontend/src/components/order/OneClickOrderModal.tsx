import { useState } from 'react'
import { postOneClickOrder } from '../../lib/api'
import { type OrderLineApiPayload, subtotalFromOrderLines } from '../../lib/orderLinePayload'

type Props = {
  open: boolean
  onClose: () => void
  /** Уже в формате API; пересчитайте total вместе с lines. */
  lines: OrderLineApiPayload[]
  title?: string
}

const emailOk = (s: string) => {
  const t = s.trim()
  if (t.length < 5) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(t)
}

function mapLinesForPost(lines: OrderLineApiPayload[]) {
  return lines.map((l) => ({ ...l }))
}

export function OneClickOrderModal({ open, onClose, lines, title = 'Купить в 1 клик' }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const total = subtotalFromOrderLines(lines)

  if (!open) return null

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    if (!name.trim() || !phone.trim()) {
      setErr('Укажите имя и телефон.')
      return
    }
    if (!emailOk(email)) {
      setErr('Укажите корректный e-mail.')
      return
    }
    if (lines.length === 0) {
      setErr('Нет товаров в заявке.')
      return
    }
    setBusy(true)
    const res = await postOneClickOrder({
      customer: { name: name.trim(), phone: phone.trim(), email: email.trim(), website: '' },
      lines: mapLinesForPost(lines),
      totalApprox: total,
    })
    setBusy(false)
    if (res.ok) {
      setDone(res.clientAck || 'Заявка отправлена.')
      return
    }
    setErr(res.detail)
  }

  const close = () => {
    if (busy) return
    setName('')
    setPhone('')
    setEmail('')
    setErr(null)
    setDone(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[560] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="one-click-title">
      <button
        type="button"
        className="absolute inset-0 bg-[#0b0f16]/80"
        onClick={close}
        aria-label="Закрыть"
      />
      <div className="relative z-10 fabric-card w-full max-w-md overflow-hidden rounded-2xl border border-border p-0 shadow-2xl">
        <div className="border-b border-border bg-surface/90 px-5 py-4">
          <h2 id="one-click-title" className="font-heading text-lg font-semibold text-text">
            {title}
          </h2>
          <p className="mt-1 font-body text-sm text-text-muted">Менеджер свяжется с вами, чтобы согласовать детали.</p>
        </div>
        {done ? (
          <div className="space-y-4 px-5 py-5">
            <p className="whitespace-pre-wrap font-body text-sm text-text">{done}</p>
            <button
              type="button"
              onClick={close}
              className="fabric-strap-btn w-full py-3 font-body text-sm font-medium"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 px-5 py-5">
            <p className="font-body text-xs text-text-subtle">Ориентировочно по товарам: {total.toLocaleString('ru-RU')} ₽</p>
            <div>
              <label className="font-body text-xs font-medium text-text-subtle" htmlFor="oc-name">
                Имя
              </label>
              <input
                id="oc-name"
                className="mt-1.5 w-full rounded-xl border border-border bg-bg-base px-3 py-2.5 font-body text-sm text-text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                disabled={busy}
              />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-text-subtle" htmlFor="oc-phone">
                Телефон
              </label>
              <input
                id="oc-phone"
                className="mt-1.5 w-full rounded-xl border border-border bg-bg-base px-3 py-2.5 font-body text-sm text-text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                inputMode="tel"
                autoComplete="tel"
                disabled={busy}
              />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-text-subtle" htmlFor="oc-email">
                E-mail
              </label>
              <input
                id="oc-email"
                className="mt-1.5 w-full rounded-xl border border-border bg-bg-base px-3 py-2.5 font-body text-sm text-text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
                disabled={busy}
              />
            </div>
            <div className="hidden" aria-hidden>
              <label htmlFor="oc-web">Сайт</label>
              <input id="oc-web" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
            {err ? <p className="font-body text-sm text-rose-600">{err}</p> : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="flex-1 rounded-xl border border-border py-2.5 font-body text-sm font-medium text-text hover:border-accent"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-xl bg-accent py-2.5 font-body text-sm font-medium text-[#0d121c] disabled:opacity-50"
              >
                {busy ? 'Отправка…' : 'Отправить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
