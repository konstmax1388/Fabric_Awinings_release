import { motion } from 'framer-motion'
import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

type SpecRow = { groupName: string; name: string; value: string }

type Props = {
  open: boolean
  onClose: () => void
  title: string
  specSections: { groupName: string; rows: SpecRow[] }[] | null
  descriptionHtml: string | null
  descriptionPlain: string
}

export function ProductDetailsDrawer({
  open,
  onClose,
  title,
  specSections,
  descriptionHtml,
  descriptionPlain,
}: Props) {
  const headingId = useId()

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

  if (typeof document === 'undefined') return null

  const hasSpecs = specSections && specSections.length > 0
  const hasDesc =
    (descriptionHtml && descriptionHtml.trim()) || (descriptionPlain && descriptionPlain.trim())

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[#1a1208]/45 backdrop-blur-[2px] transition-opacity"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        className="relative flex h-full w-full max-w-lg flex-col bg-surface shadow-[-12px_0_48px_-12px_rgba(0,0,0,0.18)] md:max-w-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border-light px-5 py-4 md:px-6">
          <h2 id={headingId} className="font-heading text-lg font-semibold text-text md:text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-light text-text-muted transition hover:border-accent hover:bg-bg-base hover:text-text"
            aria-label="Закрыть панель"
          >
            <span className="text-2xl leading-none" aria-hidden>
              ×
            </span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 md:px-6">
          {hasSpecs && (
            <section className="space-y-6">
              {specSections!.map(({ groupName, rows }) => (
                <div key={groupName}>
                  <p className="font-body text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    {groupName}
                  </p>
                  <dl className="mt-3 divide-y divide-border-light font-body text-sm">
                    {rows.map((row, i) => (
                      <div
                        key={`${row.name}-${i}`}
                        className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0"
                      >
                        <dt className="text-text-muted">{row.name}</dt>
                        <dd className="max-w-[min(100%,18rem)] text-right font-medium text-text">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </section>
          )}

          {hasSpecs && hasDesc && <div className="my-8 border-t border-border-light" aria-hidden />}

          {hasDesc && (
            <section>
              <p className="font-body text-xs font-semibold uppercase tracking-wide text-text-subtle">
                Описание
              </p>
              {descriptionHtml ? (
                <div
                  className="product-description mt-4 font-body text-base leading-relaxed text-text-muted [&_p]:mb-3 [&_p:last-child]:mb-0 [&_br]:leading-normal"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              ) : (
                <p className="mt-4 whitespace-pre-wrap font-body text-base leading-relaxed text-text-muted">
                  {descriptionPlain}
                </p>
              )}
            </section>
          )}

          {!hasSpecs && !hasDesc && (
            <p className="font-body text-text-muted">Нет подробных данных по этой позиции.</p>
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}
