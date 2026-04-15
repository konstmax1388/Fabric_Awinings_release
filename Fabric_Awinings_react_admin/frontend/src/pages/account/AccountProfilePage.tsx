import { Helmet } from 'react-helmet-async'
import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { patchAuthProfile } from '../../lib/api'
import { formatRuPhoneMask, isCompleteRuPhone, nationalDigitsFromInput, phoneForApi } from '../../lib/formValidation'

export function AccountProfilePage() {
  const { user, accessToken, refreshUser } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName ?? '')
    setLastName(user.lastName ?? '')
    setPhone(
      user.phone ? formatRuPhoneMask(nationalDigitsFromInput(user.phone)) : '',
    )
  }, [user])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!accessToken) return
    setError(null)
    setSaved(false)
    if (phone.trim() && !isCompleteRuPhone(phone)) {
      setError('Введите полный номер телефона или очистите поле')
      return
    }
    setBusy(true)
    const next = await patchAuthProfile(accessToken, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() ? phoneForApi(phone) : '',
    })
    setBusy(false)
    if (!next) {
      setError('Не удалось сохранить')
      return
    }
    await refreshUser()
    setSaved(true)
  }

  return (
    <>
      <Helmet>
        <title>Профиль — Фабрика Тентов</title>
      </Helmet>
      <h1 className="font-heading text-2xl font-semibold text-text md:text-3xl">Профиль</h1>
      <p className="mt-2 font-body text-sm text-text-muted">Имя и контакты для заказов и связи с менеджером.</p>
      <p className="mt-2 font-body text-sm text-text-muted">
        <Link to="/account/change-password" className="text-accent hover:underline">
          Сменить пароль
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex max-w-md flex-col gap-4">
        <label className="block">
          <span className="mb-1 block font-body text-sm font-medium text-text">Email</span>
          <input
            value={user?.email ?? ''}
            disabled
            className="h-11 w-full rounded-xl border border-border bg-border-light/30 px-3 font-body text-text-muted"
          />
        </label>
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
        {error ? (
          <p className="font-body text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="font-body text-sm text-green-700" role="status">
            Сохранено
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="h-12 max-w-xs rounded-[40px] bg-accent font-body font-medium text-surface disabled:opacity-50"
        >
          {busy ? 'Сохранение…' : 'Сохранить'}
        </button>
      </form>
    </>
  )
}
