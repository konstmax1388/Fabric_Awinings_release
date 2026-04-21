import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { easeOutSoft, fadeUpHidden, fadeUpVisible } from '../../lib/motion-presets'
import { useSiteSettings } from '../../context/SiteSettingsContext'

function isExternalHref(href: string) {
  return (
    /^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')
  )
}

export function PurchasePathsSection() {
  const reduce = useReducedMotion()
  const { home } = useSiteSettings()
  const paths = home?.purchasePaths

  const eyebrow = paths?.eyebrow?.trim() || 'Как оформить заказ'
  const heading = paths?.heading?.trim() || 'Два понятных сценария: купить готовое или заказать индивидуальный проект'
  const subheading =
    paths?.subheading?.trim() ||
    'Мы разделили пути, чтобы вы сразу выбрали нужный формат: быстрое оформление готовых позиций из каталога или персональный проект с расчётом, замером и изготовлением под вашу задачу.'

  const readyTitle = paths?.readyTitle?.trim() || 'Готовая продукция'
  const readySubtitle = paths?.readySubtitle?.trim() || 'Выбрать из каталога и купить'
  const readyBullets = Array.isArray(paths?.readyBullets)
    ? paths.readyBullets.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
    : []
  const readyPoints = readyBullets.length
    ? readyBullets
    : [
        'Понятные карточки товаров с ценой и параметрами',
        'Добавление в корзину и стандартное оформление заказа',
        'Подходит, когда нужно быстро и без индивидуальной разработки',
      ]
  const readyCta = paths?.readyCta?.trim() || 'Перейти в каталог'
  const readyHref = paths?.readyHref?.trim() || '/catalog'

  const customTitle = paths?.customTitle?.trim() || 'Индивидуальный проект'
  const customSubtitle = paths?.customSubtitle?.trim() || 'Оставить заявку на расчёт и замер'
  const customBullets = Array.isArray(paths?.customBullets)
    ? paths.customBullets.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3)
    : []
  const customPoints = customBullets.length
    ? customBullets
    : [
        'Менеджер связывается, уточняет задачу и требования',
        'Делаем расчёт, согласуем материалы, сроки и бюджет',
        'При необходимости выезжаем на замер и изготавливаем под ваш объект',
      ]
  const customCta = paths?.customCta?.trim() || 'Оставить заявку на проект'
  const customHref = paths?.customHref?.trim() || '/#calculator'

  return (
    <motion.section
      className="fabric-container min-w-0 py-8 md:py-12"
      initial={reduce ? false : fadeUpHidden}
      whileInView={reduce ? undefined : fadeUpVisible}
      viewport={{ once: true, amount: 0.2 }}
      transition={easeOutSoft}
    >
      <div className="fabric-card p-4 md:p-6">
        <p className="break-words font-heading text-xs uppercase tracking-[0.18em] text-accent md:text-sm">{eyebrow}</p>
        <h2 className="mt-3 break-words font-heading text-2xl font-semibold text-text md:text-4xl">
          {heading}
        </h2>
        <p className="mt-3 max-w-3xl break-words font-body text-sm text-text-muted md:text-base">{subheading}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <motion.article
            className="rounded-2xl border border-border bg-bg-base/30 p-5"
            whileHover={reduce ? undefined : { y: -4 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <p className="break-words font-heading text-[11px] uppercase tracking-[0.16em] text-accent/90">{readyTitle}</p>
            <h3 className="mt-2 break-words font-heading text-xl text-text">{readySubtitle}</h3>
            <ul className="mt-3 space-y-2 font-body text-sm text-text-muted">
              {readyPoints.map((item, idx) => (
                <li key={`ready-path-bullet-${idx}`} className="break-words">{item}</li>
              ))}
            </ul>
            {isExternalHref(readyHref) ? (
              <a
                href={readyHref}
                className="fabric-strap-btn mt-5 inline-flex h-auto min-h-11 items-center justify-center rounded-full bg-accent px-5 py-2.5 font-body text-sm font-semibold text-bg-base hover:bg-[#d7ab67]"
                target="_blank"
                rel="noopener noreferrer"
              >
                {readyCta}
              </a>
            ) : (
              <Link
                to={readyHref}
                className="fabric-strap-btn mt-5 inline-flex h-auto min-h-11 items-center justify-center rounded-full bg-accent px-5 py-2.5 font-body text-sm font-semibold text-bg-base hover:bg-[#d7ab67]"
              >
                {readyCta}
              </Link>
            )}
          </motion.article>

          <motion.article
            className="rounded-2xl border border-accent/40 bg-accent/8 p-5"
            whileHover={reduce ? undefined : { y: -4 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            <p className="break-words font-heading text-[11px] uppercase tracking-[0.16em] text-accent">{customTitle}</p>
            <h3 className="mt-2 break-words font-heading text-xl text-text">{customSubtitle}</h3>
            <ul className="mt-3 space-y-2 font-body text-sm text-text-muted">
              {customPoints.map((item, idx) => (
                <li key={`custom-path-bullet-${idx}`} className="break-words">{item}</li>
              ))}
            </ul>
            {isExternalHref(customHref) ? (
              <a
                href={customHref}
                className="fabric-strap-btn mt-5 inline-flex h-auto min-h-11 items-center justify-center rounded-full border border-accent/60 bg-transparent px-5 py-2.5 font-body text-sm font-semibold text-accent hover:bg-accent hover:text-bg-base"
                target="_blank"
                rel="noopener noreferrer"
              >
                {customCta}
              </a>
            ) : (
              <a
                href={customHref}
                className="fabric-strap-btn mt-5 inline-flex h-auto min-h-11 items-center justify-center rounded-full border border-accent/60 bg-transparent px-5 py-2.5 font-body text-sm font-semibold text-accent hover:bg-accent hover:text-bg-base"
              >
                {customCta}
              </a>
            )}
          </motion.article>
        </div>
      </div>
    </motion.section>
  )
}
