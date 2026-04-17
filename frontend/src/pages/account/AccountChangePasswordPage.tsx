import { Helmet } from 'react-helmet-async'
import { type FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { useAuth } from '../../context/AuthContext'
import { postChangePassword } from '../../lib/api'

export function AccountChangePasswordPage() {
  const { user, accessToken, refreshUser } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!user) {
    return <Navigate to="/account/login" replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    if (newPassword !== newPassword2) {
      setError('Новые пароли не совпадают')
      return
    }
    if (newPassword.length < 8) {
      setError('Новый пароль — не короче 8 символов')
      return
    }
    if (!accessToken) return
    setBusy(true)
    const res = await postChangePassword(accessToken, { oldPassword, newPassword })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setOldPassword('')
    setNewPassword('')
    setNewPassword2('')
    setSaved(true)
    await refreshUser()
  }

  const blocking = Boolean(user.passwordChangeBlocking)
  const deadline = user.passwordChangeDeadline

  return (
    <>
      <Helmet>
        <title>Смена пароля — Фабрика Тентов</title>
      </Helmet>
      <SiteHeader />
      <main className="mx-auto min-h-[60vh] min-w-0 max-w-lg overflow-x-clip px-4 py-10 md:mx-auto md:max-w-[1280px] md:px-6 md:py-14">
        <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-sm text-text-muted">
          <Link to="/" className="hover:text-accent">
            Главная
          </Link>
          <span className="mx-2">/</span>
          <Link to="/account/orders" className="hover:text-accent">
            Личный кабинет
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text">Смена пароля</span>
        </nav>

        <h1 className="mt-8 font-heading text-2xl font-semibold text-text md:text-3xl">Смена пароля</h1>

        {blocking ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-body text-sm text-amber-950">
            Срок действия временного пароля из письма истёк. Укажите старый пароль из письма и задайте новый, чтобы снова
            открыть заказы и адреса доставки.
          </p>
        ) : deadline ? (
          <p className="mt-3 rounded-xl border border-border-light bg-bg-base px-4 py-3 font-body text-sm text-text-muted">
            Рекомендуем сменить временный пароль из письма до{' '}
            <span className="font-medium text-text">
              {new Date(deadline).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            .
          </p>
        ) : (
          <p className="mt-2 font-body text-sm text-text-muted">
            Задайте новый пароль, если вы входите по временному паролю из письма после заказа.
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-8 flex max-w-md flex-col gap-4">
          <label className="block">
            <span className="mb-1 block font-body text-sm font-medium text-text">Текущий пароль</span>
            <input
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-sm font-medium text-text">Новый пароль</span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
              required
              minLength={8}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-sm font-medium text-text">Повтор нового пароля</span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent"
              required
              minLength={8}
            />
          </label>
          {error ? (
            <p className="font-body text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="font-body text-sm text-green-700" role="status">
              Пароль обновлён. Можете перейти к{' '}
              <Link to="/account/orders" className="text-accent hover:underline">
                заказам
              </Link>
              .
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="h-12 max-w-xs rounded-[40px] bg-accent font-body font-medium text-surface disabled:opacity-50"
          >
            {busy ? 'Сохранение…' : 'Сохранить пароль'}
          </button>
        </form>
      </main>
      <SiteFooter />
    </>
  )
}
