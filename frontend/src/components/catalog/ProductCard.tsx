import { motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { MARKETPLACES, type MarketplaceId } from '../../config/site'
import type { Product } from '../../data/products'
import { orderLineFromProduct } from '../../lib/orderLinePayload'
import { productCardImageFrameClass } from '../../lib/productPhotoAspect'
import { useCart } from '../../hooks/useCart'
import { OneClickOrderModal } from '../order/OneClickOrderModal'
import { OptimizedImage } from '../ui/OptimizedImage'
import { MarketplaceLinks } from '../icons/MarketplaceLinks'
import { ProductTeaserBadges } from './ProductTeaserBadges'
import { ProductTrustStrip } from './ProductTrustStrip'
import { cardHoverTransition, subtleHoverLift, subtleButtonHover } from '../../lib/motion-presets'

type Props = { product: Product }

export function ProductCard({ product }: Props) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const { addProduct } = useCart()
  const { productPhotoAspect, home } = useSiteSettings()
  const ui = home?.ui
  const frameClass = productCardImageFrameClass(productPhotoAspect)
  const mpKeysRaw = (Object.keys(product.marketplaceLinks) as MarketplaceId[]).filter(
    (k) => Boolean(product.marketplaceLinks[k]),
  )
  const mpKeys = MARKETPLACES.map((m) => m.id).filter((id) => mpKeysRaw.includes(id))
  const cover = product.images[0]
  const [imgFailed, setImgFailed] = useState(false)
  const [addedPromptOpen, setAddedPromptOpen] = useState(false)
  const [oneClickOpen, setOneClickOpen] = useState(false)
  const oneClickLine = useMemo(() => orderLineFromProduct(product, null, 1), [product])
  const oneClickLabel = ui?.productOneClick ?? 'Купить в 1 клик'
  const autoBadges = [
    ui?.productBadgeInStock || 'Всё в наличии',
    new Date().getMonth() <= 1 || new Date().getMonth() >= 10
      ? ui?.productBadgeSeasonal || 'Сезонное предложение'
      : '',
  ].filter(Boolean)

  return (
    <motion.article
      whileHover={reduce ? undefined : subtleHoverLift}
      transition={cardHoverTransition}
      className="fabric-card flex h-full flex-col overflow-hidden"
    >
      <Link to={`/catalog/${product.slug}`} className="relative block overflow-hidden">
        <div
          className={`${frameClass} overflow-hidden bg-gradient-to-br from-bg-base to-primary/60`}
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
              <span className="font-body text-xs font-medium text-text-subtle">{ui?.productNoPhoto || 'Нет фото'}</span>
              <span className="line-clamp-2 font-body text-[11px] text-text-muted">{product.title}</span>
            </div>
          )}
        </div>
        <ProductTeaserBadges teasers={product.teasers} className="absolute left-2 top-2 max-w-[calc(100%-1rem)]" />
      </Link>
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-accent">
          {ui?.productPricePrefix || 'Цена'} {product.priceFrom.toLocaleString('ru-RU')} ₽
        </p>
        <Link to={`/catalog/${product.slug}`} className="group mt-1 block">
          <h2 className="line-clamp-2 font-heading text-lg font-semibold leading-snug text-text group-hover:text-accent md:text-xl">
            {product.title}
          </h2>
        </Link>
        <p className="mt-2 line-clamp-3 flex-1 font-body text-sm leading-relaxed text-text-muted">
          {product.excerpt}
        </p>
        <ProductTrustStrip
          className="mt-4"
          warrantyMonths={product.warrantyMonths}
          returnDays={product.returnDays}
        />
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <motion.button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              addProduct(product, 1)
              setAddedPromptOpen(true)
            }}
            whileHover={reduce ? undefined : subtleButtonHover}
            whileTap={reduce ? undefined : { scale: 0.98 }}
            transition={cardHoverTransition}
            className="fabric-strap-btn flex h-11 w-full min-w-0 items-center justify-center rounded-xl bg-accent font-body text-sm font-medium text-[#0d121c] shadow-[0_4px_12px_0_rgba(200,155,83,0.28)] transition hover:bg-[#d4ad72] hover:shadow-[0_6px_16px_0_rgba(200,155,83,0.32)]"
          >
            {ui?.productAddToCart || 'В корзину'}
          </motion.button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setOneClickOpen(true)
            }}
            className="flex h-11 w-full min-w-0 items-center justify-center rounded-xl border-2 border-accent font-body text-sm font-medium text-accent transition hover:bg-[rgba(200,155,83,0.12)]"
          >
            {oneClickLabel}
          </button>
        </div>
        <OneClickOrderModal
          open={oneClickOpen}
          onClose={() => setOneClickOpen(false)}
          lines={[oneClickLine]}
          title={oneClickLabel}
        />
        {addedPromptOpen && (
          createPortal(
            <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+6rem)] z-[520] mx-auto w-[min(520px,calc(100%-2rem))] rounded-2xl border border-border bg-surface p-4 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.48)] md:inset-x-auto md:bottom-4 md:right-6 md:mx-0 md:w-[460px]">
              <p className="font-body text-sm font-medium text-text">{ui?.productAddedTitle || 'Товар добавлен в корзину'}</p>
              <p className="mt-1 font-body text-xs text-text-muted">{product.title}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddedPromptOpen(false)}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-border font-body text-sm text-text transition hover:border-accent hover:text-accent"
                >
                  {ui?.productContinueShopping || 'Продолжить покупки'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="fabric-strap-btn inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-accent font-body text-sm font-medium text-[#0d121c] transition hover:bg-[#d4ad72]"
                >
                  {ui?.productGoToCart || 'Перейти в корзину'}
                </button>
              </div>
            </div>,
            document.body,
          )
        )}
        {mpKeys.length > 0 && (
          <div className="mt-4 border-t border-border-light pt-3">
            <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
              {ui?.productMarketplacesTitle || 'На маркетплейсах'}
            </p>
            <MarketplaceLinks
              compact
              ignoreEnabledFilter
              hrefById={product.marketplaceLinks}
              linkKeys={mpKeys}
            />
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

