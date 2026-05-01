import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { postOneClickOrder } from '../../lib/api'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { checkoutClientLabels } from '../../lib/checkoutUiCopy'
import { FormPersonalDataConsent } from '../legal/FormPersonalDataConsent'
import { PriceTag } from '../ui/PriceTag'
import {
  HONEYPOT_FIELD,
  formatRuPhoneMask,
  isCompleteRuPhone,
  nationalDigitsFromInput,
  orderEmailError,
  personNameError,
  phoneForApi,
} from '../../lib/formValidation'
import { type OrderLineApiPayload, subtotalFromOrderLines } from '../../lib/orderLinePayload'
import { DEFAULT_CHECKOUT_ORDERS_BLOCKED_MESSAGE } from '../../types/checkoutPublic'

type Props = {
  open: boolean
  onClose: () => void
  /** Уже в формате API; пересчитайте total вместе с lines. */
  lines: OrderLineApiPayload[]
  title?: string
}

/** Минимальная задержка от открытия формы до отправки (антибот). */
const MIN_SUBMIT_MS = 1200

function mapLinesForPost(lines: OrderLineApiPayload[]) {
  return lines.map((l) => ({
    productId: l.productId,
    variantId: l.variantId ?? '',
    slug: l.slug,
    title: l.title,
    priceFrom: l.priceFrom,
    qty: l.qty,
    image: (l.image ?? '').trim(),
    ...(l.ozonSku != null && l.ozonSku > 0 ? { ozonSku: l.ozonSku } : {}),
    ...(l.cdekWeightGrams != null && l.cdekWeightGrams > 0 ? { cdekWeightGrams: l.cdekWeightGrams } : {}),
    ...(l.cdekLengthCm != null && l.cdekLengthCm > 0 ? { cdekLengthCm: l.cdekLengthCm } : {}),
    ...(l.cdekWidthCm != null && l.cdekWidthCm > 0 ? { cdekWidthCm: l.cdekWidthCm } : {}),
    ...(l.cdekHeightCm != null && l.cdekHeightCm > 0 ? { cdekHeightCm: l.cdekHeightCm } : {}),
  }))
}

export function OneClickOrderModal({ open, onClose, lines, title = 'Купить в 1 клик' }: Props) {
  const { checkout, home } = useSiteSettings()
  const cx = useMemo(() => checkoutClientLabels(home?.ui), [home?.ui])
  const ordersBlocked = checkout.ordersBlocked
  const ordersBlockedNotice = useMemo(
    () => (checkout.ordersBlockedMessage || '').trim() || DEFAULT_CHECKOUT_ORDERS_BLOCKED_MESSAGE,
    [checkout.ordersBlockedMessage],
  )
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [nameErr, setNameErr] = useState<string | null>(null)
  const [phoneErr, setPhoneErr] = useState<string | null>(null)
  const [emailErr, setEmailErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const openedAtRef = useRef(0)
  const total = subtotalFromOrderLines(lines)
  const totalListApprox = useMemo(
    () =>
      lines.reduce(
        (s, l) => s + Math.max(0, l.priceList ?? l.priceFrom) * Math.max(1, l.qty),
        0,
      ),
    [lines],
  )

  useEffect(() => {
    if (!open) return
    openedAtRef.current = Date.now()
    setHoneypot('')
    setNameErr(null)
    setPhoneErr(null)
    setEmailErr(null)
    setErr(null)
  }, [open])

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setErr(null)
      setNameErr(null)
      setPhoneErr(null)
      setEmailErr(null)

      if (honeypot.trim()) {
        return
      }
      if (ordersBlocked) {
        setErr(ordersBlockedNotice)
        return
      }
      if (Date.now() - openedAtRef.current < MIN_SUBMIT_MS) {
        setErr('Подождите пару секунд и нажмите «Отправить» снова — так мы отсекаем автоматические заявки.')
        return
      }

      const ne = personNameError(name)
      if (ne) {
        setNameErr(ne)
        return
      }
      if (!isCompleteRuPhone(phone)) {
        setPhoneErr('Введите полный номер мобильного или городского телефона России (10 цифр).')
        return
      }
      const ee = orderEmailError(email)
      if (ee) {
        setEmailErr(ee)
        return
      }
      if (lines.length === 0) {
        setErr('Нет товаров в заявке.')
        return
      }

      setBusy(true)
      const res = await postOneClickOrder({
        customer: {
          name: name.trim(),
          phone: phoneForApi(phone),
          email: email.trim(),
          [HONEYPOT_FIELD]: honeypot,
        },
        lines: mapLinesForPost(lines),
        totalApprox: total,
      })
      setBusy(false)
      if (res.ok) {
        setDone(res.clientAck || 'Заявка отправлена.')
        return
      }
      setErr(res.detail)
    },
    [name, phone, email, honeypot, lines, total, ordersBlocked, ordersBlockedNotice],
  )

  const close = useCallback(() => {
    if (busy) return
    setName('')
    setPhone('')
    setEmail('')
    setHoneypot('')
    setNameErr(null)
    setPhoneErr(null)
    setEmailErr(null)
    setErr(null)
    setDone(null)
    onClose()
  }, [busy, onClose])

  if (!open) return null

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
          {ordersBlocked ? (
            <p
              className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-body text-xs leading-relaxed text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/50 dark:text-amber-100"
              role="alert"
            >
              {ordersBlockedNotice}
            </p>
          ) : null}
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
          <form onSubmit={onSubmit} className="space-y-4 px-5 py-5" noValidate>
            <div className="rounded-xl bg-bg-base/80 px-3 py-2">
              <p className="font-body text-xs text-text-subtle">Ориентировочно по товарам</p>
              <PriceTag priceFrom={total} priceList={totalListApprox} size="sm" />
            </div>
            <div>
              <label className="font-body text-xs font-medium text-text-subtle" htmlFor="oc-name">
                Имя
              </label>
              <input
                id="oc-name"
                className="mt-1.5 w-full rounded-xl border border-border bg-bg-base px-3 py-2.5 font-body text-sm text-text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameErr(null)
                }}
                maxLength={120}
                required
                autoComplete="name"
                disabled={busy || ordersBlocked}
                aria-invalid={Boolean(nameErr)}
                aria-describedby={nameErr ? 'oc-name-err' : undefined}
              />
              {nameErr ? (
                <p id="oc-name-err" className="mt-1 font-body text-xs text-rose-600">
                  {nameErr}
                </p>
              ) : null}
            </div>
            <div>
              <label className="font-body text-xs font-medium text-text-subtle" htmlFor="oc-phone">
                Телефон
              </label>
              <input
                id="oc-phone"
                className="mt-1.5 w-full rounded-xl border border-border bg-bg-base px-3 py-2.5 font-body text-sm text-text"
                value={phone}
                onChange={(e) => {
                  setPhone(formatRuPhoneMask(nationalDigitsFromInput(e.target.value)))
                  setPhoneErr(null)
                }}
                required
                type="tel"
                inputMode="tel"
                placeholder="+7 (900) 000-00-00"
                autoComplete="tel"
                disabled={busy || ordersBlocked}
                aria-invalid={Boolean(phoneErr)}
                aria-describedby={phoneErr ? 'oc-phone-err' : undefined}
              />
              {phoneErr ? (
                <p id="oc-phone-err" className="mt-1 font-body text-xs text-rose-600">
                  {phoneErr}
                </p>
              ) : null}
            </div>
            <div>
              <label className="font-body text-xs font-medium text-text-subtle" htmlFor="oc-email">
                E-mail <span className="text-rose-600">*</span>
              </label>
              <input
                id="oc-email"
                className="mt-1.5 w-full rounded-xl border border-border bg-bg-base px-3 py-2.5 font-body text-sm text-text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailErr(null)
                }}
                type="email"
                maxLength={254}
                required
                autoComplete="email"
                disabled={busy || ordersBlocked}
                aria-invalid={Boolean(emailErr)}
                aria-describedby={emailErr ? 'oc-email-err' : undefined}
              />
              {emailErr ? (
                <p id="oc-email-err" className="mt-1 font-body text-xs text-rose-600">
                  {emailErr}
                </p>
              ) : null}
            </div>
            <div className="hidden" aria-hidden>
              <label htmlFor="oc-hp">Сайт</label>
              <input
                id="oc-hp"
                name={HONEYPOT_FIELD}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>
            <FormPersonalDataConsent
              variant="request"
              onLinkClick={close}
              tail={cx.oneClickConsentTail}
            />
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
                disabled={busy || ordersBlocked}
                className="flex-1 rounded-xl bg-accent py-2.5 font-body text-sm font-medium text-[#0d121c] disabled:cursor-not-allowed disabled:opacity-50"
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
