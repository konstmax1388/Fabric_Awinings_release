import { Helmet } from 'react-helmet-async'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  deleteAddress,
  fetchAddresses,
  patchAddress,
  postAddress,
  type ShippingAddressDto,
} from '../../lib/api'
import {
  formatRuPhoneMask,
  isCompleteRuPhone,
  nationalDigitsFromInput,
  phoneForApi,
} from '../../lib/formValidation'

const emptyForm: Omit<ShippingAddressDto, 'id'> = {
  label: 'Дом',
  city: '',
  street: '',
  building: '',
  apartment: '',
  postal_code: '',
  recipient_name: '',
  recipient_phone: '',
  is_default: false,
}

export function AccountAddressesPage() {
  const { accessToken } = useAuth()
  const [list, setList] = useState<ShippingAddressDto[] | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!accessToken) return
    const rows = await fetchAddresses(accessToken)
    setList(rows ?? [])
  }, [accessToken])

  useEffect(() => {
    load()
  }, [load])

  const onAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!accessToken) return
    setError(null)
    if (!form.city.trim() || !form.street.trim()) {
      setError('Укажите город и улицу')
      return
    }
    if (form.recipient_phone.trim() && !isCompleteRuPhone(form.recipient_phone)) {
      setError('Введите полный телефон получателя или оставьте поле пустым')
      return
    }
    setBusy(true)
    const row = await postAddress(accessToken, {
      ...form,
      city: form.city.trim(),
      street: form.street.trim(),
      recipient_phone: form.recipient_phone.trim()
        ? phoneForApi(form.recipient_phone)
        : '',
    })
    setBusy(false)
    if (!row) {
      setError('Не удалось добавить адрес')
      return
    }
    setForm(emptyForm)
    await load()
  }

  const onDelete = async (id: number) => {
    if (!accessToken || !confirm('Удалить этот адрес?')) return
    await deleteAddress(accessToken, id)
    await load()
  }

  const onSetDefault = async (id: number) => {
    if (!accessToken) return
    await patchAddress(accessToken, id, { is_default: true })
    await load()
  }

  return (
    <>
      <Helmet>
        <title>Адреса доставки — Фабрика Тентов</title>
      </Helmet>
      <h1 className="font-heading text-2xl font-semibold text-text md:text-3xl">Адреса доставки</h1>
      <p className="mt-2 font-body text-sm text-text-muted">
        Сохранённые адреса пригодятся при оформлении доставки. Сейчас заказ на сайте можно оформить с произвольным
        адресом на шаге «Доставка».
      </p>

      {list && list.length > 0 && (
        <ul className="mt-8 flex flex-col gap-3">
          {list.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-3 rounded-2xl border border-border-light bg-bg-base p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="font-body text-sm font-semibold text-text">
                  {a.label}
                  {a.is_default ? (
                    <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                      по умолчанию
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 font-body text-sm text-text-muted">
                  {a.postal_code ? `${a.postal_code}, ` : ''}
                  {a.city}, {a.street}
                  {a.building ? `, ${a.building}` : ''}
                  {a.apartment ? `, ${a.apartment}` : ''}
                </p>
                {(a.recipient_name || a.recipient_phone) && (
                  <p className="mt-1 font-body text-xs text-text-subtle">
                    {a.recipient_name} {a.recipient_phone}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!a.is_default ? (
                  <button
                    type="button"
                    onClick={() => onSetDefault(a.id)}
                    className="rounded-xl border border-border px-3 py-1.5 font-body text-xs text-text hover:border-accent"
                  >
                    По умолчанию
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onDelete(a.id)}
                  className="rounded-xl border border-border px-3 py-1.5 font-body text-xs text-red-600 hover:border-red-400"
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 font-body text-lg font-semibold text-text">Новый адрес</h2>
      <form onSubmit={onAdd} className="mt-4 flex max-w-lg flex-col gap-3">
        <label className="block">
          <span className="mb-1 block font-body text-xs text-text-muted">Название</span>
          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            className="h-10 w-full rounded-xl border border-border px-3 font-body text-sm outline-none focus:border-accent"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-body text-xs text-text-muted">Город *</span>
            <input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="h-10 w-full rounded-xl border border-border px-3 font-body text-sm outline-none focus:border-accent"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-xs text-text-muted">Индекс</span>
            <input
              value={form.postal_code}
              onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
              className="h-10 w-full rounded-xl border border-border px-3 font-body text-sm outline-none focus:border-accent"
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block font-body text-xs text-text-muted">Улица *</span>
          <input
            value={form.street}
            onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
            className="h-10 w-full rounded-xl border border-border px-3 font-body text-sm outline-none focus:border-accent"
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-body text-xs text-text-muted">Дом / корпус</span>
            <input
              value={form.building}
              onChange={(e) => setForm((f) => ({ ...f, building: e.target.value }))}
              className="h-10 w-full rounded-xl border border-border px-3 font-body text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-xs text-text-muted">Квартира / офис</span>
            <input
              value={form.apartment}
              onChange={(e) => setForm((f) => ({ ...f, apartment: e.target.value }))}
              className="h-10 w-full rounded-xl border border-border px-3 font-body text-sm outline-none focus:border-accent"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-body text-xs text-text-muted">Получатель</span>
            <input
              value={form.recipient_name}
              onChange={(e) => setForm((f) => ({ ...f, recipient_name: e.target.value }))}
              className="h-10 w-full rounded-xl border border-border px-3 font-body text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-xs text-text-muted">Телефон получателя</span>
            <input
              type="tel"
              inputMode="tel"
              placeholder="+7 (900) 000-00-00"
              value={form.recipient_phone}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  recipient_phone: formatRuPhoneMask(nationalDigitsFromInput(e.target.value)),
                }))
              }
              className="h-10 w-full rounded-xl border border-border px-3 font-body text-sm outline-none focus:border-accent"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 font-body text-sm text-text">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
          />
          Сделать адресом по умолчанию
        </label>
        {error ? (
          <p className="font-body text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="h-11 max-w-xs rounded-[40px] bg-accent font-body text-sm font-medium text-surface disabled:opacity-50"
        >
          {busy ? 'Добавление…' : 'Добавить адрес'}
        </button>
      </form>
    </>
  )
}
