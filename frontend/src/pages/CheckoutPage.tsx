import { Helmet } from 'react-helmet-async'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { useCart } from '../hooks/useCart'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { CdekAddressCombobox } from '../components/checkout/CdekAddressCombobox'
import { CdekCityCombobox } from '../components/checkout/CdekCityCombobox'
import { CdekWidgetMount } from '../components/checkout/CdekWidgetMount'
import { PickupInfoCard } from '../components/checkout/PickupInfoCard'
import { CartReadonlyLinesList } from '../components/cart/CartReadonlyLinesList'
import { apiBase } from '../lib/api'
import {
  COMMENT_MAX_LEN,
  formatRuPhoneMask,
  nationalDigitsFromInput,
  orderEmailError,
  personNameError,
  phoneForApi,
  isCompleteRuPhone,
} from '../lib/formValidation'
import { submitCartOrder } from '../lib/leads'

type Step = 1 | 2 | 3 | 'done'
type CdekMode = 'office' | 'door'

export function CheckoutPage() {
  const { items, totalApprox, clear, totalQty } = useCart()
  const { user, accessToken } = useAuth()
  const { checkout, loading: settingsLoading } = useSiteSettings()
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [deliveryComment, setDeliveryComment] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [cdekMode, setCdekMode] = useState<CdekMode>('office')
  const [cdekPvzCode, setCdekPvzCode] = useState('')
  const [cdekPvzAddress, setCdekPvzAddress] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderRef, setOrderRef] = useState('')
  const [clientAck, setClientAck] = useState('')
  const [paymentRedirectUrl, setPaymentRedirectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const n = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    if (n) setName((prev) => prev || n)
    if (user.phone)
      setPhone((prev) => prev || formatRuPhoneMask(nationalDigitsFromInput(user.phone)))
    if (user.email) setEmail((prev) => prev || user.email)
  }, [user])

  useEffect(() => {
    if (settingsLoading) return
    const opts = checkout.deliveryOptions
    if (!opts.length) return
    setDeliveryMethod((prev) => (prev && opts.some((o) => o.id === prev) ? prev : opts[0].id))
  }, [settingsLoading, checkout.deliveryOptions])

  useEffect(() => {
    if (settingsLoading || !deliveryMethod) return
    const allowed = checkout.paymentMatrix[deliveryMethod] ?? []
    if (!allowed.length) return
    setPaymentMethod((prev) => (prev && allowed.includes(prev) ? prev : allowed[0]))
  }, [settingsLoading, checkout.paymentMatrix, deliveryMethod])

  useEffect(() => {
    if (deliveryMethod !== 'pickup') return
    setCity('')
    setAddress('')
    setDeliveryComment('')
    setCdekPvzCode('')
    setCdekPvzAddress('')
  }, [deliveryMethod])

  const deliveryLabel = useMemo(() => {
    return checkout.deliveryOptions.find((o) => o.id === deliveryMethod)?.label ?? deliveryMethod
  }, [checkout.deliveryOptions, deliveryMethod])

  const paymentLabel = useMemo(() => {
    return checkout.paymentLabels[paymentMethod] ?? paymentMethod
  }, [checkout.paymentLabels, paymentMethod])

  const paymentChoices = useMemo(() => {
    return checkout.paymentMatrix[deliveryMethod] ?? []
  }, [checkout.paymentMatrix, deliveryMethod])

  /** Если бэкенд не отдал абсолютный URL (редкий случай), собираем прокси виджета СДЭК с того же хоста, что и API. */
  const cdekWidgetServicePath = useMemo(() => {
    const u = checkout.cdek.widgetServiceUrl?.trim()
    if (u) return u
    return `${apiBase()}/api/cdek-widget/service/`
  }, [checkout.cdek.widgetServiceUrl])

  const handleCdekWidgetChoose = useCallback((mode: string, _tariff: unknown, addr: Record<string, unknown>) => {
    if (mode === 'office') {
      setCdekMode('office')
      const rawCode = addr.code
      if (rawCode !== undefined && rawCode !== null) {
        const code = String(rawCode).trim()
        if (code) setCdekPvzCode(code)
      }
      const parts = [addr.city, addr.name, addr.address].filter(
        (x): x is string => typeof x === 'string' && x.trim().length > 0,
      )
      if (parts.length) setCdekPvzAddress(parts.join(', '))
    }
    if (mode === 'door') {
      setCdekMode('door')
      const doorCity = typeof addr.city === 'string' ? addr.city.trim() : ''
      if (doorCity) setCity((prev) => prev.trim() || doorCity)
      const formatted = typeof addr.formatted === 'string' ? addr.formatted.trim() : ''
      if (formatted) setAddress((prev) => prev.trim() || formatted)
    }
  }, [])

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
    const ee = orderEmailError(email)
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
    setError(null)
    if (!settingsLoading && checkout.deliveryOptions.length === 0) {
      setError('Оформление заказа недоступно: включите способы доставки в настройках сайта.')
      return
    }
    if (!deliveryMethod || !paymentMethod) {
      setError('Выберите доставку и способ оплаты.')
      return
    }
    if (deliveryMethod === 'cdek' && !city.trim()) {
      setError('Укажите город: начните ввод и выберите значение из списка подсказок СДЭК.')
      return
    }
    if (deliveryMethod === 'cdek' && cdekMode === 'office' && !cdekPvzCode.trim()) {
      if (checkout.cdek.manualPvzEnabled) {
        setError('Для доставки в ПВЗ выберите пункт на карте СДЭК или введите код ПВЗ вручную.')
      } else {
        setError('Для доставки в ПВЗ выберите пункт на карте СДЭК (ручной ввод отключён).')
      }
      return
    }
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
    const ee = orderEmailError(email)
    if (ee) {
      setError(ee)
      return
    }
    if (comment.trim().length > COMMENT_MAX_LEN) {
      setError(`Комментарий не длиннее ${COMMENT_MAX_LEN} символов`)
      return
    }
    if (deliveryMethod === 'cdek' && !city.trim()) {
      setError('Укажите город: выберите значение из списка подсказок СДЭК.')
      return
    }
    if (deliveryMethod === 'cdek' && cdekMode === 'office' && !cdekPvzCode.trim()) {
      if (checkout.cdek.manualPvzEnabled) {
        setError('Для доставки в ПВЗ выберите пункт на карте СДЭК или введите код ПВЗ вручную.')
      } else {
        setError('Для доставки в ПВЗ выберите пункт на карте СДЭК (ручной ввод отключён).')
      }
      return
    }
    setSending(true)
    try {
      const delivery: Record<string, unknown> = {}
      if (city.trim()) delivery.city = city.trim()
      if (address.trim()) delivery.address = address.trim()
      if (deliveryComment.trim()) delivery.comment = deliveryComment.trim()
      if (deliveryMethod === 'cdek') {
        delivery.cdek = {
          mode: cdekMode,
          pvzCode: cdekPvzCode.trim() || '',
          address: cdekPvzAddress.trim() || '',
        }
      }
      if (deliveryMethod === 'ozon_logistics') {
        delivery.ozonLogistics = {
          hint: (checkout.ozonLogistics.buyerNote || '').slice(0, 1000),
        }
      }

      const { ok, clientAck: ack, orderRef: ref, paymentRedirectUrl: payUrl, error: submitError } =
        await submitCartOrder({
        customer: {
          name: name.trim(),
          phone: phoneForApi(phone),
          email: email.trim(),
          comment: comment.trim() || undefined,
        },
        lines: items,
        totalApprox,
        delivery,
        deliveryMethod,
        paymentMethod,
        accessToken,
      })
      if (ok && ref) {
        if (paymentMethod === 'card_online' && !(payUrl && payUrl.trim())) {
          setError('Онлайн-оплата не запустилась: сервер не вернул ссылку на оплату.')
          return
        }
        setOrderRef(ref)
        setClientAck(ack)
        setPaymentRedirectUrl(payUrl ?? null)
        clear()
        setStep('done')
      } else setError(submitError || 'Не удалось оформить заказ. Позвоните нам.')
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
      <main className="mx-auto flex min-h-[60vh] w-full min-w-0 max-w-[1280px] flex-col overflow-x-clip px-4 py-10 md:px-6 md:py-14">
        <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-sm text-text-muted">
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
              <span className="hidden font-body text-sm text-text-muted sm:inline">Доставка и оплата</span>
            </div>
            <span className="h-px w-6 bg-border-light md:w-12" />
            <div className="flex items-center gap-2">
              <span className={stepClass(3)}>3</span>
              <span className="hidden font-body text-sm text-text-muted sm:inline">Подтверждение</span>
            </div>
          </div>
        )}

        <div className="mx-auto mt-10 w-full min-w-0 max-w-2xl sm:max-w-3xl lg:max-w-5xl">
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
                <span className="mb-1 block font-body text-sm font-medium text-text">
                  Email <span className="text-red-600">*</span>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
                  autoComplete="email"
                  placeholder="name@mail.ru"
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
              <h1 className="font-heading text-2xl font-semibold text-text">Доставка и оплата</h1>
              {settingsLoading ? (
                <p className="mt-4 font-body text-sm text-text-muted">Загрузка настроек…</p>
              ) : checkout.deliveryOptions.length === 0 ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 font-body text-sm text-amber-900">
                  Сейчас нельзя оформить заказ на сайте: не включён ни один способ доставки. Обратитесь к
                  администратору или позвоните нам.
                </div>
              ) : (
                <>
                  <p className="mt-2 font-body text-sm text-text-muted">
                    Способы и оплата задаются в админке («Настройки сайта» → блоки оформления).
                  </p>
                  <fieldset className="mt-6 space-y-3">
                    <legend className="mb-2 font-body text-sm font-medium text-text">Доставка</legend>
                    {checkout.deliveryOptions.map((o) => (
                      <label
                        key={o.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-light bg-bg-base p-3 has-[:checked]:border-accent"
                      >
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value={o.id}
                          checked={deliveryMethod === o.id}
                          onChange={() => setDeliveryMethod(o.id)}
                          className="mt-1"
                        />
                        <span className="font-body text-sm text-text">{o.label}</span>
                      </label>
                    ))}
                  </fieldset>

                  {deliveryMethod === 'pickup' && (
                    <div className="mt-5">
                      <p className="mb-3 font-body text-sm font-medium text-text">Пункт выдачи</p>
                      <PickupInfoCard pickup={checkout.pickup} />
                    </div>
                  )}

                  {deliveryMethod === 'ozon_logistics' && checkout.ozonLogistics.buyerNote ? (
                    <div className="mt-4 rounded-xl border border-border-light bg-bg-base p-4 font-body text-sm text-text-muted">
                      {checkout.ozonLogistics.buyerNote}
                    </div>
                  ) : null}

                  {deliveryMethod === 'cdek' && (
                    <>
                      <div className="mt-4">
                        <CdekCityCombobox value={city} onChange={setCity} disabled={settingsLoading} />
                      </div>
                      <fieldset className="mt-3 rounded-xl border border-border-light bg-bg-base p-3">
                        <legend className="px-1 font-body text-sm font-medium text-text">Тип доставки СДЭК</legend>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border px-3 py-2 has-[:checked]:border-accent">
                            <input
                              type="radio"
                              name="cdekMode"
                              value="office"
                              checked={cdekMode === 'office'}
                              onChange={() => setCdekMode('office')}
                              className="mt-1"
                            />
                            <span className="font-body text-sm text-text">Доставка в ПВЗ</span>
                          </label>
                          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border px-3 py-2 has-[:checked]:border-accent">
                            <input
                              type="radio"
                              name="cdekMode"
                              value="door"
                              checked={cdekMode === 'door'}
                              onChange={() => setCdekMode('door')}
                              className="mt-1"
                            />
                            <span className="font-body text-sm text-text">Доставка до двери</span>
                          </label>
                        </div>
                      </fieldset>
                      <CdekAddressCombobox
                        value={address}
                        onChange={setAddress}
                        cityHint={city}
                        yandexApiKey={checkout.cdek.yandexMapApiKey}
                        disabled={settingsLoading}
                      />
                      <CdekWidgetMount
                        scriptUrl={checkout.cdek.widgetScriptUrl}
                        apiKey={checkout.cdek.yandexMapApiKey}
                        servicePath={cdekWidgetServicePath}
                        fromCity={checkout.cdek.widgetSenderCity}
                        defaultMapLocation={city.trim() || checkout.cdek.widgetSenderCity}
                        rootId="cdek-map-root-checkout"
                        goods={checkout.cdek.widgetGoods}
                        onChoose={handleCdekWidgetChoose}
                      />
                      {checkout.cdek.manualPvzEnabled ? (
                        <details className="mt-3 rounded-xl border border-border-light bg-bg-base p-3">
                          <summary className="cursor-pointer font-body text-sm font-medium text-text">
                            Ручной ввод ПВЗ (если виджет не сработал)
                          </summary>
                          <label className="mt-3 block">
                            <span className="mb-1 block font-body text-sm font-medium text-text">
                              Код ПВЗ (из виджета или от оператора)
                            </span>
                            <input
                              value={cdekPvzCode}
                              onChange={(e) => setCdekPvzCode(e.target.value)}
                              className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
                              placeholder="Например: MSK123"
                            />
                          </label>
                          <label className="mt-3 block">
                            <span className="mb-1 block font-body text-sm font-medium text-text">
                              Адрес ПВЗ (текстом)
                            </span>
                            <input
                              value={cdekPvzAddress}
                              onChange={(e) => setCdekPvzAddress(e.target.value)}
                              className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
                            />
                          </label>
                        </details>
                      ) : null}
                    </>
                  )}

                  {deliveryMethod !== 'cdek' && deliveryMethod !== 'pickup' && (
                    <>
                      <label className="mt-6 block">
                        <span className="mb-1 block font-body text-sm font-medium text-text">Город</span>
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
                        />
                      </label>
                      <label className="mt-3 block">
                        <span className="mb-1 block font-body text-sm font-medium text-text">Адрес</span>
                        <input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
                        />
                      </label>
                    </>
                  )}

                  {deliveryMethod !== 'pickup' && (
                    <label className="mt-3 block">
                      <span className="mb-1 block font-body text-sm font-medium text-text">
                        Комментарий к доставке
                      </span>
                      <textarea
                        value={deliveryComment}
                        onChange={(e) => setDeliveryComment(e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-border px-3 py-2 font-body outline-none focus:border-accent"
                      />
                    </label>
                  )}

                  <fieldset className="mt-6 space-y-3">
                    <legend className="mb-2 font-body text-sm font-medium text-text">Оплата</legend>
                    {paymentChoices.map((pid) => (
                      <label
                        key={pid}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-light bg-bg-base p-3 has-[:checked]:border-accent"
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={pid}
                          checked={paymentMethod === pid}
                          onChange={() => setPaymentMethod(pid)}
                          className="mt-1"
                        />
                        <span className="font-body text-sm text-text">
                          {checkout.paymentLabels[pid] ?? pid}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                </>
              )}
              {error && (
                <p className="mt-3 font-body text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <p className="mt-3 font-body text-xs leading-relaxed text-text-subtle">
                Подтверждая заказ, вы принимаете{' '}
                <Link to="/privacy" className="text-accent hover:underline">
                  политику конфиденциальности
                </Link>{' '}
                и{' '}
                <Link to="/offer" className="text-accent hover:underline">
                  публичную оферту
                </Link>
                .
              </p>
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
                  disabled={settingsLoading || checkout.deliveryOptions.length === 0}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-[40px] bg-accent font-body font-medium text-surface disabled:opacity-50"
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
                  <span className="text-text-subtle">Доставка:</span> {deliveryLabel}
                </p>
                <p className="mt-1 text-text">
                  <span className="text-text-subtle">Оплата:</span> {paymentLabel}
                </p>
                <p className="mt-3 text-text">
                  {name}, {phone}
                </p>
                {email ? <p className="mt-1">{email}</p> : null}
                {deliveryMethod === 'pickup' ? (
                  <div className="mt-4 border-t border-border-light pt-4">
                    <p className="text-text-subtle font-body text-xs uppercase tracking-wide">Самовывоз</p>
                    <div className="mt-2">
                      <PickupInfoCard pickup={checkout.pickup} variant="compact" />
                    </div>
                  </div>
                ) : (city || address) ? (
                  <p className="mt-3">
                    Адрес / город: {city} {address}
                  </p>
                ) : null}
              </div>
              <h2 className="mt-6 font-body text-sm font-semibold text-text">Состав заказа</h2>
              <CartReadonlyLinesList items={items} />
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
              {paymentRedirectUrl ? (
                <a
                  href={paymentRedirectUrl}
                  className="mt-4 inline-flex h-12 items-center justify-center rounded-[40px] bg-accent font-body font-medium text-surface"
                >
                  Перейти к оплате
                </a>
              ) : null}
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
