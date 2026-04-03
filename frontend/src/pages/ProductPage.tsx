import { motion, useReducedMotion } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import { ProductCard } from '../components/catalog/ProductCard'
import { ProductGallery } from '../components/catalog/ProductGallery'
import { MarketplaceLinks } from '../components/icons/MarketplaceLinks'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { MARKETPLACES } from '../config/site'
import { CATEGORY_LABELS, getProductBySlug, getRelatedProducts } from '../data/products'
import { easeOutSoft, fadeUpHidden, fadeUpVisible } from '../lib/motion-presets'

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const reduce = useReducedMotion()
  const product = slug ? getProductBySlug(slug) : undefined

  if (!product) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-[1280px] px-4 py-20 md:px-6">
          <h1 className="font-heading text-3xl font-bold text-text">Товар не найден</h1>
          <p className="mt-3 font-body text-text-muted">
            Позиция отсутствует в каталоге или ссылка устарела.
          </p>
          <Link
            to="/catalog"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-[40px] bg-accent px-8 font-body font-medium text-surface"
          >
            В каталог
          </Link>
        </main>
        <SiteFooter />
      </>
    )
  }

  const related = getRelatedProducts(product, 3)
  const allMpKeys = MARKETPLACES.map((m) => m.id)

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
        <motion.div
          initial={reduce ? false : fadeUpHidden}
          animate={reduce ? undefined : fadeUpVisible}
          transition={easeOutSoft}
        >
          <nav className="font-body text-sm text-text-muted">
            <Link to="/" className="hover:text-accent">
              Главная
            </Link>
            <span className="mx-2">/</span>
            <Link to="/catalog" className="hover:text-accent">
              Каталог
            </Link>
            <span className="mx-2">/</span>
            <span className="line-clamp-1 text-text">{product.title}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-12">
            <ProductGallery images={product.images} title={product.title} />

            <div>
              <p className="font-body text-sm text-accent">{CATEGORY_LABELS[product.category]}</p>
              <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-text md:text-4xl lg:text-5xl">
                {product.title}
              </h1>
              <p className="mt-4 font-body text-2xl font-semibold text-text md:text-3xl">
                от {product.priceFrom.toLocaleString('ru-RU')} ₽
              </p>
              <p className="mt-6 font-body text-base leading-relaxed text-text-muted">
                {product.description}
              </p>

              <div className="mt-8 rounded-2xl border border-border-light bg-bg-base p-5">
                <p className="font-body text-sm font-semibold text-text">Купить на маркетплейсах</p>
                <p className="mt-1 font-body text-xs text-text-muted">
                  Ссылки на витрины товара; где не указано — общая витрина бренда.
                </p>
                <div className="mt-4">
                  <MarketplaceLinks hrefById={product.marketplaceLinks} linkKeys={allMpKeys} />
                </div>
              </div>

              <Link
                to="/#calculator"
                className="mt-8 inline-flex h-12 min-h-[44px] items-center justify-center rounded-[40px] border-2 border-accent px-8 font-body font-medium text-accent hover:bg-[rgba(232,122,0,0.08)]"
              >
                Рассчитать по размерам
              </Link>
            </div>
          </div>
        </motion.div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-border-light pt-14">
            <h2 className="font-heading text-2xl font-bold text-text md:text-3xl">Похожие позиции</h2>
            <p className="mt-2 font-body text-text-muted">Та же категория: {CATEGORY_LABELS[product.category]}</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
