import { Helmet } from 'react-helmet-async'
import { motion, useReducedMotion } from 'framer-motion'
import { startTransition, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { publicSiteUrl } from '../config/publicSite'
import { ProductCard } from '../components/catalog/ProductCard'
import { ProductGallery } from '../components/catalog/ProductGallery'
import { ProductTeaserBadges } from '../components/catalog/ProductTeaserBadges'
import { MarketplaceLinks } from '../components/icons/MarketplaceLinks'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { MARKETPLACES } from '../config/site'
import { CATEGORY_LABELS, type Product } from '../data/products'
import { useCart } from '../hooks/useCart'
import { fetchProductBySlug, fetchRelatedProducts } from '../lib/api'
import { easeOutSoft, fadeUpHidden, fadeUpVisible } from '../lib/motion-presets'

function ProductCartControls({ product }: { product: Product }) {
  const navigate = useNavigate()
  const { addProduct } = useCart()
  const [qty, setQty] = useState(1)

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-2xl border border-border px-2 py-1">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-lg hover:border-accent"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label="Меньше"
        >
          −
        </button>
        <span className="min-w-[2rem] text-center font-body text-base tabular-nums">{qty}</span>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-lg hover:border-accent"
          onClick={() => setQty((q) => Math.min(99, q + 1))}
          aria-label="Больше"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          addProduct(product, qty)
          navigate('/cart')
        }}
        className="inline-flex h-12 min-h-[44px] flex-1 items-center justify-center rounded-[40px] bg-accent px-8 font-body font-medium text-surface shadow-[0_4px_8px_0_rgba(232,122,0,0.25)] hover:bg-[#c65f00] sm:flex-none sm:px-10"
      >
        В корзину
      </button>
    </div>
  )
}

export function ProductPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const reduce = useReducedMotion()
  const [product, setProduct] = useState<Product | null | undefined>(undefined)
  const [related, setRelated] = useState<Product[]>([])
  const site = publicSiteUrl()
  const productJsonLd = useMemo(() => {
    if (product === undefined || product === null) return ''
    const img = product.images[0]
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.excerpt || product.description,
      image: img ? [img] : undefined,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'RUB',
        price: product.priceFrom,
        availability: 'https://schema.org/InStock',
      },
    })
  }, [product])

  useEffect(() => {
    if (!slug) {
      startTransition(() => {
        setProduct(null)
        setRelated([])
      })
      return
    }
    let cancelled = false
    startTransition(() => setProduct(undefined))
    fetchProductBySlug(slug).then((p) => {
      if (cancelled) return
      setProduct(p)
      if (p) {
        fetchRelatedProducts(p.category, p.slug, 6).then((r) => {
          if (!cancelled) setRelated(r)
        })
      } else {
        setRelated([])
      }
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (product === undefined) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-[1280px] px-4 py-20 md:px-6">
          <p className="font-body text-text-muted">Загрузка…</p>
        </main>
        <SiteFooter />
      </>
    )
  }

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

  const allMpKeys = MARKETPLACES.map((m) => m.id)

  return (
    <>
      <Helmet>
        <title>{product.title} — каталог — Фабрика Тентов</title>
        <meta
          name="description"
          content={(product.excerpt || product.description || '').slice(0, 160)}
        />
        <link rel="canonical" href={`${site}/catalog/${encodeURIComponent(product.slug)}`} />
        <script type="application/ld+json">{productJsonLd}</script>
      </Helmet>
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
              <ProductTeaserBadges teasers={product.teasers} className="mt-3" size="md" />
              <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-text md:text-4xl lg:text-5xl">
                {product.title}
              </h1>
              <p className="mt-4 font-body text-2xl font-semibold text-text md:text-3xl">
                от {product.priceFrom.toLocaleString('ru-RU')} ₽
              </p>
              <p className="mt-6 font-body text-base leading-relaxed text-text-muted">
                {product.description}
              </p>

              <ProductCartControls key={product.slug} product={product} />

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
