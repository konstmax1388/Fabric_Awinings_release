import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

import { apiBase } from '../../lib/api'

type AddressSuggestResponse = {
  suggestions?: { label: string }[]
}

type AddressOption = {
  label: string
}

type Props = {
  id?: string
  value: string
  onChange: (address: string) => void
  cityHint: string
  yandexApiKey: string
  /** Текст под полем, если подсказки по адресу недоступны (нет ключа карты). */
  suggestUnavailableNote: string
  disabled?: boolean
}

const DEBOUNCE_MS = 300
const MIN_QUERY = 3

/**
 * Адрес для СДЭК: выбор из подсказок Яндекс.Карт.
 * Если ключ не задан, работает как обычное поле ввода.
 */
export function CdekAddressCombobox({
  id,
  value,
  onChange,
  cityHint,
  yandexApiKey,
  suggestUnavailableNote,
  disabled,
}: Props) {
  const inputId = useId()
  const listboxId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [search, setSearch] = useState(value)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<AddressOption[]>([])
  const [highlight, setHighlight] = useState(0)

  /** Ключ в JSON витрины: подсказки идут через прокси бэкенда (CORS/403 при прямом вызове Suggest). */
  const hasSuggest = yandexApiKey.trim().length > 0

  useEffect(() => {
    setSearch(value)
  }, [value])

  useEffect(() => {
    setHighlight(0)
  }, [options])

  const fetchSuggestions = useCallback(
    async (q: string) => {
      if (!hasSuggest || q.trim().length < MIN_QUERY) {
        setOptions([])
        return
      }
      setLoading(true)
      try {
        const qs = new URLSearchParams({ q: q.trim() })
        if (cityHint.trim()) qs.set('city', cityHint.trim())
        const r = await fetch(`${apiBase()}/api/cdek/address-suggest/?${qs.toString()}`, { cache: 'no-store' })
        const data = (await r.json()) as AddressSuggestResponse
        if (!r.ok) {
          setOptions([])
          return
        }
        const out: AddressOption[] = []
        for (const row of data.suggestions ?? []) {
          if (row && typeof row.label === 'string' && row.label.trim()) {
            out.push({ label: row.label.trim() })
          }
        }
        setOptions(out)
      } catch {
        setOptions([])
      } finally {
        setLoading(false)
      }
    },
    [cityHint, hasSuggest],
  )

  useEffect(() => {
    if (!hasSuggest || disabled) return
    const q = search.trim()
    if (q.length < MIN_QUERY) {
      setOptions([])
      return
    }
    const t = window.setTimeout(() => {
      void fetchSuggestions(q)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [search, disabled, hasSuggest, fetchSuggestions])

  const commitSelection = useCallback(
    (opt: AddressOption) => {
      setSearch(opt.label)
      onChange(opt.label)
      setOpen(false)
      setOptions([])
    },
    [onChange],
  )

  const handleBlur = useCallback(() => {
    if (!hasSuggest) return
    blurTimer.current = window.setTimeout(() => {
      setOpen(false)
      // Для адреса не навязываем выбор из подсказок: пользователь может оставить текст вручную.
    }, 180)
  }, [hasSuggest])

  const handleFocus = useCallback(() => {
    if (!hasSuggest) return
    if (blurTimer.current) {
      window.clearTimeout(blurTimer.current)
      blurTimer.current = null
    }
    if (search.trim().length >= MIN_QUERY) setOpen(true)
  }, [hasSuggest, search])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!hasSuggest) return
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter') && search.trim().length >= MIN_QUERY) {
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
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
    <div ref={wrapRef} className="relative mt-3">
      <label htmlFor={id ?? inputId} className="mb-1 block font-body text-sm font-medium text-text">
        Адрес (курьер / уточнение)
      </label>
      <input
        id={id ?? inputId}
        type="text"
        autoComplete="off"
        role={hasSuggest ? 'combobox' : undefined}
        aria-expanded={hasSuggest ? open : undefined}
        aria-controls={hasSuggest ? listboxId : undefined}
        aria-autocomplete={hasSuggest ? 'list' : undefined}
        disabled={disabled}
        placeholder={hasSuggest ? 'Начните вводить адрес…' : 'Улица, дом, корпус'}
        value={search}
        onChange={(e) => {
          const v = e.target.value
          setSearch(v)
          onChange(v)
          if (hasSuggest && v.trim().length >= MIN_QUERY) setOpen(true)
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
      {hasSuggest ? (
        <p className="mt-1.5 font-body text-xs text-text-muted">
          Введите от {MIN_QUERY} символов: можно выбрать из списка или оставить адрес вручную.
        </p>
      ) : (
        <p className="mt-1.5 font-body text-xs text-amber-800">{suggestUnavailableNote}</p>
      )}

      {hasSuggest && open && search.trim().length >= MIN_QUERY ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-[80] mt-1 max-h-60 overflow-auto rounded-xl border border-border-light bg-surface py-1 shadow-lg ring-1 ring-border-light/80"
        >
          {loading ? (
            <li className="px-3 py-2 font-body text-sm text-text-muted">Загрузка…</li>
          ) : options.length === 0 ? (
            <li className="px-3 py-2 font-body text-sm text-text-muted">Ничего не найдено</li>
          ) : (
            options.map((opt, i) => (
              <li key={`${opt.label}-${i}`} role="presentation">
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
