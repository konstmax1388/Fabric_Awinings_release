import { motion, useReducedMotion } from 'framer-motion'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { ContactsContentBlock } from '../contacts/ContactsContentBlock'
import { SITE } from '../../config/site'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { constructorMapHeightPx, parseMapEmbed } from '../../lib/yandexMapEmbed'
import { YandexConstructorMap } from './YandexConstructorMap'
import {
  COMMENT_MAX_LEN,
  formatRuPhoneMask,
  isCompleteRuPhone,
  nationalDigitsFromInput,
  personNameError,
  phoneForApi,
} from '../../lib/formValidation'
import { submitCallbackLead } from '../../lib/leads'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../../lib/motion-presets'

export function MapFormSection({ showHeading = true }: { showHeading?: boolean }) {
  const reduce = useReducedMotion()
  const { home, address, mapForm } = useSiteSettings()
  const mf = { ...home?.mapForm, ...(mapForm ?? {}) }
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mapEmbed = parseMapEmbed(mf.mapIframeSrc)
  const constructorMinH =
    mapEmbed.kind === 'constructor' ? constructorMapHeightPx(mapEmbed.scriptSrc) : undefined
  const mapTitle = mf.mapTitle ?? 'Карта — расположение производства'
  const formNameLabel = mf.formNameLabel ?? 'Имя'
  const formPhoneLabel = mf.formPhoneLabel ?? 'Телефон'
  const formCommentLabel = mf.formCommentLabel ?? 'Комментарий'
  const namePlaceholder = mf.namePlaceholder ?? 'Как к вам обращаться'
  const phonePlaceholder = mf.phonePlaceholder ?? '+7'
  const commentPlaceholder = mf.commentPlaceholder ?? 'Задача, размеры, сроки'
  const submitButton = mf.submitButton ?? 'Отправить'
  const submitting = mf.submitting ?? 'Отправка…'
  const successMessage =
    mf.successMessage ?? 'Спасибо! Заявка принята. Перезвоним в рабочее время.'

  const addressLine = address?.trim() || SITE.address

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const ne = personNameError(name)
    if (ne) {
      setError(ne)
      return
    }
    if (!isCompleteRuPhone(phone)) {
      setError('Введите полный номер телефона')
      return
    }
    if (comment.trim().length > COMMENT_MAX_LEN) {
      setError(`Комментарий не длиннее ${COMMENT_MAX_LEN} символов`)
      return
    }
    setSending(true)
    try {
      const { ok } = await submitCallbackLead({
        name: name.trim(),
        phone: phoneForApi(phone),
        comment: comment.trim() || undefined,
        source: 'other',
      })
      if (ok) {
        setDone(true)
        setName('')
        setPhone('')
        setComment('')
      } else setError('Не удалось отправить. Позвоните нам или напишите на почту.')
    } catch {
      setError('Ошибка сети. Попробуйте позже.')
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.section
      className="mx-auto min-w-0 max-w-[1280px] px-4 py-12 md:px-6 md:py-24"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.06 }}
      transition={easeOutSoft}
    >
      {showHeading ? <ContactsContentBlock titleAs="h2" /> : null}

      <motion.div
        className={`grid min-w-0 gap-8 lg:grid-cols-2 lg:gap-12 ${showHeading ? 'mt-10' : ''}`}
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.12 }}
      >
        <motion.div
          variants={staggerItem}
          whileHover={
            reduce ? undefined : { y: -2, boxShadow: '0 16px 32px -12px rgba(0,0,0,0.1)' }
          }
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="min-w-0 overflow-hidden rounded-[24px] border border-border-light bg-surface shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)]"
        >
          {mapEmbed.kind === 'constructor' ? (
            <YandexConstructorMap
              scriptSrc={mapEmbed.scriptSrc}
              title={mapTitle}
              minHeightPx={constructorMinH}
            />
          ) : (
            <iframe
              title={mapTitle}
              src={mapEmbed.src}
              width="100%"
              height="400"
              className="min-h-[320px] w-full border-0 md:min-h-[400px]"
              allowFullScreen
            />
          )}
          <div className="border-t border-border-light p-4 font-body text-sm text-text-muted">{addressLine}</div>
        </motion.div>

        <motion.form
          variants={staggerItem}
          className="min-w-0 rounded-[24px] border border-border-light bg-surface p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] md:p-8"
          onSubmit={handleSubmit}
        >
          {done ? (
            <p className="font-body text-text md:text-lg">{successMessage}</p>
          ) : (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text">{formNameLabel}</span>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={namePlaceholder}
                  className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
                />
              </label>
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-medium text-text">{formPhoneLabel}</span>
                <input
                  type="tel"
                  inputMode="tel"
                  name="phone"
                  autoComplete="tel"
                  required
                  placeholder={phonePlaceholder ?? '+7 (900) 000-00-00'}
                  value={phone}
                  onChange={(e) =>
                    setPhone(formatRuPhoneMask(nationalDigitsFromInput(e.target.value)))
                  }
                  className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
                />
              </label>
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-medium text-text">{formCommentLabel}</span>
                <textarea
                  name="comment"
                  rows={4}
                  maxLength={COMMENT_MAX_LEN}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={commentPlaceholder}
                  className="w-full rounded-2xl border border-border bg-surface px-5 py-4 font-body text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
                />
              </label>
              {error ? <p className="mt-3 font-body text-sm text-red-600">{error}</p> : null}
              <p className="mt-3 font-body text-xs leading-relaxed text-text-subtle">
                Нажимая «{submitButton}», вы соглашаетесь с{' '}
                <Link to="/privacy" className="text-accent hover:underline">
                  политикой конфиденциальности
                </Link>{' '}
                и{' '}
                <Link to="/offer" className="text-accent hover:underline">
                  публичной офертой
                </Link>
                .
              </p>
              <motion.button
                type="submit"
                disabled={sending}
                className="mt-6 w-full rounded-[40px] bg-accent py-4 font-body font-medium text-surface shadow-[0_4px_8px_0_rgba(232,122,0,0.25)] transition hover:bg-[#c65f00] disabled:opacity-60 md:w-auto md:px-12"
                style={{ letterSpacing: '0.02em' }}
                whileHover={reduce || sending ? undefined : { scale: 1.02 }}
                whileTap={reduce || sending ? undefined : { scale: 0.98 }}
              >
                {sending ? submitting : submitButton}
              </motion.button>
            </>
          )}
        </motion.form>
      </motion.div>
    </motion.section>
  )
}
