import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { LEGAL_SLUGS, PERSONAL_DATA_LAW_152_FZ, staticPagePathBySlug } from '../../lib/legalPages'

const linkClass = 'text-accent hover:underline'

type StandardVariant = 'form' | 'request' | 'order'

const ACCEPT_LEAD: Record<StandardVariant, string> = {
  form: 'Отправляя форму, вы принимаете',
  request: 'Отправляя заявку, вы принимаете',
  order: 'Оформляя заказ, вы принимаете',
}

type StandardProps = {
  variant: StandardVariant
  className?: string
  /** Сработает при клике по ссылке (например, закрыть модальное окно). */
  onLinkClick?: () => void
  /** Доп. предложение после точки (пробел в начале не нужен). */
  tail?: string
}

/**
 * 152-ФЗ + фраза о приёме политики и оферты (типовые лид-формы, корзина «в 1 клик» и т.д.).
 */
export function FormPersonalDataConsent({ variant, className, onLinkClick, tail }: StandardProps) {
  const { staticPages } = useSiteSettings()
  const privacyPath = staticPagePathBySlug(staticPages, LEGAL_SLUGS.privacy, '/')
  const offerPath = staticPagePathBySlug(staticPages, LEGAL_SLUGS.offer, '/')
  const lead = ACCEPT_LEAD[variant]

  return (
    <p className={className ?? 'font-body text-xs leading-relaxed text-text-subtle'}>
      <span className="block">{PERSONAL_DATA_LAW_152_FZ}</span>
      <span className="mt-1.5 block">
        {lead}{' '}
        <Link to={privacyPath} className={linkClass} onClick={onLinkClick}>
          политику конфиденциальности
        </Link>{' '}
        и{' '}
        <Link to={offerPath} className={linkClass} onClick={onLinkClick}>
          публичную оферту
        </Link>
        .{tail ? ` ${tail}` : null}
      </span>
    </p>
  )
}

type CheckoutProps = { className?: string }

/**
 * 152-ФЗ + оформление заказа: политика, оферта, пользовательское соглашение, оплата и доставка.
 */
export function CheckoutOrderLegalNotice({ className }: CheckoutProps) {
  const { staticPages } = useSiteSettings()
  const privacyPath = staticPagePathBySlug(staticPages, LEGAL_SLUGS.privacy, '/')
  const offerPath = staticPagePathBySlug(staticPages, LEGAL_SLUGS.offer, '/')
  const termsPath = staticPagePathBySlug(staticPages, LEGAL_SLUGS.terms, '/')
  const paymentDeliveryPath = staticPagePathBySlug(staticPages, LEGAL_SLUGS.paymentDelivery, '/')

  return (
    <p className={className ?? 'mt-3 font-body text-xs leading-relaxed text-text-subtle'}>
      <span className="block">{PERSONAL_DATA_LAW_152_FZ}</span>
      <span className="mt-1.5 block">
        Подтверждая заказ, вы принимаете{' '}
        <Link to={privacyPath} className={linkClass}>
          политику конфиденциальности
        </Link>
        ,{' '}
        <Link to={offerPath} className={linkClass}>
          публичную оферту
        </Link>
        ,{' '}
        <Link to={termsPath} className={linkClass}>
          пользовательское соглашение
        </Link>{' '}
        и условия страницы{' '}
        <Link to={paymentDeliveryPath} className={linkClass}>
          «Оплата и доставка»
        </Link>
        .
      </span>
    </p>
  )
}
