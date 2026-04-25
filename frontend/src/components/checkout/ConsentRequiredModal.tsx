import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { PERSONAL_DATA_LAW_152_FZ } from '../../lib/legalPages'

type Props = {
  open: boolean
  checked: boolean
  privacyPath: string
  consentPath: string
  offerPath: string
  onToggle: (next: boolean) => void
  onClose: () => void
  onConfirm: () => void
}

export function ConsentRequiredModal(props: Props) {
  const reduceMotion = useReducedMotion()
  const { open, checked, privacyPath, consentPath, offerPath, onToggle, onClose, onConfirm } = props
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-[90] bg-black/55"
            aria-label="Закрыть окно согласия"
            onClick={onClose}
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
          />
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center p-4"
            initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
          >
            <div className="fabric-card w-full max-w-lg p-5 sm:p-6">
              <h2 className="font-heading text-xl text-text">Для продолжения оформления нужно согласие на обработку персональных данных.</h2>
              <p className="mt-2 font-body text-sm text-text-muted">
                Это юридическое требование 152-ФЗ. Без согласия мы не можем принять заказ.
              </p>
              <p className="mt-2 font-body text-xs leading-relaxed text-text-muted">{PERSONAL_DATA_LAW_152_FZ}</p>
              <label className="mt-4 flex items-start gap-3">
                <span className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={(e) => onToggle(e.target.checked)}
                  />
                  <span className="block h-5 w-5 rounded-md border border-border bg-bg-base transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-checked:border-accent peer-checked:bg-accent/20" />
                  <span className="pointer-events-none absolute left-[5px] top-[2px] h-2.5 w-1.5 rotate-45 border-b-2 border-r-2 border-transparent transition peer-checked:border-accent" />
                </span>
                <span className="font-body text-sm text-text">
                  Оформляя заказ, вы принимаете{' '}
                  <a href={privacyPath} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    политику конфиденциальности
                  </a>
                  ,{' '}
                  <a href={consentPath} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    согласие на обработку персональных данных
                  </a>{' '}
                  и{' '}
                  <a href={offerPath} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    публичную оферту
                  </a>
                  . Подтверждаю ознакомление с документами.
                </span>
              </label>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={!checked}
                  className="fabric-strap-btn h-11 rounded-[40px] bg-accent px-6 font-body text-sm font-semibold text-[#0d121c] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Согласен(на) и продолжить
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="fabric-strap-btn h-11 rounded-[40px] border border-border px-6 font-body text-sm font-semibold text-text"
                >
                  Отмена
                </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
