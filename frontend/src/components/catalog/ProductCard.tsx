import { motion, useReducedMotion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import type { Product } from '../../data/products'
import type { MarketplaceId } from '../../config/site'
import { useCart } from '../../hooks/useCart'
import { MarketplaceLinks } from '../icons/MarketplaceLinks'
import { ProductTeaserBadges } from './ProductTeaserBadges'

type Props = { product: Product }

export function ProductCard({ product }: Props) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const { addProduct } = useCart()
  const mpKeys = Object.keys(product.marketplaceLinks).filter(
    (k) => product.marketplaceLinks[k as MarketplaceId],
  ) as MarketplaceId[]

  return (
    <motion.article
      whileHover={
        reduce
          ? undefined
          : {
              y: -4,
              boxShadow: '0 16px 32px -12px rgba(0,0,0,0.12)',
            }
      }
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border-light bg-surface shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)]"
    >
      <Link to={`/catalog/${product.slug}`} className="relative block overflow-hidden">
        <div className="aspect-[4/3] overflow-hidden bg-bg-base">
          <img
            src={product.images[0]}
            alt=""
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
        </div>
        <ProductTeaserBadges teasers={product.teasers} className="absolute left-2 top-2 max-w-[calc(100%-1rem)]" />
      </Link>
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <p className="font-body text-xs text-text-subtle">
          от {product.priceFrom.toLocaleString('ru-RU')} ₽
        </p>
        <Link to={`/catalog/${product.slug}`}>
          <h2 className="mt-1 font-heading text-lg font-semibold text-text hover:text-accent md:text-xl">
            {product.title}
          </h2>
        </Link>
        <p className="mt-2 flex-1 font-body text-sm leading-relaxed text-text-muted">{product.excerpt}</p>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            addProduct(product, 1)
            navigate('/cart')
          }}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-accent font-body text-sm font-medium text-accent transition hover:bg-[rgba(232,122,0,0.08)]"
        >
          В корзину
        </button>
        {mpKeys.length > 0 && (
          <div className="mt-4 border-t border-border-light pt-3">
            <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-wide text-text-subtle">
              Купить
            </p>
            <MarketplaceLinks hrefById={product.marketplaceLinks} linkKeys={mpKeys} />
          </div>
        )}
      </div>
    </motion.article>
  )
}
