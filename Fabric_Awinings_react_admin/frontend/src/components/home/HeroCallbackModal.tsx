import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { type FormEvent, useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  formatRuPhoneMask,
  isCompleteRuPhone,
  nationalDigitsFromInput,
  personNameError,
  phoneForApi,
} from '../../lib/formValidation'
import { submitCallbackLead } from '../../lib/leads'
import type { HeroCallbackModalTexts } from '../../types/homePage'
import { easeOutSoft } from '../../lib/motion-presets'

type Props = {
  open: boolean
  onClose: () => void
  modal: HeroCallbackModalTexts
}

export function HeroCallbackModal({ open, onClose, modal }: Props) {
  const reduce = useReducedMotion()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setName('')
    setPhone('')
    setSending(false)
    setDone(false)
    setError(null)
  }, [])

  useEffect(() => {
    if (open) {
      reset()
      const t = window.setTimeout(() => panelRef.current?.querySelector<HTMLInputElement>('input[name="cb-name"]')?.focus(), 50)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [open, reset])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const title = modal.title ?? 'Обратный звонок'
  const nameLabel = modal.nameLabel ?? 'Имя'
  const phoneLabel = modal.phoneLabel ?? 'Телефон'
  const submitBtn = modal.submitButton ?? 'Заказать звонок'
  const submitting = modal.submitting ?? 'Отправка…'
  const success = modal.successMessage ?? 'Спасибо! Мы перезвоним в рабочее время.'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const n = name.trim()
    const ne = personNameError(name)
    if (ne) {
      setError(ne)
      return
    }
    if (!isCompleteRuPhone(phone)) {
      setError('Введите полный номер телефона')
      return
    }
    setSending(true)
    try {
      const { ok } = await submitCallbackLead({ name: n, phone: phoneForApi(phone) })
      if (ok) setDone(true)
      else setError('Не удалось отправить. Позвоните нам или напишите на почту.')
    } catch {
      setError('Ошибка сети. Попробуйте позже.')
    } finally {
      setSending(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center" role="presentation">
          <motion.button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0 bg-[#1a1a1a]/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={easeOutSoft}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-md rounded-[24px] border border-border-light bg-surface p-6 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.25)] md:p-8"
            initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
            animate={reduce ? false : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={easeOutSoft}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2 id={titleId} className="font-heading text-2xl font-bold tracking-tight text-text">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-border-light hover:text-text"
                aria-label="Закрыть окно"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            {done ? (
              <p className="font-body text-text md:text-lg">{success}</p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text">{nameLabel}</span>
                  <input
                    name="cb-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text">{phoneLabel}</span>
                  <input
                    name="cb-phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="+7 (900) 000-00-00"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(formatRuPhoneMask(nationalDigitsFromInput(e.target.value)))
                    }
                    required
                    className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
                  />
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={sending}
                  className="mt-2 w-full rounded-[40px] bg-accent py-4 font-body font-medium text-surface shadow-[0_4px_8px_0_rgba(232,122,0,0.25)] transition hover:bg-[#c65f00] disabled:opacity-60"
                  style={{ letterSpacing: '0.02em' }}
                >
                  {sending ? submitting : submitBtn}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
