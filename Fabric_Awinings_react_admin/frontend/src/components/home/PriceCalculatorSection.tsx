import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'
import {
  CALC_MATERIALS,
  CALC_OPTIONS,
  calcTentPrice,
  type CalcMaterialId,
} from '../../lib/calculator'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import {
  COMMENT_MAX_LEN,
  formatRuPhoneMask,
  isCompleteRuPhone,
  nationalDigitsFromInput,
  personNameError,
  phoneForApi,
} from '../../lib/formValidation'
import { submitCalculatorLead } from '../../lib/leads'
import { easeOutSoft, fadeUpHidden, fadeUpVisible } from '../../lib/motion-presets'

export function PriceCalculatorSection() {
  const { home } = useSiteSettings()
  const c = home?.calculator ?? {}

  const [length, setLength] = useState(3)
  const [width, setWidth] = useState(2)
  const [materialId, setMaterialId] = useState<CalcMaterialId>(CALC_MATERIALS[0].id)
  const [opts, setOpts] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reduce = useReducedMotion()

  const price = useMemo(
    () => calcTentPrice(length, width, materialId, opts),
    [length, width, materialId, opts],
  )

  const toggleOpt = (id: string) => {
    setOpts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (comment.trim().length > COMMENT_MAX_LEN) {
      setError(`Комментарий не длиннее ${COMMENT_MAX_LEN} символов`)
      return
    }
    const mat = CALC_MATERIALS.find((m) => m.id === materialId) ?? CALC_MATERIALS[0]
    const optionLabels = CALC_OPTIONS.filter((o) => opts.has(o.id)).map((o) => o.label)
    setSending(true)
    try {
      const { ok } = await submitCalculatorLead({
        name: n,
        phone: phoneForApi(phone),
        comment: comment.trim() || undefined,
        lengthM: length,
        widthM: width,
        materialId,
        materialLabel: mat.label,
        options: optionLabels,
        estimatedPriceRub: price,
      })
      if (ok) {
        setDone(true)
        setComment('')
      } else setError('Не удалось отправить. Позвоните нам или напишите на почту.')
    } catch {
      setError('Ошибка сети. Попробуйте позже.')
    } finally {
      setSending(false)
    }
  }

  const heading = c.heading ?? 'Калькулятор стоимости'
  const subheading =
    c.subheading ??
    'Предварительный расчёт по площади и материалу. Точную цену подтвердим после замера. Заявку обработает менеджер.'
  const lengthLabel = c.lengthLabel ?? 'Длина, м'
  const widthLabel = c.widthLabel ?? 'Ширина, м'
  const materialLabel = c.materialLabel ?? 'Материал'
  const optionsLabel = c.optionsLabel ?? 'Опции'
  const estimateLabel = c.estimateLabel ?? 'Ориентировочная стоимость'
  const estimateNote =
    c.estimateNote ?? 'Не публичная оферта. Итоговая цена — в коммерческом предложении.'
  const nameLabel = c.nameLabel ?? 'Имя'
  const phoneLabel = c.phoneLabel ?? 'Телефон'
  const commentLabel = c.commentLabel ?? 'Комментарий'
  const namePlaceholder = c.namePlaceholder ?? 'Как к вам обращаться'
  const phonePlaceholder = c.phonePlaceholder ?? '+7'
  const commentPlaceholder = c.commentPlaceholder ?? 'Объект, сроки'
  const submitButton = c.submitButton ?? 'Отправить заявку'
  const submitting = c.submitting ?? 'Отправка…'
  const successMessage =
    c.successMessage ??
    'Спасибо! Заявка принята. Перезвоним в рабочее время и уточним детали расчёта.'

  return (
    <motion.section
      id="calculator"
      className="mx-auto max-w-[1280px] scroll-mt-24 px-4 py-12 md:px-6 md:py-24"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.1 }}
      transition={easeOutSoft}
    >
      <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">{heading}</h2>
      <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">{subheading}</p>

      <motion.div
        className="mt-10 rounded-[24px] border border-border-light bg-surface p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] md:p-10"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ ...easeOutSoft, delay: 0.05 }}
      >
        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block font-body text-sm font-medium text-text">{lengthLabel}</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block font-body text-sm font-medium text-text">{widthLabel}</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block font-body text-sm font-medium text-text">{materialLabel}</span>
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value as CalcMaterialId)}
                className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
              >
                {CALC_MATERIALS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className="mb-3 block font-body text-sm font-medium text-text">{optionsLabel}</span>
              <div className="flex flex-col gap-3">
                {CALC_OPTIONS.map((o) => (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-light px-4 py-3 transition hover:border-accent/40"
                  >
                    <input
                      type="checkbox"
                      checked={opts.has(o.id)}
                      onChange={() => toggleOpt(o.id)}
                      className="h-5 w-5 rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="font-body text-sm text-text">
                      {o.label}
                      <span className="text-text-muted"> (+{o.price.toLocaleString('ru-RU')} ₽)</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-2xl bg-bg-base p-6 md:p-8">
            <p className="font-body text-sm text-text-muted">{estimateLabel}</p>
            <div className="relative mt-2 min-h-[2.5rem] md:min-h-[3rem]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={price}
                  className="font-body text-3xl font-bold tracking-tight text-accent md:text-4xl"
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  {price.toLocaleString('ru-RU')} ₽
                </motion.p>
              </AnimatePresence>
            </div>
            <p className="mt-4 font-body text-sm text-text-subtle">{estimateNote}</p>

            {done ? (
              <p className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 font-body text-sm text-text">
                {successMessage}
              </p>
            ) : (
              <>
                <label className="mt-6 block">
                  <span className="mb-2 block font-body text-sm font-medium text-text">{nameLabel}</span>
                  <input
                    type="text"
                    name="calc-name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={namePlaceholder}
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 font-body text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="mb-2 block font-body text-sm font-medium text-text">{phoneLabel}</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    name="calc-phone"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(formatRuPhoneMask(nationalDigitsFromInput(e.target.value)))
                    }
                    placeholder={phonePlaceholder}
                    className="h-12 w-full rounded-2xl border border-border bg-surface px-4 font-body text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="mb-2 block font-body text-sm font-medium text-text">{commentLabel}</span>
                  <textarea
                    name="calc-comment"
                    rows={2}
                    maxLength={COMMENT_MAX_LEN}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={commentPlaceholder}
                    className="w-full rounded-2xl border border-border bg-surface px-4 py-3 font-body text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
                  />
                </label>
                {error && (
                  <p className="mt-3 font-body text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
                <motion.button
                  type="submit"
                  disabled={sending}
                  className="mt-6 inline-flex h-14 min-h-[44px] w-full items-center justify-center rounded-[40px] bg-accent font-body text-base font-medium text-surface shadow-[0_4px_8px_0_rgba(232,122,0,0.25)] transition hover:bg-[#c65f00] disabled:opacity-60 md:w-auto md:self-start md:px-10"
                  style={{ letterSpacing: '0.02em' }}
                  whileHover={reduce || sending ? undefined : { scale: 1.02 }}
                  whileTap={reduce || sending ? undefined : { scale: 0.98 }}
                >
                  {sending ? submitting : submitButton}
                </motion.button>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </motion.section>
  )
}
