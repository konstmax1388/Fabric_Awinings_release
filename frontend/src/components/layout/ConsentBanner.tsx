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
import { LEGAL_SLUGS, staticPagePathBySlug } from '../../lib/legalPages'

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
          className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-4 md:px-6 md:pb-6"
          role="dialog"
          aria-label="Согласие на обработку персональных данных"
          initial={reduceMotion ? undefined : { y: 36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? undefined : { y: 18, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.2, 1, 0.32, 1] }}
        >
          <div className="mx-auto w-full max-w-4xl rounded-2xl border border-border bg-bg-base/95 p-4 shadow-2xl backdrop-blur md:p-5">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
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
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onAccept}
                disabled={acceptDisabled}
                className="fabric-strap-btn h-11 rounded-[40px] bg-accent px-6 font-body text-sm font-semibold text-[#0d121c] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Принять
              </button>
              <button
                type="button"
                onClick={onDecline}
                className="fabric-strap-btn h-11 rounded-[40px] border border-border px-6 font-body text-sm font-semibold text-text"
              >
                Отказаться
              </button>
            </div>
            <p className="mt-3 font-body text-xs text-text-subtle">
              Дополнительно: <a href={termsPath} target="_blank" rel="noopener noreferrer" className="hover:underline">Пользовательское соглашение</a>{' '}
              и <a href={offerPath} target="_blank" rel="noopener noreferrer" className="hover:underline">Публичная оферта</a>.
            </p>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
