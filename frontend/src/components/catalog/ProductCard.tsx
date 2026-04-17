import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { MarketplaceId } from '../../config/site'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import type { Product } from '../../data/products'
import { productCardImageFrameClass } from '../../lib/productPhotoAspect'
import { useCart } from '../../hooks/useCart'
import { OptimizedImage } from '../ui/OptimizedImage'
import { MarketplaceLinks } from '../icons/MarketplaceLinks'
import { ProductTeaserBadges } from './ProductTeaserBadges'
import { cardHoverTransition, subtleHoverLift, subtleButtonHover } from '../../lib/motion-presets'

type Props = { product: Product }

export function ProductCard({ product }: Props) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const { addProduct } = useCart()
  const { enabledMarketplaces, productPhotoAspect } = useSiteSettings()
  const frameClass = productCardImageFrameClass(productPhotoAspect)
  const enabledSet = new Set(enabledMarketplaces)
  const mpKeys = (Object.keys(product.marketplaceLinks) as MarketplaceId[]).filter(
    (k) => product.marketplaceLinks[k] && enabledSet.has(k),
  )
  const cover = product.images[0]
  const [imgFailed, setImgFailed] = useState(false)
  const autoBadges = [
    'Срок изготовления от 5 дней',
    new Date().getMonth() <= 1 || new Date().getMonth() >= 10 ? 'Сезонное предложение' : '',
  ].filter(Boolean)

  return (
    <motion.article
      whileHover={reduce ? undefined : subtleHoverLift}
      transition={cardHoverTransition}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border-light bg-surface shadow-[0_10px_28px_-10px_rgba(0,0,0,0.1)]"
    >
      <Link to={`/catalog/${product.slug}`} className="relative block overflow-hidden">
        <div
          className={`${frameClass} overflow-hidden bg-gradient-to-br from-bg-base to-border-light/40`}
        >
          {cover && !imgFailed ? (
            <OptimizedImage
              src={cover}
              alt=""
              widths={[480, 640, 960]}
              onError={() => setImgFailed(true)}
              className="h-full w-full object-contain p-2 transition-opacity duration-300 hover:opacity-95"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-4 text-center">
              <span className="font-body text-xs font-medium text-text-subtle">Нет фото</span>
              <span className="line-clamp-2 font-body text-[11px] text-text-muted">{product.title}</span>
            </div>
          )}
        </div>
        <ProductTeaserBadges teasers={product.teasers} className="absolute left-2 top-2 max-w-[calc(100%-1rem)]" />
      </Link>
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-accent">
          Цена {product.priceFrom.toLocaleString('ru-RU')} ₽
        </p>
        <Link to={`/catalog/${product.slug}`} className="group mt-1 block">
          <h2 className="line-clamp-2 font-heading text-lg font-semibold leading-snug text-text group-hover:text-accent md:text-xl">
            {product.title}
          </h2>
        </Link>
        <p className="mt-2 line-clamp-3 flex-1 font-body text-sm leading-relaxed text-text-muted">
          {product.excerpt}
        </p>
        <motion.button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            addProduct(product, 1)
            navigate('/cart')
          }}
          whileHover={reduce ? undefined : subtleButtonHover}
          whileTap={reduce ? undefined : { scale: 0.98 }}
          transition={cardHoverTransition}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-accent font-body text-sm font-medium text-surface shadow-[0_4px_12px_0_rgba(232,122,0,0.28)] transition hover:bg-[#c65f00] hover:shadow-[0_6px_16px_0_rgba(232,122,0,0.32)]"
        >
          В корзину
        </motion.button>
        {mpKeys.length > 0 && (
          <div className="mt-4 border-t border-border-light pt-3">
            <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
              На маркетплейсах
            </p>
            <MarketplaceLinks hrefById={product.marketplaceLinks} linkKeys={mpKeys} />
          </div>
        )}
        {autoBadges.length > 0 && (
          <motion.div
            className="mt-3 flex flex-wrap gap-1.5"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {autoBadges.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-accent/25 bg-accent/8 px-2.5 py-1 font-body text-[11px] font-medium text-accent"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        )}
      </div>
    </motion.article>
  )
}
