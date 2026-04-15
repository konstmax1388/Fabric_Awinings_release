import { useEffect, useId, useRef } from 'react'

type StaffEntryModalProps = {
  open: boolean
  onClose: () => void
  reactAdminUrl: string | null
  djangoAdminUrl: string | null
}

export function StaffEntryModal({ open, onClose, reactAdminUrl, djangoAdminUrl }: StaffEntryModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>('a[href]')?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-text/35 backdrop-blur-[3px] transition-opacity"
        aria-label="Закрыть окно"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md origin-bottom sm:origin-center"
      >
        <div className="overflow-hidden rounded-2xl border border-border-light bg-surface shadow-[0_24px_80px_-12px_rgba(26,26,26,0.25)] ring-1 ring-black/5">
          <div className="border-b border-border-light bg-gradient-to-br from-bg-base to-surface px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id={titleId} className="font-heading text-lg font-semibold tracking-tight text-text sm:text-xl">
                  Вход для сотрудников
                </h2>
                <p className="mt-1 font-body text-sm text-text-muted">Выберите панель — откроется в новой вкладке.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-border-light hover:text-text"
                aria-label="Закрыть"
              >
                <span className="text-xl leading-none" aria-hidden>
                  ×
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4 sm:p-5">
            {reactAdminUrl ? (
              <a
                href={reactAdminUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-xl border-2 border-border bg-bg-base px-4 py-4 text-left shadow-sm transition hover:border-accent hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span
                  className="absolute inset-y-0 left-0 w-1 bg-accent opacity-0 transition group-hover:opacity-100"
                  aria-hidden
                />
                <span className="block font-body text-[15px] font-semibold leading-snug text-text group-hover:text-accent">
                  Панель менеджера{' '}
                  <span className="font-medium text-text-muted group-hover:text-text/90">
                    (Каталог, заказы, контент)
                  </span>
                </span>
              </a>
            ) : null}

            {djangoAdminUrl ? (
              <a
                href={djangoAdminUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-xl border-2 border-border bg-bg-base px-4 py-4 text-left shadow-sm transition hover:border-secondary hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              >
                <span
                  className="absolute inset-y-0 left-0 w-1 bg-secondary opacity-0 transition group-hover:opacity-100"
                  aria-hidden
                />
                <span className="block font-body text-[15px] font-semibold leading-snug text-text group-hover:text-secondary">
                  Настройки сайта
                </span>
                <span className="mt-1 block font-body text-xs text-text-subtle">Полный доступ к моделям и сервисным страницам</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
