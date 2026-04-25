import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  calcTentPriceFromConfig,
  calculatorRuntimeFromHome,
  clamp,
} from '../../lib/calculator'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { FormPersonalDataConsent } from '../legal/FormPersonalDataConsent'
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
  const cfg = useMemo(() => calculatorRuntimeFromHome(home?.calculator), [home?.calculator])
  const materials = cfg.materials
  const options = cfg.options

  const [length, setLength] = useState(3)
  const [width, setWidth] = useState(2)
  const [materialId, setMaterialId] = useState(() => materials[0]?.id ?? '')
  const [opts, setOpts] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    setLength((v) => clamp(Number(v), cfg.lengthMinM, cfg.lengthMaxM))
    setWidth((v) => clamp(Number(v), cfg.widthMinM, cfg.widthMaxM))
  }, [cfg.lengthMinM, cfg.lengthMaxM, cfg.widthMinM, cfg.widthMaxM])

  useEffect(() => {
    const first = materials[0]?.id ?? ''
    if (!materialId || !materials.some((m) => m.id === materialId)) {
      setMaterialId(first)
    }
  }, [materials, materialId])

  const price = useMemo(
    () => calcTentPriceFromConfig(cfg, length, width, materialId, opts),
    [cfg, length, width, materialId, opts],
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
      setError(c.errorPhoneIncomplete ?? 'Введите полный номер телефона')
      return
    }
    if (comment.trim().length > COMMENT_MAX_LEN) {
      setError(
        (c.errorCommentTooLong ?? 'Комментарий не длиннее {max} символов').replace(
          '{max}',
          String(COMMENT_MAX_LEN),
        ),
      )
      return
    }
    const mat = materials.find((m) => m.id === materialId) ?? materials[0]
    const optionLabels = options.filter((o) => opts.has(o.id)).map((o) => o.label)
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
      } else setError(c.errorSubmitFailed ?? 'Не удалось отправить. Позвоните нам или напишите на почту.')
    } catch {
      setError(c.errorNetwork ?? 'Ошибка сети. Попробуйте позже.')
    } finally {
      setSending(false)
    }
  }

  const heading = c.heading ?? 'Конструктор тента'
  const subheading =
    c.subheading ??
    'Подберите параметры тента и получите предварительную стоимость. Точную цену подтвердим после уточнения деталей.'
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
  const submitButton = c.submitButton ?? 'Отправить параметры'
  const submitting = c.submitting ?? 'Отправка…'
  const successMessage =
    c.successMessage ??
    'Спасибо! Параметры отправлены. Перезвоним в рабочее время и уточним детали.'
  const mode = c.mode === 'request_form' ? 'request_form' : 'calculator'

  const lenSpan = cfg.lengthMaxM - cfg.lengthMinM
  const widSpan = cfg.widthMaxM - cfg.widthMinM
  const lenPct = lenSpan > 0 ? ((length - cfg.lengthMinM) / lenSpan) * 100 : 50
  const widPct = widSpan > 0 ? ((width - cfg.widthMinM) / widSpan) * 100 : 50
  const requestTitle = c.requestFormTitle ?? 'Индивидуальный проект под вашу задачу'
  const requestSubtitle =
    c.requestFormSubtitle ??
    'Опишите объект и пожелания. Менеджер свяжется, сделает расчёт, согласует материалы и при необходимости организует замер.'
  const requestBenefits = [
    c.requestFormBenefit1 ?? 'Персональный расчёт под ваш проект',
    c.requestFormBenefit2 ?? 'Подбор материалов и конструктивных решений',
    c.requestFormBenefit3 ?? 'Выезд на замер и сопровождение до монтажа',
  ].map((item) => item.trim()).filter(Boolean)
  const step1Title = c.step1Title ?? '1. Форма и материал'
  const step2Title = c.step2Title ?? '2. Размер и масштаб'
  const virtualRulerTitle = c.virtualRulerTitle ?? 'Виртуальная рулетка'
  const requestBadge = c.requestBadge ?? 'Индивидуальный проект'
  return (
    <motion.section
      id="calculator"
      className="fabric-container min-w-0 scroll-mt-24 py-12 md:py-24"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.1 }}
      transition={easeOutSoft}
    >
      <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">{heading}</h2>
      <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">{subheading}</p>

      <motion.div
        className="mt-10 rounded-[24px] border border-border-light bg-surface p-4 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] md:p-8 lg:p-10"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ ...easeOutSoft, delay: 0.05 }}
      >
        <form
          onSubmit={handleSubmit}
          className={
            mode === 'calculator'
              ? 'grid max-h-[78vh] snap-y snap-mandatory gap-4 overflow-y-auto pr-1 md:max-h-none md:overflow-visible md:pr-0 lg:grid-cols-3 lg:gap-6'
              : 'grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'
          }
        >
          {mode === 'calculator' ? (
            <>
          <section className="snap-start rounded-2xl border border-border-light bg-bg-base p-4 md:p-5">
            <p className="mb-3 font-heading text-lg font-semibold text-text">{step1Title}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="block">
                <span className="mb-2 block font-body text-sm font-medium text-text">{lengthLabel}</span>
                <input
                  type="number"
                  min={cfg.lengthMinM}
                  max={cfg.lengthMaxM}
                  step={0.1}
                  value={length}
                  onChange={(e) =>
                    setLength(clamp(Number(e.target.value), cfg.lengthMinM, cfg.lengthMaxM))
                  }
                  className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block font-body text-sm font-medium text-text">{widthLabel}</span>
                <input
                  type="number"
                  min={cfg.widthMinM}
                  max={cfg.widthMaxM}
                  step={0.1}
                  value={width}
                  onChange={(e) =>
                    setWidth(clamp(Number(e.target.value), cfg.widthMinM, cfg.widthMaxM))
                  }
                  className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
                />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block font-body text-sm font-medium text-text">{materialLabel}</span>
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-4">
              <span className="mb-3 block font-body text-sm font-medium text-text">{optionsLabel}</span>
              <div className="flex flex-col gap-3">
                {options.map((o) => (
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
          </section>

          <section className="snap-start rounded-2xl border border-border-light bg-bg-base p-4 md:p-5">
            <p className="mb-3 font-heading text-lg font-semibold text-text">{step2Title}</p>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block font-body text-sm text-text-muted">{lengthLabel}</span>
                <input
                  type="range"
                  min={cfg.lengthMinM}
                  max={cfg.lengthMaxM}
                  step={0.1}
                  value={clamp(length, cfg.lengthMinM, cfg.lengthMaxM)}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="mt-1 flex justify-between font-body text-xs text-text-subtle">
                  <span>{cfg.lengthMinM} м</span>
                  <span>{length.toFixed(1)} м</span>
                  <span>{cfg.lengthMaxM} м</span>
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block font-body text-sm text-text-muted">{widthLabel}</span>
                <input
                  type="range"
                  min={cfg.widthMinM}
                  max={cfg.widthMaxM}
                  step={0.1}
                  value={clamp(width, cfg.widthMinM, cfg.widthMaxM)}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="mt-1 flex justify-between font-body text-xs text-text-subtle">
                  <span>{cfg.widthMinM} м</span>
                  <span>{width.toFixed(1)} м</span>
                  <span>{cfg.widthMaxM} м</span>
                </div>
              </label>
            </div>
            <div className="mt-5 rounded-xl border border-border-light bg-surface p-4">
              <p className="font-body text-xs uppercase tracking-wide text-text-subtle">{virtualRulerTitle}</p>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
                <div>
                  <div className="h-2 rounded-full bg-border-light">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{
                        width: `${Math.max(5, Math.min(100, lenPct))}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="font-body text-sm font-medium text-text">{length.toFixed(1)} м</span>
                <div>
                  <div className="h-2 rounded-full bg-border-light">
                    <div
                      className="h-full rounded-full bg-secondary transition-all"
                      style={{
                        width: `${Math.max(5, Math.min(100, widPct))}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="font-body text-sm font-medium text-text">{width.toFixed(1)} м</span>
              </div>
            </div>
          </section>
            </>
          ) : (
            <section className="rounded-2xl border border-border-light bg-bg-base p-5 md:p-7">
              <p className="font-heading text-xs uppercase tracking-[0.18em] text-accent">{requestBadge}</p>
              <h3 className="mt-3 font-heading text-2xl text-text md:text-3xl">{requestTitle}</h3>
              <p className="mt-3 max-w-2xl font-body text-sm text-text-muted md:text-base">{requestSubtitle}</p>
              <div className="mt-5 grid gap-3">
                {requestBenefits.map((item, idx) => (
                  <div
                    key={`request-benefit-${idx}`}
                    className="rounded-2xl border border-border-light bg-surface/70 px-4 py-3 font-body text-sm text-text"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={`rounded-2xl border border-border-light bg-bg-base p-4 md:p-5 ${mode === 'calculator' ? 'snap-start' : ''}`}>
            {mode === 'calculator' ? (
              <>
                <p className="font-body text-sm text-text-muted">{estimateLabel}</p>
                <div className="relative mt-2 min-h-[2.25rem] min-w-0 md:min-h-[2.75rem]">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.p
                      key={price}
                      className="max-w-full break-words font-heading text-2xl font-extrabold leading-[1.15] tracking-tight text-accent tabular-nums sm:text-3xl md:text-[1.85rem] lg:text-4xl"
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {price.toLocaleString('ru-RU')} ₽
                    </motion.p>
                  </AnimatePresence>
                </div>
                <p className="mt-3 font-body text-sm text-text-subtle">{estimateNote}</p>
              </>
            ) : null}

            {done ? (
              <p className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 font-body text-sm text-text">
                {successMessage}
              </p>
            ) : (
              <>
                <label className="mt-5 block">
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
                    rows={mode === 'calculator' ? 2 : 4}
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
                <FormPersonalDataConsent variant="form" className="mt-3 font-body text-xs leading-relaxed text-text-subtle" />
                <motion.button
                  type="submit"
                  disabled={sending}
                  className="fabric-strap-btn mt-6 inline-flex h-14 min-h-[44px] w-full items-center justify-center rounded-[40px] bg-accent font-body text-base font-medium text-surface shadow-[0_4px_8px_0_rgba(232,122,0,0.25)] transition hover:bg-[#c65f00] disabled:opacity-60 md:w-auto md:self-start md:px-10"
                  style={{ letterSpacing: '0.02em' }}
                  whileHover={reduce || sending ? undefined : { scale: 1.02 }}
                  whileTap={reduce || sending ? undefined : { scale: 0.98 }}
                >
                  {sending ? submitting : submitButton}
                </motion.button>
              </>
            )}
          </section>
        </form>
      </motion.div>
    </motion.section>
  )
}
