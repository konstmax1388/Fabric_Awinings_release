import { useEffect, useState } from 'react'
import { apiBase } from '../../lib/api'

export type CdekPickupPointRow = { code: string; name: string; address: string }

type Props = {
  cityCode: number | null
  selectedCode: string
  disabled?: boolean
  onSelect: (code: string, addressLine: string) => void
}

export function CdekPickupListCustom({ cityCode, selectedCode, disabled, onSelect }: Props) {
  const [points, setPoints] = useState<CdekPickupPointRow[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (disabled || cityCode === null) {
      setPoints([])
      setFetchError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setFetchError(null)
    const url = `${apiBase()}/api/cdek/pickup-points/?city_code=${cityCode}`
    void fetch(url)
      .then(async (r) => {
        const data = (await r.json()) as { detail?: string; points?: unknown }
        if (!r.ok) {
          return { ok: false as const, detail: typeof data.detail === 'string' ? data.detail : 'Не удалось загрузить пункты.' }
        }
        const raw = data.points
        const list: CdekPickupPointRow[] = []
        if (Array.isArray(raw)) {
          for (const row of raw) {
            if (!row || typeof row !== 'object') continue
            const o = row as Record<string, unknown>
            const code = typeof o.code === 'string' ? o.code.trim() : ''
            if (!code) continue
            const name = typeof o.name === 'string' ? o.name : ''
            const address = typeof o.address === 'string' ? o.address : ''
            list.push({ code, name, address })
          }
        }
        return { ok: true as const, list }
      })
      .then((res) => {
        if (cancelled) return
        if (!res.ok) {
          setPoints([])
          setFetchError(res.detail)
          return
        }
        setPoints(res.list)
      })
      .catch(() => {
        if (!cancelled) {
          setPoints([])
          setFetchError('Ошибка сети. Попробуйте ещё раз.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cityCode, disabled])

  if (cityCode === null) {
    return (
      <p className="mt-2 font-body text-sm text-text-muted">
        Выберите город из списка подсказок — затем покажем доступные пункты выдачи.
      </p>
    )
  }

  if (loading) {
    return <p className="mt-2 font-body text-sm text-text-muted">Загрузка пунктов выдачи…</p>
  }

  if (fetchError) {
    return (
      <p className="mt-2 font-body text-sm text-red-600" role="alert">
        {fetchError}
      </p>
    )
  }

  if (!points.length) {
    return (
      <p className="mt-2 font-body text-sm text-text-muted">
        Для этого города нет пунктов выдачи в ответе СДЭК. Попробуйте другой населённый пункт или введите код ПВЗ вручную
        ниже.
      </p>
    )
  }

  const lineFor = (p: CdekPickupPointRow) =>
    [p.name, p.address].filter((s) => s.trim().length > 0).join(', ')

  return (
    <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-border-light bg-bg-base p-2">
      <ul className="space-y-1">
        {points.map((p) => {
          const id = `cdek-pvz-${p.code}`
          const checked = selectedCode.trim() === p.code
          return (
            <li key={p.code}>
              <label
                htmlFor={id}
                className={`flex cursor-pointer gap-3 rounded-lg px-2 py-2 font-body text-sm ${
                  checked ? 'bg-accent/10 ring-1 ring-accent' : 'hover:bg-border-light/60'
                }`}
              >
                <input
                  id={id}
                  type="radio"
                  name="cdekCustomPvz"
                  className="mt-1"
                  checked={checked}
                  onChange={() => onSelect(p.code, lineFor(p))}
                />
                <span className="min-w-0 flex-1 text-text">
                  <span className="font-medium">{p.code}</span>
                  {p.name ? <span className="block text-text-muted">{p.name}</span> : null}
                  {p.address ? <span className="block text-text-muted">{p.address}</span> : null}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
