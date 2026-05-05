import { Helmet } from 'react-helmet-async'
import { motion, useReducedMotion } from 'framer-motion'
import { startTransition, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { publicSiteUrl } from '../config/publicSite'
import { productMaterialMapAlt } from '../lib/imageAlt'
import { ProductCard } from '../components/catalog/ProductCard'
import { ProductDetailsDrawer } from '../components/catalog/ProductDetailsDrawer'
import { ProductGallery } from '../components/catalog/ProductGallery'
import { ProductTeaserBadges } from '../components/catalog/ProductTeaserBadges'
import { ProductTrustStrip } from '../components/catalog/ProductTrustStrip'
import { MarketplaceLinks } from '../components/icons/MarketplaceLinks'
import { HeroCallbackModal } from '../components/home/HeroCallbackModal'
import { OptimizedImage } from '../components/ui/OptimizedImage'
import { PriceTag } from '../components/ui/PriceTag'
import { PromoEndsCountdown } from '../components/promo/PromoEndsCountdown'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { OneClickOrderModal } from '../components/order/OneClickOrderModal'
import { useSetCanonical, useCanonicalHrefForMeta } from '../context/CanonicalUrlContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { MARKETPLACES, type MarketplaceId } from '../config/site'
import { CATEGORY_LABELS, type Product, type ProductVariantRow } from '../data/products'
import { useCart } from '../hooks/useCart'
import { fetchProductBySlug, fetchRelatedProducts } from '../lib/api'
import { orderLineFromProduct } from '../lib/orderLinePayload'
import { easeOutSoft, fadeUpHidden, fadeUpVisible, cardHoverTransition, subtleButtonHover } from '../lib/motion-presets'
import { productPageGridClass } from '../lib/productPhotoAspect'
import { absolutizeCustomCanonical } from '../lib/canonicalPublicUrl'
import { truncateMetaDescription } from '../lib/seoVitrine'
import type { HomePayload } from '../types/homePage'

function categoryLabel(p: Product): string {
  return p.categoryTitle ?? CATEGORY_LABELS[p.category] ?? p.category
}

function ProductCartControls({
  product,
  variant,
  ui,
}: {
  product: Product
  variant: ProductVariantRow | null
  ui: HomePayload['ui'] | undefined
}) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const { addProduct } = useCart()
  const [qty, setQty] = useState(1)
  const [addedPromptOpen, setAddedPromptOpen] = useState(false)
  const [oneClickOpen, setOneClickOpen] = useState(false)
  const oneLine = useMemo(
    () => (product ? orderLineFromProduct(product, variant, qty) : null),
    [product, variant, qty],
  )
  const oneClickLines = oneLine ? [oneLine] : []

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-2xl border border-border px-2 py-1">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-lg hover:border-accent"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          aria-label={ui?.cartRemoveOrDecreaseAria || 'Удалить позицию из корзины или уменьшить количество'}
        >
          −
        </button>
        <span className="min-w-[2rem] text-center font-body text-base tabular-nums">{qty}</span>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-lg hover:border-accent"
          onClick={() => setQty((q) => Math.min(99, q + 1))}
          aria-label={ui?.cartIncreaseAria || 'Увеличить количество'}
        >
          +
        </button>
      </div>
      <motion.button
        type="button"
        onClick={() => {
          addProduct(product, qty, variant ?? undefined)
          setAddedPromptOpen(true)
        }}
        whileHover={reduce ? undefined : subtleButtonHover}
        whileTap={reduce ? undefined : { scale: 0.98 }}
        transition={cardHoverTransition}
        className="inline-flex h-12 min-h-[44px] flex-1 items-center justify-center rounded-[40px] bg-accent px-8 font-body font-medium text-surface shadow-[0_4px_8px_0_rgba(232,122,0,0.25)] hover:bg-[#c65f00] sm:flex-none sm:px-10"
      >
        {ui?.productAddToCart || 'В корзину'}
      </motion.button>
      <button
        type="button"
        onClick={() => setOneClickOpen(true)}
        className="inline-flex h-12 min-h-[44px] flex-1 items-center justify-center rounded-[40px] border-2 border-accent px-6 font-body font-medium text-accent transition hover:bg-[rgba(200,155,83,0.12)] sm:flex-none sm:px-8"
      >
        Купить в 1 клик
      </button>
      <OneClickOrderModal
        open={oneClickOpen}
        onClose={() => setOneClickOpen(false)}
        lines={oneClickLines}
        title="Купить в 1 клик"
      />
      {addedPromptOpen && (
        createPortal(
          <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+6rem)] z-[520] mx-auto w-[min(560px,calc(100%-2rem))] rounded-2xl border border-border-light bg-surface p-4 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.24)] md:inset-x-auto md:bottom-4 md:right-6 md:mx-0 md:w-[500px]">
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
                className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-accent font-body text-sm font-medium text-surface transition hover:bg-[#c65f00]"
              >
                {ui?.productGoToCart || 'Перейти в корзину'}
              </button>
            </div>
          </div>,
          document.body,
        )
      )}
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

function ProductPageSkeleton() {
  return (
    <div className="grid min-w-0 gap-10 lg:grid-cols-[minmax(0,38%)_minmax(0,1fr)] lg:gap-14">
      <div className="space-y-4">
        <div className="skeleton-shimmer aspect-[3/4] rounded-2xl border border-border-light" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-16 w-14 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="skeleton-shimmer h-4 w-1/3 rounded" />
        <div className="skeleton-shimmer h-12 w-4/5 rounded" />
        <div className="skeleton-shimmer h-4 w-full rounded" />
        <div className="skeleton-shimmer h-4 w-5/6 rounded" />
        <div className="skeleton-shimmer mt-3 h-12 w-48 rounded-full" />
        <div className="skeleton-shimmer mt-6 h-12 w-full rounded-2xl" />
      </div>
    </div>
  )
}

function MaterialLayersHint({
  materialMap,
  subtitleFallback,
}: {
  materialMap: NonNullable<Product['materialMap']>
  subtitleFallback: string
}) {
  const layers = materialMap.layers
  const [active, setActive] = useState<string>(layers[0]?.id ?? '')

  return (
    <div className="rounded-2xl border border-border-light bg-surface p-5 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.06)]">
      <p className="font-heading text-base font-semibold text-text">{materialMap.title}</p>
      <p className="mt-1 font-body text-xs text-text-muted">
        {materialMap.subtitle || subtitleFallback}
      </p>
      <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-xl bg-[linear-gradient(160deg,#ebe4d8,#d9d0c3)]">
        {materialMap.imageUrl ? (
          <OptimizedImage
            src={materialMap.imageUrl}
            alt={productMaterialMapAlt(materialMap.title)}
            className="absolute inset-0 h-full w-full object-cover"
            widths={[480, 960, 1280]}
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/8" />
        {layers.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setActive(l.id)}
            className={`absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
              active === l.id ? 'border-accent bg-accent' : 'border-surface bg-text/50'
            }`}
            style={{ left: `${l.x}%`, top: `${l.y}%` }}
            aria-label={l.title}
          />
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-bg-base px-3 py-2 font-body text-sm text-text">
        {layers.find((l) => l.id === active)?.title}
      </div>
    </div>
  )
}

export function ProductPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const reduce = useReducedMotion()
  const { calculatorEnabled, productPhotoAspect, seoDefaults, home, siteName } = useSiteSettings()
  const ui = home?.ui
  const [product, setProduct] = useState<Product | null | undefined>(undefined)
  const [related, setRelated] = useState<Product[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [customOrderOpen, setCustomOrderOpen] = useState(false)
  const site = publicSiteUrl()

  const canonicalOverride = useMemo(() => {
    if (product === undefined || product === null) return null
    const fallback = `${site}/catalog/${encodeURIComponent(product.slug)}`
    return absolutizeCustomCanonical(site, product.seo?.canonicalUrl, fallback)
  }, [product, site])
  useSetCanonical(canonicalOverride)
  const canonicalForMeta = useCanonicalHrefForMeta()

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
  const displayPriceList = selectedVariant
    ? (selectedVariant.priceList ?? selectedVariant.priceFrom)
    : (product?.priceList ?? product?.priceFrom ?? displayPrice)

  const marketplaceMerged = useMemo(() => {
    if (!product) return {}
    const m = { ...product.marketplaceLinks }
    if (selectedVariant?.wbUrl) m.wb = selectedVariant.wbUrl
    return m
  }, [product, selectedVariant])

  const productJsonLd = useMemo(() => {
    if (product === undefined || product === null) return ''
    const img = galleryImages[0] || product.images[0]
    const imageObjects = (galleryImages.length ? galleryImages : product.images)
      .filter((u) => typeof u === 'string' && u.trim().length > 0)
      .map((u) => ({
        '@type': 'ImageObject',
        url: u,
      }))
    const offerSku = selectedVariant?.id || product.id
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.excerpt || product.description,
      image: imageObjects.length ? imageObjects : img ? [img] : undefined,
      sku: offerSku,
      category: categoryLabel(product),
      areaServed: {
        '@type': 'AdministrativeArea',
        name: seoDefaults.region || 'RU',
      },
      offers: {
        '@type': 'Offer',
        sku: offerSku,
        priceCurrency: 'RUB',
        price: String(displayPrice),
        ...(displayPriceList > displayPrice
          ? {
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                priceCurrency: 'RUB',
                price: String(displayPriceList),
                priceType: 'https://schema.org/ListPrice',
              },
            }
          : {}),
        availability: 'https://schema.org/InStock',
      },
    })
  }, [product, galleryImages, displayPrice, displayPriceList, seoDefaults.region, selectedVariant?.id])

  const displayMpKeys = useMemo(() => {
    const merged = marketplaceMerged
    const withUrl = (Object.keys(merged) as MarketplaceId[]).filter((id) => {
      const u = merged[id]
      return typeof u === 'string' && u.trim().length > 0
    })
    const order = MARKETPLACES.map((m) => m.id)
    return order.filter((id) => withUrl.includes(id))
  }, [marketplaceMerged])

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
        <main className="fabric-page">
          <div className="fabric-page-main min-w-0 overflow-x-clip">
          <ProductPageSkeleton />
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  if (!product) {
    return (
      <>
        <SiteHeader />
        <main className="fabric-page">
          <div className="fabric-page-main min-w-0 overflow-x-clip">
          <div className="fabric-card border-dashed px-6 py-10">
            <h1 className="font-heading text-3xl font-bold text-text">{ui?.productNotFoundTitle || 'Товар не найден'}</h1>
            <p className="mt-3 font-body text-text-muted">
              {ui?.productNotFoundText || 'Позиция отсутствует в каталоге или ссылка устарела.'}
            </p>
            <motion.div
              whileHover={reduce ? undefined : subtleButtonHover}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              transition={cardHoverTransition}
              className="inline-flex"
            >
              <Link
                to="/catalog"
                className="fabric-strap-btn mt-8 inline-flex h-12 items-center justify-center rounded-[40px] bg-accent px-8 font-body font-medium text-[#0d121c]"
              >
                {ui?.productBackToCatalog || 'В каталог'}
              </Link>
            </motion.div>
          </div>
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  const seo = product.seo
  const rawPageTitle = seo?.pageTitle ?? `${product.title} — каталог`
  const pageTitle = seoDefaults.titleSuffix ? `${rawPageTitle} ${seoDefaults.titleSuffix}` : rawPageTitle
  const metaDesc = truncateMetaDescription(
    seo?.metaDescription ?? (product.excerpt || product.description || ''),
    undefined,
    seoDefaults,
  )
  const ogImage = seo?.ogImage || galleryImages[0] || product.images[0] || seoDefaults.ogImageUrl
  const tw = seoDefaults.twitterCard || 'summary_large_image'

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        {seo?.robots ? <meta name="robots" content={seo.robots} /> : null}
        <meta name="twitter:card" content={tw} />
        {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
        <meta property="og:type" content="product" />
        <meta property="og:url" content={canonicalForMeta} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:locale" content={seoDefaults.locale.replace('_', '-')} />
        {ogImage ? <meta property="og:image" content={ogImage} /> : null}
        <script type="application/ld+json">{productJsonLd}</script>
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <div className="fabric-page-main min-w-0 overflow-x-clip">
        <motion.div
          initial={reduce ? false : fadeUpHidden}
          animate={reduce ? undefined : fadeUpVisible}
          transition={easeOutSoft}
        >
          <nav
            className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-sm text-text-muted"
            aria-label={ui?.productBreadcrumbAria || 'Навигация'}
          >
            <Link to="/" className="rounded-md px-1 hover:text-accent">
              {ui?.productBreadcrumbHome || 'Главная'}
            </Link>
            <span className="text-text-subtle" aria-hidden>
              /
            </span>
            <Link to="/catalog" className="rounded-md px-1 hover:text-accent">
              {ui?.productBreadcrumbCatalog || 'Каталог'}
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

            <div className="min-w-0 space-y-8 lg:sticky lg:top-[calc(var(--site-header-height)+1.25rem)]">
              <div>
                <p className="font-body text-sm font-medium text-accent">{categoryLabel(product)}</p>
                <ProductTeaserBadges teasers={product.teasers} className="mt-3" size="md" />
                <h1 className="fabric-section-title mt-2 break-words lg:text-[2.75rem] lg:leading-[1.1]">
                  {product.title}
                </h1>
                <div className="mt-5 rounded-2xl bg-accent/10 px-4 py-3 sm:py-2.5">
                  {product.bestPromotionDiscountPercent != null && product.bestPromotionDiscountPercent > 0 ? (
                    <p className="mb-2 font-body text-sm text-text">
                      <span className="inline-flex rounded-full bg-accent/25 px-2.5 py-0.5 text-sm font-semibold text-accent">
                        −{product.bestPromotionDiscountPercent}% по акциям
                      </span>
                    </p>
                  ) : null}
                  <PriceTag
                    prefix={ui?.productPriceLabel || 'Цена'}
                    priceFrom={displayPrice}
                    priceList={displayPriceList}
                    size="lg"
                  />
                </div>
                <PromoEndsCountdown endsAt={product.promoEndsAt} className="max-w-lg" />
                {product.promotions && product.promotions.length > 0 ? (
                  <div className="mt-3 max-w-lg">
                    <p className="font-body text-xs font-semibold uppercase tracking-wide text-text-subtle">
                      Акции на этот товар
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2" aria-label="Список акций">
                      {product.promotions.map((pr) => (
                        <li key={pr.slug}>
                          <Link
                            to={`/sales/${encodeURIComponent(pr.slug)}`}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border-light bg-surface px-3 py-1.5 font-body text-xs text-text transition hover:border-accent/50 hover:text-accent"
                          >
                            <span className="line-clamp-2">{pr.title}</span>
                            {pr.discountPercent > 0 ? (
                              <span className="shrink-0 font-semibold text-accent">−{pr.discountPercent}%</span>
                            ) : null}
                            {pr.stackWithOthers ? (
                              <span className="shrink-0 rounded bg-primary/15 px-1 py-0 text-[10px] text-text-muted">
                                +
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <ProductTrustStrip
                  className="mt-4 max-w-lg"
                  warrantyMonths={product.warrantyMonths}
                  returnDays={product.returnDays}
                />
              </div>

              {product.variants && product.variants.length > 1 && (
                <div>
                  <p className="font-body text-xs font-semibold uppercase tracking-wide text-text-subtle">
                    {ui?.productVariantLabel || 'Вариант'}
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
                    {ui?.productDetailsButton || 'Характеристики и описание'}
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
                ui={ui}
              />

              {product.materialMap ? (
                <MaterialLayersHint
                  materialMap={product.materialMap}
                  subtitleFallback={ui?.productMaterialMapSubtitleFallback || 'Тапните по точке, чтобы увидеть слой конструкции.'}
                />
              ) : null}

              {displayMpKeys.length > 0 ? (
                <div className="fabric-card p-5 md:p-6">
                  <p className="font-heading text-base font-semibold text-text">
                    {ui?.productMarketplacesCardTitle || 'Маркетплейсы'}
                  </p>
                  <p className="mt-1 font-body text-xs leading-relaxed text-text-muted">
                    {ui?.productMarketplacesCardHint || 'Переход к покупке на выбранной площадке — в новой вкладке.'}
                  </p>
                  <div className="mt-4">
                    <MarketplaceLinks
                      compact
                      ignoreEnabledFilter
                      hrefById={marketplaceMerged}
                      linkKeys={displayMpKeys}
                    />
                  </div>
                </div>
              ) : null}

              {calculatorEnabled ? (
                <button
                  type="button"
                  onClick={() => setCustomOrderOpen(true)}
                  className="fabric-strap-btn inline-flex h-12 min-h-[44px] w-full items-center justify-center rounded-[40px] border-2 border-accent px-8 font-body font-medium text-accent transition hover:bg-[rgba(200,155,83,0.12)] sm:w-auto"
                >
                  {ui?.productCustomOrderCta || 'Нужен индивидуальный заказ?'}
                </button>
              ) : null}
            </div>
          </div>
        </motion.div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-border pt-14">
            <h2 className="font-heading text-2xl font-bold text-text md:text-3xl">
              {ui?.productRelatedTitle || 'Похожие позиции'}
            </h2>
            <p className="mt-2 font-body text-text-muted">
              {ui?.productRelatedSubtitlePrefix || 'Та же категория:'} {categoryLabel(product)}
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
        </div>
      </main>

      <ProductDetailsDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={product.title}
        specSections={specSectionsForDrawer}
        descriptionHtml={product.descriptionHtml?.trim() ? product.descriptionHtml : null}
        descriptionPlain={product.description ?? ''}
      />
      <HeroCallbackModal
        open={customOrderOpen}
        onClose={() => setCustomOrderOpen(false)}
        modal={home?.hero?.callbackModal ?? {}}
      />

      <SiteFooter />
    </>
  )
}
