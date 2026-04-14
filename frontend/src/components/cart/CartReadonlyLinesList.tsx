import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import type { CartLine } from '../../cart/cartTypes'
import { cartLineImageFrameClass } from '../../lib/productPhotoAspect'
import { OptimizedImage } from '../ui/OptimizedImage'

/** Компактный список позиций с фото (оформление заказа и т.п.). */
export function CartReadonlyLinesList({ items }: { items: CartLine[] }) {
  const { productPhotoAspect } = useSiteSettings()
  if (!items.length) return null
  return (
    <ul className="mt-4 divide-y divide-border-light rounded-xl border border-border-light bg-surface">
      {items.map((line) => (
        <li key={line.lineId} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
          <Link
            to={`/catalog/${line.slug}`}
            className={`${cartLineImageFrameClass(productPhotoAspect)} max-h-20 max-w-[4.5rem] sm:max-h-24 sm:max-w-[5.25rem]`}
          >
            {line.image ? (
              <OptimizedImage
                src={line.image}
                alt=""
                widths={[128, 256, 384]}
                sizes="72px"
                className="h-full w-full object-contain p-0.5"
              />
            ) : (
              <span className="flex h-full items-center justify-center px-1 text-center font-body text-[10px] leading-tight text-text-subtle">
                Нет фото
              </span>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              to={`/catalog/${line.slug}`}
              className="line-clamp-2 font-body text-sm font-medium text-text hover:text-accent"
            >
              {line.title}
            </Link>
            <p className="mt-1 font-body text-xs text-text-muted">
              {line.priceFrom.toLocaleString('ru-RU')} ₽ × {line.qty}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
