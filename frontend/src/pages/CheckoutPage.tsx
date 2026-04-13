import { Helmet } from 'react-helmet-async'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../hooks/useCart'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import {
  COMMENT_MAX_LEN,
  formatRuPhoneMask,
  nationalDigitsFromInput,
  optionalEmailError,
  personNameError,
  phoneForApi,
  isCompleteRuPhone,
} from '../lib/formValidation'
import { submitCartOrder } from '../lib/leads'

type Step = 1 | 2 | 3 | 'done'

export function CheckoutPage() {
  const { items, totalApprox, clear, totalQty } = useCart()
  const { user, accessToken } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [deliveryComment, setDeliveryComment] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderRef, setOrderRef] = useState('')
  const [clientAck, setClientAck] = useState('')

  useEffect(() => {
    if (!user) return
    const n = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    if (n) setName((prev) => prev || n)
    if (user.phone)
      setPhone((prev) => prev || formatRuPhoneMask(nationalDigitsFromInput(user.phone)))
    if (user.email) setEmail((prev) => prev || user.email)
  }, [user])

  if (items.length === 0 && step !== 'done') {
    return <Navigate to="/cart" replace />
  }

  const goNextFromContacts = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const ne = personNameError(name)
    if (ne) {
      setError(ne)
      return
    }
    if (!isCompleteRuPhone(phone)) {
      setError('Введите полный номер телефона')
      return
    }
    const ee = optionalEmailError(email)
    if (ee) {
      setError(ee)
      return
    }
    if (comment.trim().length > COMMENT_MAX_LEN) {
      setError(`Комментарий не длиннее ${COMMENT_MAX_LEN} символов`)
      return
    }
    setStep(2)
  }

  const goNextFromDelivery = (e: FormEvent) => {
    e.preventDefault()
    setStep(3)
  }

  const submitOrder = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const ne = personNameError(name)
    if (ne) {
      setError(ne)
      return
    }
    if (!isCompleteRuPhone(phone)) {
      setError('Введите полный номер телефона')
      return
    }
    const ee = optionalEmailError(email)
    if (ee) {
      setError(ee)
      return
    }
    if (comment.trim().length > COMMENT_MAX_LEN) {
      setError(`Комментарий не длиннее ${COMMENT_MAX_LEN} символов`)
      return
    }
    setSending(true)
    try {
      const { ok, clientAck: ack, orderRef: ref } = await submitCartOrder({
        customer: {
          name: name.trim(),
          phone: phoneForApi(phone),
          email: email.trim() || undefined,
          comment: comment.trim() || undefined,
        },
        lines: items,
        totalApprox,
        delivery: {
          city: city.trim() || undefined,
          address: address.trim() || undefined,
          comment: deliveryComment.trim() || undefined,
        },
        accessToken,
      })
      if (ok && ref) {
        setOrderRef(ref)
        setClientAck(ack)
        clear()
        setStep('done')
      } else setError('Не удалось оформить заказ. Позвоните нам.')
    } catch {
      setError('Ошибка сети. Попробуйте позже.')
    } finally {
      setSending(false)
    }
  }

  const stepClass = (n: number) =>
    `flex h-9 w-9 items-center justify-center rounded-full font-body text-sm font-semibold ${
      step === n ? 'bg-accent text-surface' : step !== 'done' && (step as number) > n
        ? 'bg-secondary text-surface'
        : 'bg-border-light text-text-muted'
    }`

  return (
    <>
      <Helmet>
        <title>Оформление заказа — Фабрика Тентов</title>
        <meta name="description" content="Контакты, доставка, подтверждение заказа." />
      </Helmet>
      <SiteHeader />
      <main className="mx-auto min-h-[60vh] max-w-lg flex-col px-4 py-10 md:mx-auto md:max-w-[1280px] md:px-6 md:py-14">
        <nav className="font-body text-sm text-text-muted">
          <Link to="/" className="hover:text-accent">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <Link to="/cart" className="hover:text-accent">
            Корзина
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text">Оформление</span>
        </nav>

        {step !== 'done' && (
          <div className="mt-8 flex items-center justify-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <span className={stepClass(1)}>1</span>
              <span className="hidden font-body text-sm text-text-muted sm:inline">Контакты</span>
            </div>
            <span className="h-px w-6 bg-border-light md:w-12" />
            <div className="flex items-center gap-2">
              <span className={stepClass(2)}>2</span>
              <span className="hidden font-body text-sm text-text-muted sm:inline">Доставка</span>
            </div>
            <span className="h-px w-6 bg-border-light md:w-12" />
            <div className="flex items-center gap-2">
              <span className={stepClass(3)}>3</span>
              <span className="hidden font-body text-sm text-text-muted sm:inline">Подтверждение</span>
            </div>
          </div>
        )}

        <div className="mx-auto mt-10 max-w-lg">
          {step === 1 && (
            <form onSubmit={goNextFromContacts} className="flex flex-col">
              <h1 className="font-heading text-2xl font-semibold text-text">Контактные данные</h1>
              <p className="mt-2 font-body text-sm text-text-muted">
                {!user ? (
                  <>
                    Уже есть аккаунт?{' '}
                    <Link to="/account/login" className="text-accent hover:underline">
                      Войти
                    </Link>{' '}
                    — данные подставятся автоматически.
                  </>
                ) : (
                  <>Вы вошли как {user.email}. Данные можно изменить перед отправкой.</>
                )}
              </p>
              <label className="mt-6 block">
                <span className="mb-1 block font-body text-sm font-medium text-text">Имя и фамилия</span>
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
                  inputMode="tel"
                  placeholder="+7 (900) 000-00-00"
                  value={phone}
                  onChange={(e) =>
                    setPhone(formatRuPhoneMask(nationalDigitsFromInput(e.target.value)))
                  }
                  className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
                  autoComplete="tel"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1 block font-body text-sm font-medium text-text">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
                  autoComplete="email"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1 block font-body text-sm font-medium text-text">Комментарий к заказу</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={COMMENT_MAX_LEN}
                  className="w-full rounded-xl border border-border px-3 py-2 font-body outline-none focus:border-accent"
                />
              </label>
              {error && (
                <p className="mt-3 font-body text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-6 flex gap-3">
                <Link
                  to="/cart"
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-[40px] border border-border font-body font-medium text-text"
                >
                  Назад
                </Link>
                <button
                  type="submit"
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-[40px] bg-accent font-body font-medium text-surface"
                >
                  Далее
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={goNextFromDelivery} className="flex flex-col">
              <h1 className="font-heading text-2xl font-semibold text-text">Доставка</h1>
              <p className="mt-2 font-body text-sm text-text-muted">
                Расчёт через СДЭК и выбор ПВЗ подключим на следующем этапе. Пока укажите город и адрес для связи с
                менеджером.
              </p>
              <label className="mt-6 block">
                <span className="mb-1 block font-body text-sm font-medium text-text">Город</span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1 block font-body text-sm font-medium text-text">Адрес (улица, дом)</span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1 block font-body text-sm font-medium text-text">Комментарий к доставке</span>
                <textarea
                  value={deliveryComment}
                  onChange={(e) => setDeliveryComment(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border px-3 py-2 font-body outline-none focus:border-accent"
                />
              </label>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-[40px] border border-border font-body font-medium text-text"
                >
                  Назад
                </button>
                <button
                  type="submit"
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-[40px] bg-accent font-body font-medium text-surface"
                >
                  Далее
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={submitOrder} className="flex flex-col">
              <h1 className="font-heading text-2xl font-semibold text-text">Подтверждение</h1>
              <div className="mt-4 rounded-2xl border border-border-light bg-bg-base p-4 font-body text-sm text-text-muted">
                <p>
                  <span className="text-text-subtle">Позиций:</span> {totalQty}
                </p>
                <p className="mt-1">
                  <span className="text-text-subtle">Сумма ориентировочно:</span>{' '}
                  <span className="font-semibold text-text">{totalApprox.toLocaleString('ru-RU')} ₽</span>
                </p>
                <p className="mt-3 text-text">
                  {name}, {phone}
                </p>
                {email ? <p className="mt-1">{email}</p> : null}
                {(city || address) && (
                  <p className="mt-3">
                    Доставка: {city} {address}
                  </p>
                )}
              </div>
              {error && (
                <p className="mt-3 font-body text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-[40px] border border-border font-body font-medium text-text"
                >
                  Назад
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-[40px] bg-accent font-body font-medium text-surface disabled:opacity-50"
                >
                  {sending ? 'Отправка…' : 'Подтвердить заказ'}
                </button>
              </div>
            </form>
          )}

          {step === 'done' && (
            <div className="flex flex-col">
              <h1 className="font-heading text-2xl font-semibold text-text">Заказ принят</h1>
              <p className="mt-2 font-body text-sm text-text-muted">
                Номер заказа: <span className="font-mono font-medium text-accent">{orderRef}</span>
              </p>
              <div className="mt-4 rounded-2xl border border-border-light bg-bg-base p-4">
                <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-text">{clientAck}</pre>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {accessToken ? (
                  <Link
                    to="/account/orders"
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-[40px] bg-accent font-body font-medium text-surface"
                  >
                    Мои заказы
                  </Link>
                ) : null}
                <Link
                  to="/catalog"
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-[40px] border-2 border-accent font-body font-medium text-accent"
                >
                  В каталог
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
