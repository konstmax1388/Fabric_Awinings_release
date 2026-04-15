import { Helmet } from 'react-helmet-async'
import { type FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { useAuth } from '../../context/AuthContext'
import {
  formatRuPhoneMask,
  isCompleteRuPhone,
  nationalDigitsFromInput,
  optionalEmailError,
  phoneForApi,
} from '../../lib/formValidation'

export function AccountRegisterPage() {
  const { user, loading, register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) {
    return <Navigate to="/account/orders" replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Пароль не короче 8 символов')
      return
    }
    const ee = optionalEmailError(email)
    if (ee) {
      setError(ee)
      return
    }
    if (phone.trim() && !isCompleteRuPhone(phone)) {
      setError('Введите полный номер телефона или оставьте поле пустым')
      return
    }
    setBusy(true)
    const res = await register({
      email: email.trim(),
      password,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() ? phoneForApi(phone) : undefined,
    })
    setBusy(false)
    if (!res.ok) setError(res.error ?? 'Не удалось зарегистрироваться')
  }

  return (
    <>
      <Helmet>
        <title>Регистрация — Фабрика Тентов</title>
      </Helmet>
      <SiteHeader />
      <main className="mx-auto min-h-[60vh] max-w-lg px-4 py-10 md:mx-auto md:max-w-[1280px] md:px-6 md:py-14">
        <nav className="font-body text-sm text-text-muted">
          <Link to="/" className="hover:text-accent">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text">Регистрация</span>
        </nav>
        <h1 className="mt-8 font-heading text-2xl font-semibold text-text md:text-3xl">Создать аккаунт</h1>
        <p className="mt-2 font-body text-sm text-text-muted">
          Уже есть аккаунт?{' '}
          <Link to="/account/login" className="text-accent hover:underline">
            Войти
          </Link>
        </p>
        <form onSubmit={onSubmit} className="mt-8 flex max-w-md flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-body text-sm font-medium text-text">Имя</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
                autoComplete="given-name"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-body text-sm font-medium text-text">Фамилия</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
                autoComplete="family-name"
              />
            </label>
          </div>
          <label className="block">
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
          <label className="block">
            <span className="mb-1 block font-body text-sm font-medium text-text">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
              autoComplete="email"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-sm font-medium text-text">Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>
          {error ? (
            <p className="font-body text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || loading}
            className="h-12 rounded-[40px] bg-accent font-body font-medium text-surface disabled:opacity-50"
          >
            {busy ? 'Регистрация…' : 'Зарегистрироваться'}
          </button>
        </form>
      </main>
      <SiteFooter />
    </>
  )
}
