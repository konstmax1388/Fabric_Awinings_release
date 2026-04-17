import { Helmet } from 'react-helmet-async'
import { type FormEvent, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { useAuth } from '../../context/AuthContext'
import { optionalEmailError } from '../../lib/formValidation'

export function AccountLoginPage() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/account/orders'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) {
    return <Navigate to="/account/orders" replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const ee = optionalEmailError(email)
    if (ee) {
      setError(ee)
      return
    }
    setBusy(true)
    const res = await login(email.trim(), password)
    setBusy(false)
    if (res.ok) {
      if (res.passwordChangeBlocking) navigate('/account/change-password', { replace: true })
      else navigate(from, { replace: true })
    } else setError(res.error ?? 'Ошибка входа')
  }

  return (
    <>
      <Helmet>
        <title>Вход — Фабрика Тентов</title>
      </Helmet>
      <SiteHeader />
      <main className="mx-auto min-h-[60vh] min-w-0 max-w-lg overflow-x-clip px-4 py-10 md:mx-auto md:max-w-[1280px] md:px-6 md:py-14">
        <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-sm text-text-muted">
          <Link to="/" className="hover:text-accent">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text">Вход</span>
        </nav>
        <h1 className="mt-8 font-heading text-2xl font-semibold text-text md:text-3xl">Вход в личный кабинет</h1>
        <p className="mt-2 font-body text-sm text-text-muted">
          Нет аккаунта?{' '}
          <Link to="/account/register" className="text-accent hover:underline">
            Регистрация
          </Link>
        </p>
        <form onSubmit={onSubmit} className="mt-8 flex max-w-md flex-col gap-4">
          <label className="block">
            <span className="mb-1 block font-body text-sm font-medium text-text">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-sm font-medium text-text">Пароль</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
              required
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
            {busy ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </main>
      <SiteFooter />
    </>
  )
}
