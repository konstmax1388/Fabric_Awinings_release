import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

type Props = {
  open: boolean
  checked: boolean
  privacyPath: string
  consentPath: string
  onToggle: (next: boolean) => void
  onClose: () => void
  onConfirm: () => void
}

export function ConsentRequiredModal(props: Props) {
  const reduceMotion = useReducedMotion()
  const { open, checked, privacyPath, consentPath, onToggle, onClose, onConfirm } = props
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
              <h2 className="font-heading text-xl text-text">Для оформления заказа необходимо согласие на обработку персональных данных.</h2>
              <label className="mt-4 flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
                  checked={checked}
                  onChange={(e) => onToggle(e.target.checked)}
                />
                <span className="font-body text-sm text-text">
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
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={!checked}
                  className="fabric-strap-btn h-11 rounded-[40px] bg-accent px-6 font-body text-sm font-semibold text-[#0d121c] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Подтвердить
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
