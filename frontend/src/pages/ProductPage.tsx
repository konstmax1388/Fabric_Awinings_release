import { Helmet } from 'react-helmet-async'
import { motion, useReducedMotion } from 'framer-motion'
import { startTransition, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { publicSiteUrl } from '../config/publicSite'
import { ProductCard } from '../components/catalog/ProductCard'
import { ProductDetailsDrawer } from '../components/catalog/ProductDetailsDrawer'
import { ProductGallery } from '../components/catalog/ProductGallery'
import { ProductTeaserBadges } from '../components/catalog/ProductTeaserBadges'
import { MarketplaceLinks } from '../components/icons/MarketplaceLinks'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { MARKETPLACES } from '../config/site'
import { CATEGORY_LABELS, type Product, type ProductVariantRow } from '../data/products'
import { useCart } from '../hooks/useCart'
import { fetchProductBySlug, fetchRelatedProducts } from '../lib/api'
import { easeOutSoft, fadeUpHidden, fadeUpVisible } from '../lib/motion-presets'
import { productPageGridClass } from '../lib/productPhotoAspect'

function categoryLabel(p: Product): string {
  return p.categoryTitle ?? CATEGORY_LABELS[p.category] ?? p.category
}

function ProductCartControls({
  product,
  variant,
}: {
  product: Product
  variant: ProductVariantRow | null
}) {
  const navigate = useNavigate()
  const { addProduct } = useCart()
  const [qty, setQty] = useState(1)

  return (
    <div className="flex flex-wrap items-center gap-3">
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
          addProduct(product, qty, variant ?? undefined)
          navigate('/cart')
        }}
        className="inline-flex h-12 min-h-[44px] flex-1 items-center justify-center rounded-[40px] bg-accent px-8 font-body font-medium text-surface shadow-[0_4px_8px_0_rgba(232,122,0,0.25)] hover:bg-[#c65f00] sm:flex-none sm:px-10"
      >
        В корзину
      </button>
    </div>
  )
}

function groupSpecifications(rows: NonNullable<Product['specifications']>) {
  const map = new Map<string, typeof rows>()
  for (const row of rows) {
    const g = row.groupName.trim() || 'Характеристики'
    const list = map.get(g) ?? []
    list.push(row)
    map.set(g, list)
  }
  return map
}

export function ProductPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const reduce = useReducedMotion()
  const { enabledMarketplaces, calculatorEnabled, productPhotoAspect, seoDefaults } = useSiteSettings()
  const [product, setProduct] = useState<Product | null | undefined>(undefined)
  const [related, setRelated] = useState<Product[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const site = publicSiteUrl()

  useEffect(() => {
    if (!product) {
      setSelectedVariantId(null)
      return
    }
    const def =
      product.defaultVariantId ??
      product.variants?.find((v) => v.isDefault)?.id ??
      product.variants?.[0]?.id ??
      null
    setSelectedVariantId(def)
  }, [product])

  const selectedVariant = useMemo((): ProductVariantRow | null => {
    if (!product?.variants?.length) return null
    const v = product.variants.find((x) => x.id === selectedVariantId)
    return v ?? product.variants[0] ?? null
  }, [product, selectedVariantId])

  const galleryImages = useMemo(() => {
    if (!product) return []
    if (selectedVariant?.images?.length) return selectedVariant.images
    return product.images
  }, [product, selectedVariant])

  const displayPrice = selectedVariant?.priceFrom ?? product?.priceFrom ?? 0

  const marketplaceMerged = useMemo(() => {
    if (!product) return {}
    const m = { ...product.marketplaceLinks }
    if (selectedVariant?.wbUrl) m.wb = selectedVariant.wbUrl
    return m
  }, [product, selectedVariant])

  const productJsonLd = useMemo(() => {
    if (product === undefined || product === null) return ''
    const img = galleryImages[0] || product.images[0]
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.excerpt || product.description,
      image: img ? [img] : undefined,
      category: categoryLabel(product),
      areaServed: {
        '@type': 'AdministrativeArea',
        name: seoDefaults.region || 'RU',
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'RUB',
        price: displayPrice,
        availability: 'https://schema.org/InStock',
      },
    })
  }, [product, galleryImages, displayPrice, seoDefaults.region])

  const displayMpKeys = useMemo(
    () => enabledMarketplaces.filter((id) => MARKETPLACES.some((m) => m.id === id)),
    [enabledMarketplaces],
  )

  const specSectionsForDrawer = useMemo(() => {
    const specs = product?.specifications
    if (!specs?.length) return null
    const specGroups = groupSpecifications(specs)
    if (specGroups.size === 0) return null
    return [...specGroups.entries()].map(([groupName, rows]) => ({ groupName, rows }))
  }, [product])

  const hasDetailsPanelContent = useMemo(() => {
    if (product === undefined || product === null) return false
    const hasSpecs = Boolean(specSectionsForDrawer && specSectionsForDrawer.length > 0)
    const hasHtml = Boolean(product.descriptionHtml?.trim())
    const hasPlain = Boolean(product.description?.trim())
    return hasSpecs || hasHtml || hasPlain
  }, [product, specSectionsForDrawer])

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

  const seo = product.seo
  const pageTitle = seo?.pageTitle ?? `${product.title} — каталог`
  const metaDesc =
    seo?.metaDescription ?? (product.excerpt || product.description || '').slice(0, 160)
  const canonicalHref = seo?.canonicalUrl || `${site}/catalog/${encodeURIComponent(product.slug)}`
  const ogImage = seo?.ogImage || galleryImages[0] || product.images[0]

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        {seo?.robots ? <meta name="robots" content={seo.robots} /> : null}
        <link rel="canonical" href={canonicalHref} />
        <meta property="og:type" content="product" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:locale" content={seoDefaults.locale.replace('_', '-')} />
        {ogImage ? <meta property="og:image" content={ogImage} /> : null}
        <script type="application/ld+json">{productJsonLd}</script>
      </Helmet>
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
        <motion.div
          initial={reduce ? false : fadeUpHidden}
          animate={reduce ? undefined : fadeUpVisible}
          transition={easeOutSoft}
        >
          <nav
            className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-sm text-text-muted"
            aria-label="Навигация"
          >
            <Link to="/" className="rounded-md px-1 hover:text-accent">
              Главная
            </Link>
            <span className="text-text-subtle" aria-hidden>
              /
            </span>
            <Link to="/catalog" className="rounded-md px-1 hover:text-accent">
              Каталог
            </Link>
            <span className="text-text-subtle" aria-hidden>
              /
            </span>
            <span className="line-clamp-2 max-w-[min(100%,28rem)] text-text">{product.title}</span>
          </nav>

          <div className={productPageGridClass(productPhotoAspect)}>
            <ProductGallery
              images={galleryImages}
              title={product.title}
              aspect={productPhotoAspect}
            />

            <div className="space-y-8 lg:sticky lg:top-28">
              <div>
                <p className="font-body text-sm font-medium text-accent">{categoryLabel(product)}</p>
                <ProductTeaserBadges teasers={product.teasers} className="mt-3" size="md" />
                <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-text md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                  {product.title}
                </h1>
                <div className="mt-5 inline-flex items-baseline gap-2 rounded-2xl bg-accent/10 px-4 py-2.5">
                  <span className="font-body text-sm font-medium text-text-muted">Цена</span>
                  <span className="font-heading text-2xl font-bold tabular-nums text-accent md:text-3xl">
                    {displayPrice.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>

              {product.variants && product.variants.length > 1 && (
                <div>
                  <p className="font-body text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    Вариант
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.variants.map((v) => {
                      const active = v.id === (selectedVariant?.id ?? '')
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`rounded-xl border px-3.5 py-2 font-body text-sm font-medium transition ${
                            active
                              ? 'border-accent bg-accent/12 text-text shadow-sm ring-2 ring-accent/20'
                              : 'border-border-light bg-surface text-text-muted hover:border-accent/40 hover:bg-bg-base'
                          }`}
                        >
                          {v.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {product.excerpt?.trim() ? (
                <p className="font-body text-base leading-relaxed text-text-muted md:text-[1.05rem]">
                  {product.excerpt.trim()}
                </p>
              ) : null}

              {hasDetailsPanelContent ? (
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  className="group flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-accent/35 bg-gradient-to-br from-bg-base to-surface px-5 py-4 text-left shadow-[0_8px_28px_-12px_rgba(232,122,0,0.18)] transition hover:border-accent/60 hover:shadow-[0_12px_32px_-10px_rgba(232,122,0,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 md:max-w-xl"
                >
                  <span className="font-heading text-base font-semibold text-text md:text-lg">
                    Характеристики и описание
                  </span>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent transition group-hover:bg-accent/20"
                    aria-hidden
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              ) : null}

              <ProductCartControls
                key={`${product.slug}-${selectedVariant?.id ?? 'x'}`}
                product={product}
                variant={selectedVariant}
              />

              <div className="rounded-2xl border border-border-light bg-surface p-5 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.06)] md:p-6">
                <p className="font-heading text-base font-semibold text-text">Маркетплейсы</p>
                <p className="mt-1 font-body text-xs leading-relaxed text-text-muted">
                  Переход к покупке на выбранной площадке — в новой вкладке.
                </p>
                <div className="mt-4">
                  <MarketplaceLinks hrefById={marketplaceMerged} linkKeys={displayMpKeys} />
                </div>
              </div>

              {calculatorEnabled ? (
                <Link
                  to="/#calculator"
                  className="inline-flex h-12 min-h-[44px] w-full items-center justify-center rounded-[40px] border-2 border-accent px-8 font-body font-medium text-accent transition hover:bg-[rgba(232,122,0,0.08)] sm:w-auto"
                >
                  Рассчитать по размерам
                </Link>
              ) : null}
            </div>
          </div>
        </motion.div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-border-light pt-14">
            <h2 className="font-heading text-2xl font-bold text-text md:text-3xl">Похожие позиции</h2>
            <p className="mt-2 font-body text-text-muted">Та же категория: {categoryLabel(product)}</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <ProductDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={product.title}
        specSections={specSectionsForDrawer}
        descriptionHtml={product.descriptionHtml?.trim() ? product.descriptionHtml : null}
        descriptionPlain={product.description ?? ''}
      />

      <SiteFooter />
    </>
  )
}
