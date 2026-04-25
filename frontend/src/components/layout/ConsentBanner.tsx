import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import {
  getCurrentPolicyVersion,
  hasValidConsent,
  persistConsent,
  readStoredConsent,
  trackConsentAnalytics,
  trackConsentServer,
} from '../../lib/consent'
import { LEGAL_SLUGS, PERSONAL_DATA_LAW_152_FZ, staticPagePathBySlug } from '../../lib/legalPages'

export function ConsentBanner() {
  const reduceMotion = useReducedMotion()
  const { staticPages } = useSiteSettings()
  const [visible, setVisible] = useState(false)
  const [checked, setChecked] = useState(false)
  const [policyVersion, setPolicyVersion] = useState('2026-04-22')

  const privacyPath = staticPagePathBySlug(staticPages, LEGAL_SLUGS.privacy, '/')
  const consentPath = staticPagePathBySlug(staticPages, LEGAL_SLUGS.consent, '/')
  const termsPath = staticPagePathBySlug(staticPages, LEGAL_SLUGS.terms, '/')
  const offerPath = staticPagePathBySlug(staticPages, LEGAL_SLUGS.offer, '/')

  useEffect(() => {
    let cancelled = false
    getCurrentPolicyVersion().then((version) => {
      if (cancelled) return
      setPolicyVersion(version)
      setVisible(!hasValidConsent(version))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const acceptDisabled = useMemo(() => !checked, [checked])

  const onAccept = async () => {
    if (acceptDisabled) return
    const stored = await persistConsent(true, policyVersion)
    void trackConsentServer(true, stored.policyVersion)
    trackConsentAnalytics('consent_accept')
    setVisible(false)
  }

  const onDecline = async () => {
    const existing = readStoredConsent()
    const currentVersion = existing?.policyVersion || policyVersion
    await persistConsent(false, currentVersion)
    void trackConsentServer(false, currentVersion)
    trackConsentAnalytics('consent_decline')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.aside
          className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-3 md:px-6 md:pb-4"
          role="dialog"
          aria-label="Согласие на обработку персональных данных"
          initial={reduceMotion ? undefined : { y: 36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? undefined : { y: 18, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.2, 1, 0.32, 1] }}
        >
          <div className="mx-auto w-full max-w-5xl rounded-2xl border border-border bg-bg-base/95 p-3.5 shadow-2xl backdrop-blur md:p-4">
            <p className="font-body text-sm font-semibold text-text">
              Чтобы мы могли законно обработать заявку по 152-ФЗ, нужно ваше согласие.
            </p>
            <p className="mt-1 font-body text-xs leading-relaxed text-text-muted">{PERSONAL_DATA_LAW_152_FZ}</p>
            <p className="mt-1 font-body text-xs text-text-muted">
              Отметьте чекбокс и нажмите «Согласен(на)». Используя формы на сайте, вы принимаете политику конфиденциальности и публичную оферту.
            </p>
            <label className="flex items-start gap-3">
              <span className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                />
                <span className="block h-5 w-5 rounded-md border border-border bg-bg-base transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-checked:border-accent peer-checked:bg-accent/20" />
                <span className="pointer-events-none absolute left-[5px] top-[2px] h-2.5 w-1.5 rotate-45 border-b-2 border-r-2 border-transparent transition peer-checked:border-accent" />
              </span>
              <span className="font-body text-sm leading-relaxed text-text">
                Я ознакомлен(а) и согласен(на) с{' '}
                <a href={privacyPath} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  Политикой конфиденциальности
                </a>{' '}
                и{' '}
                <a href={consentPath} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  Согласием на обработку персональных данных
                </a>
              </span>
            </label>
            <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onAccept}
                disabled={acceptDisabled}
                className="fabric-strap-btn h-11 rounded-[40px] bg-accent px-6 font-body text-sm font-semibold text-[#0d121c] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Согласен(на)
              </button>
              <button
                type="button"
                onClick={onDecline}
                className="fabric-strap-btn h-11 rounded-[40px] border border-border px-6 font-body text-sm font-semibold text-text"
              >
                Не сейчас
              </button>
            </div>
            <p className="mt-2.5 font-body text-xs text-text-subtle">
              Дополнительно: <a href={termsPath} target="_blank" rel="noopener noreferrer" className="hover:underline">Пользовательское соглашение</a>{' '}
              и <a href={offerPath} target="_blank" rel="noopener noreferrer" className="hover:underline">Публичная оферта</a>.
            </p>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
