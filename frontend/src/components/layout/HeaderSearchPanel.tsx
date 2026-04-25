import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'

type Props = {
  open: boolean
  onClose: () => void
}

const easeOut = [0.2, 1, 0.32, 1] as const

const DEBOUNCE_MS = 220

/**
 * Быстрый поиск: при вводе (с дебаунсом) обновляется /search?q=, страница с результатами грузится под панелью.
 */
export function HeaderSearchPanel({ open, onClose }: Props) {
  const id = useId()
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [q, setQ] = useState('')

  const applyQueryToUrl = useCallback(
    (raw: string) => {
      const t = raw.trim()
      if (!t) {
        navigate({ pathname: '/search' }, { replace: true })
        return
      }
      navigate({ pathname: '/search', search: `?q=${encodeURIComponent(t)}` }, { replace: true })
    },
    [navigate],
  )

  useEffect(() => {
    if (open) {
      setQ('')
      const t = window.setTimeout(() => inputRef.current?.focus(), 50)
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        window.clearTimeout(t)
        if (searchDebounceRef.current) {
          clearTimeout(searchDebounceRef.current)
          searchDebounceRef.current = null
        }
        document.body.style.overflow = prev
      }
    }
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = null
    }
    return undefined
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const onQueryChange = useCallback(
    (value: string) => {
      setQ(value)
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = setTimeout(() => {
        searchDebounceRef.current = null
        applyQueryToUrl(value)
      }, DEBOUNCE_MS)
    },
    [applyQueryToUrl],
  )

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-[200] flex flex-col justify-end md:items-center md:justify-end md:pb-10"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)' }}
        >
          <motion.button
            type="button"
            aria-label="Закрыть поиск"
            className="absolute inset-0 z-0 cursor-default bg-[#060a11]/72 backdrop-blur-sm dark:bg-[#0b0f16]/80"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-search-title`}
            className="relative z-10 w-full max-w-lg md:mx-4"
            initial={reduce ? false : { y: '100%' }}
            animate={{ y: 0 }}
            exit={reduce ? undefined : { y: '100%' }}
            transition={reduce ? { duration: 0.15 } : { duration: 0.32, ease: easeOut }}
          >
            <div className="overflow-hidden rounded-t-2xl border border-border/90 bg-surface/98 shadow-[0_-12px_48px_-8px_rgba(0,0,0,0.45)] ring-1 ring-border/40 dark:bg-[#0f1520]/98">
              <div className="border-b border-border/80 px-4 py-3">
                <p id={`${id}-search-title`} className="font-heading text-base font-semibold text-text">
                  Поиск по каталогу
                </p>
                <p className="mt-0.5 font-body text-xs text-text-muted">
                  Результаты подгружаются по мере ввода; внизу — полный экран поиска.
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (searchDebounceRef.current) {
                    clearTimeout(searchDebounceRef.current)
                    searchDebounceRef.current = null
                  }
                  applyQueryToUrl(q)
                }}
                className="space-y-3 p-4"
              >
                <input
                  ref={inputRef}
                  type="search"
                  name="q"
                  value={q}
                  onChange={(e) => onQueryChange(e.target.value.slice(0, 200))}
                  placeholder="Введите запрос…"
                  className="w-full rounded-xl border border-border bg-bg-base px-4 py-3 font-body text-base text-text placeholder:text-text-subtle/80"
                  autoComplete="off"
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    to={q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/search'}
                    onClick={onClose}
                    className="order-2 text-center font-body text-sm text-accent underline-offset-2 hover:underline sm:order-1 sm:text-left"
                  >
                    Страница поиска с фильтрами
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    className="order-1 w-full rounded-xl border border-border px-4 py-2.5 font-body text-sm font-medium text-text transition hover:border-accent/50 sm:order-2 sm:ml-auto sm:w-auto sm:min-w-[7rem]"
                  >
                    Закрыть
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
