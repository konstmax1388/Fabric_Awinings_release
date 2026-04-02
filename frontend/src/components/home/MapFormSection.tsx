import { motion, useReducedMotion } from 'framer-motion'
import { SITE } from '../../config/site'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, staggerContainer, staggerItem } from '../../lib/motion-presets'

/** Яндекс.Карты: координаты-заглушка (Москва). Заменить на реальные из админки. */
const MAP_IFRAME_SRC =
  'https://yandex.ru/map-widget/v1/?ll=37.620393%2C55.753960&z=16&pt=37.620393%2C55.753960%2Cpm2rdm'

export function MapFormSection({ showHeading = true }: { showHeading?: boolean }) {
  const reduce = useReducedMotion()

  return (
    <motion.section
      className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 md:py-24"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.06 }}
      transition={easeOutSoft}
    >
      {showHeading && (
        <>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
            Контакты и заявка
          </h2>
          <p className="mt-3 font-body text-text-muted md:text-lg">
            Приезжайте на производство или оставьте заявку — перезвоним в рабочее время.
          </p>
        </>
      )}

      <motion.div
        className={`grid gap-8 lg:grid-cols-2 lg:gap-12 ${showHeading ? 'mt-10' : ''}`}
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
          className="overflow-hidden rounded-[24px] border border-border-light bg-surface shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)]"
        >
          <iframe
            title="Карта — расположение производства"
            src={MAP_IFRAME_SRC}
            width="100%"
            height="400"
            className="min-h-[320px] w-full border-0 md:min-h-[400px]"
            allowFullScreen
          />
          <div className="border-t border-border-light p-4 font-body text-sm text-text-muted">
            {SITE.address}
          </div>
        </motion.div>

        <motion.form
          variants={staggerItem}
          className="rounded-[24px] border border-border-light bg-surface p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] md:p-8"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-text">Имя</span>
            <input
              type="text"
              name="name"
              required
              placeholder="Как к вам обращаться"
              className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium text-text">Телефон</span>
            <input
              type="tel"
              name="phone"
              required
              placeholder="+7"
              className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium text-text">Комментарий</span>
            <textarea
              name="comment"
              rows={4}
              placeholder="Задача, размеры, сроки"
              className="w-full rounded-2xl border border-border bg-surface px-5 py-4 font-body text-text placeholder:text-text-subtle focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
            />
          </label>
          <motion.button
            type="submit"
            className="mt-6 w-full rounded-[40px] bg-accent py-4 font-body font-medium text-surface shadow-[0_4px_8px_0_rgba(232,122,0,0.25)] transition hover:bg-[#c65f00] md:w-auto md:px-12"
            style={{ letterSpacing: '0.02em' }}
            whileHover={reduce ? undefined : { scale: 1.02 }}
            whileTap={reduce ? undefined : { scale: 0.98 }}
          >
            Отправить
          </motion.button>
        </motion.form>
      </motion.div>
    </motion.section>
  )
}
