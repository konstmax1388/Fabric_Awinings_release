import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { apiBase } from '../../lib/api'

export type CdekCityOption = {
  code: number | null
  city: string
  region: string
  label: string
}

type Props = {
  id?: string
  value: string
  onChange: (cityLabel: string) => void
  disabled?: boolean
}

const DEBOUNCE_MS = 320
const MIN_QUERY = 2

/**
 * Город только из подсказок API СДЭК (поиск по мере ввода).
 * Свободный текст в заказ не уходит: при потере фокуса без выбора восстанавливается последнее подтверждённое значение.
 */
export function CdekCityCombobox({ id, value, onChange, disabled }: Props) {
  const inputId = useId()
  const listboxId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [search, setSearch] = useState(value)
  const [committed, setCommitted] = useState(value)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<CdekCityOption[]>([])
  const [highlight, setHighlight] = useState(0)

  useEffect(() => {
    setSearch(value)
    setCommitted(value)
  }, [value])

  useEffect(() => {
    setHighlight(0)
  }, [options])

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < MIN_QUERY) {
      setOptions([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const url = `${apiBase()}/api/cdek/suggest-cities/?q=${encodeURIComponent(q.trim())}`
      const r = await fetch(url)
      const data = (await r.json()) as { results?: CdekCityOption[]; detail?: string }
      if (!r.ok) {
        setOptions([])
        setError(typeof data.detail === 'string' ? data.detail : 'Не удалось загрузить подсказки')
        return
      }
      const rows = Array.isArray(data.results) ? data.results : []
      setOptions(rows)
    } catch {
      setOptions([])
      setError('Ошибка сети. Проверьте соединение.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (disabled) return
    const q = search.trim()
    if (q.length < MIN_QUERY) {
      setOptions([])
      return
    }
    const t = window.setTimeout(() => {
      void fetchSuggestions(q)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [search, disabled, fetchSuggestions])

  const commitSelection = useCallback(
    (opt: CdekCityOption) => {
      setCommitted(opt.label)
      setSearch(opt.label)
      onChange(opt.label)
      setOpen(false)
      setOptions([])
    },
    [onChange],
  )

  const handleBlur = useCallback(() => {
    blurTimer.current = window.setTimeout(() => {
      setOpen(false)
      if (search.trim() === '') {
        if (committed !== '') {
          setCommitted('')
          onChange('')
        }
        setSearch('')
      } else if (search.trim() !== committed.trim()) {
        setSearch(committed)
      }
    }, 180)
  }, [committed, onChange, search])

  const handleFocus = useCallback(() => {
    if (blurTimer.current) {
      window.clearTimeout(blurTimer.current)
      blurTimer.current = null
    }
    if (search.trim().length >= MIN_QUERY) setOpen(true)
  }, [search])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter') && search.trim().length >= MIN_QUERY) {
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setSearch(committed)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (options.length ? (h + 1) % options.length : 0))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (options.length ? (h - 1 + options.length) % options.length : 0))
    }
    if (e.key === 'Enter' && options.length) {
      e.preventDefault()
      commitSelection(options[highlight]!)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={id ?? inputId} className="mb-1 block font-body text-sm font-medium text-text">
        Город
      </label>
      <input
        id={id ?? inputId}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        disabled={disabled}
        placeholder="Начните вводить название города…"
        value={search}
        onChange={(e) => {
          const v = e.target.value
          setSearch(v)
          if (v.trim().length >= MIN_QUERY) setOpen(true)
          else {
            setOpen(false)
            setOptions([])
          }
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        className="h-11 w-full rounded-xl border border-border px-3 font-body outline-none focus:border-accent disabled:opacity-60"
      />
      <p className="mt-1.5 font-body text-xs text-text-muted">
        Выберите город из списка подсказок СДЭК (от {MIN_QUERY} букв). Свой вариант текста не сохранится — только выбор из
        списка.
      </p>
      {error ? <p className="mt-1 font-body text-xs text-amber-800">{error}</p> : null}

      {open && search.trim().length >= MIN_QUERY ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-[80] mt-1 max-h-60 overflow-auto rounded-xl border border-border-light bg-surface py-1 shadow-lg ring-1 ring-border-light/80"
        >
          {loading ? (
            <li className="px-3 py-2 font-body text-sm text-text-muted">Загрузка…</li>
          ) : options.length === 0 ? (
            <li className="px-3 py-2 font-body text-sm text-text-muted">
              {error ? null : 'Ничего не найдено — измените запрос'}
            </li>
          ) : (
            options.map((opt, i) => (
              <li key={`${opt.code ?? 'x'}-${opt.label}-${i}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={i === highlight}
                  className={`flex w-full px-3 py-2.5 text-left font-body text-sm transition ${
                    i === highlight ? 'bg-accent/12 text-text' : 'text-text hover:bg-bg-base'
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commitSelection(opt)}
                >
                  {opt.label}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
