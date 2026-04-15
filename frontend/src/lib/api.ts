import type { MarketplaceId } from '../config/site'
import type { HomePayload } from '../types/homePage'
import {
  DEFAULT_CHECKOUT_PUBLIC,
  type CheckoutDeliveryOption,
  type CheckoutPublicConfig,
} from '../types/checkoutPublic'
import { parseProductPhotoAspect, type ProductPhotoAspect } from './productPhotoAspect'
import type {
  Product,
  ProductCategory,
  ProductSeo,
  ProductSpecificationRow,
  ProductTeaser,
  ProductVariantRow,
} from '../data/products'

export function apiBase(): string {
  return (import.meta.env.VITE_API_URL ?? 'http://localhost:18000').replace(/\/$/, '')
}

async function parseJson<T>(r: Response): Promise<T | null> {
  if (!r.ok) return null
  try {
    return (await r.json()) as T
  } catch {
    return null
  }
}

export async function fetchHealth(): Promise<{
  status: string
  service: string
  time: string
} | null> {
  try {
    const r = await fetch(`${apiBase()}/api/health/`)
    return parseJson(r)
  } catch {
    return null
  }
}

export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

const TEASER_SET = new Set<ProductTeaser>(['recommended', 'bestseller', 'new'])

function parseVariantRow(row: unknown): ProductVariantRow | null {
  if (!row || typeof row !== 'object') return null
  const r = row as Record<string, unknown>
  const id = typeof r.id === 'string' ? r.id : String(r.id ?? '')
  const label = typeof r.label === 'string' ? r.label : ''
  const priceFrom = typeof r.priceFrom === 'number' ? r.priceFrom : Number(r.priceFrom)
  const images = Array.isArray(r.images) ? r.images.filter((u): u is string => typeof u === 'string') : []
  const wbUrl = typeof r.wbUrl === 'string' && r.wbUrl.trim() ? r.wbUrl : undefined
  const isDefault = Boolean(r.isDefault)
  if (!id || !label.trim() || !Number.isFinite(priceFrom)) return null
  return { id, label, priceFrom, images, wbUrl, isDefault }
}

function parseProductSeo(raw: unknown): ProductSeo | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  if (typeof o.pageTitle !== 'string' || typeof o.metaDescription !== 'string') return undefined
  const canonicalPath = typeof o.canonicalPath === 'string' ? o.canonicalPath : ''
  const canonicalUrl = typeof o.canonicalUrl === 'string' ? o.canonicalUrl : ''
  const ogImage = typeof o.ogImage === 'string' ? o.ogImage : ''
  const robots = typeof o.robots === 'string' && o.robots.trim() ? o.robots : 'index, follow'
  return {
    pageTitle: o.pageTitle,
    metaDescription: o.metaDescription,
    canonicalPath,
    canonicalUrl,
    ogImage,
    robots,
  }
}

function parseSpecRow(row: unknown): ProductSpecificationRow | null {
  if (!row || typeof row !== 'object') return null
  const r = row as Record<string, unknown>
  const groupName = typeof r.groupName === 'string' ? r.groupName : ''
  const name = typeof r.name === 'string' ? r.name : ''
  const value = typeof r.value === 'string' ? r.value : ''
  if (!name.trim() || !value.trim()) return null
  return { groupName, name, value }
}

export function parseProduct(raw: Record<string, unknown>): Product | null {
  if (typeof raw.slug !== 'string' || typeof raw.title !== 'string') return null
  const id = typeof raw.id === 'string' ? raw.id : String(raw.id ?? '')
  const category = raw.category
  if (typeof category !== 'string' || !category.trim()) return null
  const categoryTitle =
    typeof raw.categoryTitle === 'string' && raw.categoryTitle.trim() ? raw.categoryTitle : undefined
  const images = Array.isArray(raw.images) ? raw.images.filter((u): u is string => typeof u === 'string') : []
  const teasersRaw = Array.isArray(raw.teasers) ? raw.teasers : []
  const teasers = teasersRaw.filter((t): t is ProductTeaser => TEASER_SET.has(t as ProductTeaser))
  const mp = raw.marketplaceLinks
  const marketplaceLinks =
    mp && typeof mp === 'object' && !Array.isArray(mp)
      ? (mp as Partial<Record<MarketplaceId, string>>)
      : {}
  const priceFrom = typeof raw.priceFrom === 'number' ? raw.priceFrom : Number(raw.priceFrom)
  if (!Number.isFinite(priceFrom)) return null
  const descriptionHtml =
    typeof raw.descriptionHtml === 'string' && raw.descriptionHtml.trim()
      ? raw.descriptionHtml
      : undefined
  const variantsRaw = Array.isArray(raw.variants) ? raw.variants : []
  const variants = variantsRaw
    .map(parseVariantRow)
    .filter((v): v is ProductVariantRow => v !== null)
  const specsRaw = Array.isArray(raw.specifications) ? raw.specifications : []
  const specifications = specsRaw
    .map(parseSpecRow)
    .filter((s): s is ProductSpecificationRow => s !== null)
  const defaultVariantId =
    typeof raw.defaultVariantId === 'string' && raw.defaultVariantId.trim()
      ? raw.defaultVariantId
      : raw.defaultVariantId === null
        ? null
        : undefined
  const seo = parseProductSeo(raw.seo)
  return {
    id,
    slug: raw.slug,
    title: raw.title,
    excerpt: typeof raw.excerpt === 'string' ? raw.excerpt : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    category,
    categoryTitle,
    images,
    priceFrom,
    marketplaceLinks,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
    showOnHome: Boolean(raw.showOnHome),
    teasers,
    descriptionHtml,
    variants: variants.length ? variants : undefined,
    specifications: specifications.length ? specifications : undefined,
    defaultVariantId,
    seo,
  }
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue
    q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

export type CatalogSortApi = 'popular' | 'price-asc' | 'price-desc' | 'name' | 'newest'

export function sortToOrdering(sort: CatalogSortApi): string | undefined {
  switch (sort) {
    case 'price-asc':
      return 'price_from'
    case 'price-desc':
      return '-price_from'
    case 'name':
      return 'title'
    case 'newest':
      return '-updated_at'
    case 'popular':
    default:
      return undefined
  }
}

export type ProductCategoryRow = {
  slug: string
  title: string
  sortOrder: number
  imageUrl?: string | null
}

function parseCategoryRow(o: Record<string, unknown>): ProductCategoryRow | null {
  const slug = typeof o.slug === 'string' ? o.slug : ''
  const title = typeof o.title === 'string' ? o.title : ''
  if (!slug || !title) return null
  const sortOrder = typeof o.sortOrder === 'number' ? o.sortOrder : Number(o.sortOrder) || 0
  const imageUrl =
    typeof o.imageUrl === 'string' && o.imageUrl.trim() ? o.imageUrl.trim() : null
  return { slug, title, sortOrder, imageUrl }
}

export async function fetchProductCategories(): Promise<ProductCategoryRow[] | null> {
  try {
    const r = await fetch(`${apiBase()}/api/product-categories/`)
    const raw = await parseJson<unknown>(r)
    if (!raw || !Array.isArray(raw)) return null
    const out: ProductCategoryRow[] = []
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue
      const row = parseCategoryRow(item as Record<string, unknown>)
      if (row) out.push(row)
    }
    return out
  } catch {
    return null
  }
}

export async function fetchProductsPage(opts: {
  page: number
  category?: ProductCategory | null
  sort: CatalogSortApi
  pageSize?: number
}): Promise<Paginated<Product> | null> {
  const ordering = sortToOrdering(opts.sort)
  const q = buildQuery({
    page: opts.page,
    page_size: opts.pageSize ?? 9,
    ...(opts.category ? { category: opts.category } : {}),
    ...(ordering ? { ordering } : {}),
  })
  try {
    const r = await fetch(`${apiBase()}/api/products/${q}`)
    const data = await parseJson<Paginated<Record<string, unknown>>>(r)
    if (!data || !Array.isArray(data.results)) return null
    const results = data.results.map(parseProduct).filter((p): p is Product => p !== null)
    return { ...data, results }
  } catch {
    return null
  }
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  const q = buildQuery({ show_on_home: true, page_size: 50 })
  try {
    const r = await fetch(`${apiBase()}/api/products/${q}`)
    const data = await parseJson<Paginated<Record<string, unknown>>>(r)
    if (!data?.results) return []
    return data.results.map(parseProduct).filter((p): p is Product => p !== null)
  } catch {
    return []
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const r = await fetch(`${apiBase()}/api/products/${encodeURIComponent(slug)}/`)
    if (r.status === 404) return null
    const raw = await parseJson<Record<string, unknown>>(r)
    if (!raw) return null
    return parseProduct(raw)
  } catch {
    return null
  }
}

export async function fetchRelatedProducts(
  category: ProductCategory,
  excludeSlug: string,
  limit = 6,
): Promise<Product[]> {
  const q = buildQuery({
    category,
    exclude_slug: excludeSlug,
    page_size: limit,
  })
  try {
    const r = await fetch(`${apiBase()}/api/products/${q}`)
    const data = await parseJson<Paginated<Record<string, unknown>>>(r)
    if (!data?.results) return []
    return data.results.map(parseProduct).filter((p): p is Product => p !== null)
  } catch {
    return []
  }
}

export type PortfolioItem = {
  id: string
  slug: string
  title: string
  category: string
  before: string
  after: string
  date: string
}

export async function fetchPortfolio(): Promise<PortfolioItem[]> {
  try {
    const r = await fetch(`${apiBase()}/api/portfolio/`)
    const raw = await parseJson<Record<string, unknown>[] | { results: unknown[] }>(r)
    if (!raw) return []
    const list = Array.isArray(raw) ? raw : Array.isArray(raw.results) ? raw.results : []
    return list
      .map((row) => {
        if (!row || typeof row !== 'object') return null
        const o = row as Record<string, unknown>
        if (typeof o.title !== 'string' || typeof o.slug !== 'string') return null
        return {
          id: String(o.id ?? o.slug),
          slug: o.slug,
          title: o.title,
          category: typeof o.category === 'string' ? o.category : '',
          before: typeof o.before === 'string' ? o.before : '',
          after: typeof o.after === 'string' ? o.after : '',
          date: typeof o.date === 'string' ? o.date : '',
        } satisfies PortfolioItem
      })
      .filter((x): x is PortfolioItem => x !== null)
  } catch {
    return []
  }
}

export type ReviewItem = {
  id: string
  name: string
  text: string
  rating: number
  photo: string
  video: string | null
}

export async function fetchReviews(): Promise<ReviewItem[]> {
  try {
    const r = await fetch(`${apiBase()}/api/reviews/`)
    const raw = await parseJson<Record<string, unknown>[] | { results: unknown[] }>(r)
    if (!raw) return []
    const list = Array.isArray(raw) ? raw : Array.isArray(raw.results) ? raw.results : []
    return list
      .map((row) => {
        if (!row || typeof row !== 'object') return null
        const o = row as Record<string, unknown>
        if (typeof o.name !== 'string' || typeof o.text !== 'string') return null
        const rating = typeof o.rating === 'number' ? o.rating : 5
        const vid = o.video
        return {
          id: String(o.id ?? ''),
          name: o.name,
          text: o.text,
          rating,
          photo: typeof o.photo === 'string' ? o.photo : '',
          video: typeof vid === 'string' && vid.length > 0 ? vid : null,
        } satisfies ReviewItem
      })
      .filter((x): x is ReviewItem => x !== null)
  } catch {
    return []
  }
}

export type BlogListItem = {
  slug: string
  title: string
  excerpt: string
  date: string
  img: string
}

export type BlogPostSeo = {
  pageTitle: string
  metaDescription: string
  canonicalPath: string
  canonicalUrl: string
  ogImage: string
  robots: string
}

export type BlogDetail = BlogListItem & { body: string; seo?: BlogPostSeo }

export async function fetchBlogPosts(): Promise<BlogListItem[]> {
  try {
    const r = await fetch(`${apiBase()}/api/blog/`)
    const raw = await parseJson<Record<string, unknown>[] | { results: unknown[] }>(r)
    if (!raw) return []
    const list = Array.isArray(raw) ? raw : Array.isArray(raw.results) ? raw.results : []
    return list
      .map((row) => {
        if (!row || typeof row !== 'object') return null
        const o = row as Record<string, unknown>
        if (typeof o.slug !== 'string' || typeof o.title !== 'string') return null
        return {
          slug: o.slug,
          title: o.title,
          excerpt: typeof o.excerpt === 'string' ? o.excerpt : '',
          date: typeof o.date === 'string' ? o.date : '',
          img: typeof o.img === 'string' ? o.img : '',
        } satisfies BlogListItem
      })
      .filter((x): x is BlogListItem => x !== null)
  } catch {
    return []
  }
}

export async function fetchBlogPost(slug: string): Promise<BlogDetail | null> {
  try {
    const r = await fetch(`${apiBase()}/api/blog/${encodeURIComponent(slug)}/`)
    if (r.status === 404) return null
    const o = await parseJson<Record<string, unknown>>(r)
    if (!o || typeof o.slug !== 'string') return null
    const seoRaw = o.seo
    let seo: BlogPostSeo | undefined
    if (seoRaw && typeof seoRaw === 'object') {
      const s = seoRaw as Record<string, unknown>
      if (typeof s.pageTitle === 'string' && typeof s.metaDescription === 'string') {
        seo = {
          pageTitle: s.pageTitle,
          metaDescription: s.metaDescription,
          canonicalPath: typeof s.canonicalPath === 'string' ? s.canonicalPath : '',
          canonicalUrl: typeof s.canonicalUrl === 'string' ? s.canonicalUrl : '',
          ogImage: typeof s.ogImage === 'string' ? s.ogImage : '',
          robots: typeof s.robots === 'string' && s.robots.trim() ? s.robots : 'index, follow',
        }
      }
    }
    return {
      slug: o.slug,
      title: typeof o.title === 'string' ? o.title : '',
      excerpt: typeof o.excerpt === 'string' ? o.excerpt : '',
      date: typeof o.date === 'string' ? o.date : '',
      img: typeof o.img === 'string' ? o.img : '',
      body: typeof o.body === 'string' ? o.body : '',
      seo,
    }
  } catch {
    return null
  }
}

export async function postCalculatorLead(body: Record<string, unknown>): Promise<boolean> {
  try {
    const r = await fetch(`${apiBase()}/api/leads/calculator/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    return r.ok
  } catch {
    return false
  }
}

export async function postCallbackLead(body: Record<string, unknown>): Promise<boolean> {
  try {
    const r = await fetch(`${apiBase()}/api/leads/callback/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    return r.ok
  } catch {
    return false
  }
}

const MP_IDS = ['wb', 'ozon', 'ym', 'avito'] as const

/** Перекрытия блока карты на главной из GET /api/site-settings/ (мержится с home.mapForm). */
export type MapFormSiteOverlay = Partial<NonNullable<HomePayload['mapForm']>>

export type AnalyticsYandexDto = {
  enabled: boolean
  counterId: string
}

export type SeoDefaultsDto = {
  allowIndexing: boolean
  region: string
  defaultMetaDescription: string
  titleSuffix: string
  locale: string
}

export type SiteSettingsDto = {
  enabledMarketplaces: string[]
  globalMarketplaceUrls: Partial<Record<MarketplaceId, string>>
  siteName?: string
  siteTagline?: string
  footerNote?: string
  logoUrl?: string | null
  faviconUrl?: string | null
  phone?: string
  phoneHref?: string
  email?: string
  address?: string
  legal?: string
  footerVkUrl?: string
  footerTelegramUrl?: string
  showSocialLinks?: boolean
  contactsPageTitle?: string
  contactsIntro?: string
  contactsHours?: string
  contactsMetaDescription?: string
  contactsBackLinkLabel?: string
  calculatorEnabled?: boolean
  productPhotoAspect?: ProductPhotoAspect
  catalogIntro?: string
  checkout?: CheckoutPublicConfig
  mapForm?: MapFormSiteOverlay
  analyticsYandex?: AnalyticsYandexDto
  seoDefaults?: SeoDefaultsDto
}

function parseCheckoutPublic(raw: unknown): CheckoutPublicConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_CHECKOUT_PUBLIC
  const o = raw as Record<string, unknown>

  const deliveryRaw = o.deliveryOptions
  let deliveryOptions: CheckoutDeliveryOption[] = []
  if (Array.isArray(deliveryRaw)) {
    for (const x of deliveryRaw) {
      if (!x || typeof x !== 'object') continue
      const r = x as Record<string, unknown>
      const id = typeof r.id === 'string' ? r.id : ''
      const label = typeof r.label === 'string' ? r.label : ''
      if (id) deliveryOptions.push({ id, label: label || id })
    }
  }
  if (!deliveryOptions.length) deliveryOptions = DEFAULT_CHECKOUT_PUBLIC.deliveryOptions

  const paymentMatrix: Record<string, string[]> = { ...DEFAULT_CHECKOUT_PUBLIC.paymentMatrix }
  const pmRaw = o.paymentMatrix
  if (pmRaw && typeof pmRaw === 'object' && !Array.isArray(pmRaw)) {
    for (const [k, v] of Object.entries(pmRaw as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        const arr = v.filter((x): x is string => typeof x === 'string')
        if (arr.length) paymentMatrix[k] = arr
      }
    }
  }

  const paymentLabels: Record<string, string> = { ...DEFAULT_CHECKOUT_PUBLIC.paymentLabels }
  const plRaw = o.paymentLabels
  if (plRaw && typeof plRaw === 'object' && !Array.isArray(plRaw)) {
    for (const [k, v] of Object.entries(plRaw as Record<string, unknown>)) {
      if (typeof v === 'string' && v.trim()) paymentLabels[k] = v.trim()
    }
  }

  const pickup = { ...DEFAULT_CHECKOUT_PUBLIC.pickup }
  const pu = o.pickup
  if (pu && typeof pu === 'object' && !Array.isArray(pu)) {
    const p = pu as Record<string, unknown>
    if (typeof p.title === 'string') pickup.title = p.title
    if (typeof p.address === 'string') pickup.address = p.address
    if (typeof p.hours === 'string') pickup.hours = p.hours
    if (typeof p.note === 'string') pickup.note = p.note
    if (typeof p.lat === 'number' && Number.isFinite(p.lat)) pickup.lat = p.lat
    if (typeof p.lng === 'number' && Number.isFinite(p.lng)) pickup.lng = p.lng
  }

  const cdek = { ...DEFAULT_CHECKOUT_PUBLIC.cdek }
  const cd = o.cdek
  if (cd && typeof cd === 'object' && !Array.isArray(cd)) {
    const c = cd as Record<string, unknown>
    if (typeof c.enabled === 'boolean') cdek.enabled = c.enabled
    if (typeof c.testMode === 'boolean') cdek.testMode = c.testMode
    if (typeof c.apiBaseUrl === 'string' && c.apiBaseUrl.trim()) cdek.apiBaseUrl = c.apiBaseUrl.trim()
    if (typeof c.widgetScriptUrl === 'string') cdek.widgetScriptUrl = c.widgetScriptUrl.trim()
    if (typeof c.yandexMapApiKey === 'string') cdek.yandexMapApiKey = c.yandexMapApiKey.trim()
    if (typeof c.widgetServiceUrl === 'string') cdek.widgetServiceUrl = c.widgetServiceUrl.trim()
    if (typeof c.manualPvzEnabled === 'boolean') cdek.manualPvzEnabled = c.manualPvzEnabled
    if (typeof c.widgetSenderCity === 'string' && c.widgetSenderCity.trim())
      cdek.widgetSenderCity = c.widgetSenderCity.trim()
    const wg = c.widgetGoods
    if (Array.isArray(wg) && wg.length) {
      const parcels: { width: number; height: number; length: number; weight: number }[] = []
      for (const row of wg) {
        if (!row || typeof row !== 'object') continue
        const r = row as Record<string, unknown>
        const width = typeof r.width === 'number' ? r.width : Number(r.width)
        const height = typeof r.height === 'number' ? r.height : Number(r.height)
        const length = typeof r.length === 'number' ? r.length : Number(r.length)
        const weight = typeof r.weight === 'number' ? r.weight : Number(r.weight)
        if ([width, height, length, weight].every((n) => Number.isFinite(n))) {
          parcels.push({ width, height, length, weight })
        }
      }
      if (parcels.length) cdek.widgetGoods = parcels
    }
  }

  const ozonLogistics = { ...DEFAULT_CHECKOUT_PUBLIC.ozonLogistics }
  const ol = o.ozonLogistics
  if (ol && typeof ol === 'object' && !Array.isArray(ol)) {
    const z = ol as Record<string, unknown>
    if (typeof z.enabled === 'boolean') ozonLogistics.enabled = z.enabled
    if (typeof z.buyerNote === 'string') ozonLogistics.buyerNote = z.buyerNote
  }

  const ozonPay = { ...DEFAULT_CHECKOUT_PUBLIC.ozonPay }
  const op = o.ozonPay
  if (op && typeof op === 'object' && !Array.isArray(op)) {
    const z = op as Record<string, unknown>
    if (typeof z.enabled === 'boolean') ozonPay.enabled = z.enabled
    if (typeof z.sandbox === 'boolean') ozonPay.sandbox = z.sandbox
  }

  return {
    deliveryOptions,
    paymentMatrix,
    paymentLabels,
    pickup,
    cdek,
    ozonLogistics,
    ozonPay,
  }
}

/** Строка с API как есть (включая пустую); иначе undefined — для контактов и брендинга с витрины. */
function optStr(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

/** Строка как есть; пустая строка сохраняется (режим работы и т.п.). */
function strOrEmpty(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

const MAP_FORM_KEYS = [
  'heading',
  'subheading',
  'mapIframeSrc',
  'mapTitle',
  'formNameLabel',
  'formPhoneLabel',
  'formCommentLabel',
  'namePlaceholder',
  'phonePlaceholder',
  'commentPlaceholder',
  'submitButton',
  'submitting',
  'successMessage',
] as const satisfies readonly (keyof NonNullable<HomePayload['mapForm']>)[]

function parseMapFormOverlay(raw: unknown): MapFormSiteOverlay | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const out: MapFormSiteOverlay = {}
  for (const k of MAP_FORM_KEYS) {
    const v = o[k]
    if (typeof v === 'string') out[k] = v
  }
  return Object.keys(out).length ? out : undefined
}

export async function fetchSiteSettings(): Promise<SiteSettingsDto | null> {
  try {
    const r = await fetch(`${apiBase()}/api/site-settings/`)
    const data = await parseJson<Record<string, unknown>>(r)
    if (!data) return null
    const raw = data.enabledMarketplaces
    const enabled = Array.isArray(raw)
      ? raw.filter((x): x is MarketplaceId => typeof x === 'string' && MP_IDS.includes(x as MarketplaceId))
      : []
    const g = data.globalMarketplaceUrls
    const globalMarketplaceUrls: Partial<Record<MarketplaceId, string>> = {}
    if (g && typeof g === 'object' && !Array.isArray(g)) {
      for (const id of MP_IDS) {
        const u = (g as Record<string, unknown>)[id]
        if (typeof u === 'string' && u.length > 0) globalMarketplaceUrls[id] = u
      }
    }
    return {
      enabledMarketplaces: enabled,
      globalMarketplaceUrls,
      siteName: optStr(data.siteName),
      siteTagline: optStr(data.siteTagline),
      footerNote: optStr(data.footerNote),
      logoUrl: typeof data.logoUrl === 'string' && data.logoUrl ? data.logoUrl : null,
      faviconUrl: typeof data.faviconUrl === 'string' && data.faviconUrl ? data.faviconUrl : null,
      phone: optStr(data.phone),
      phoneHref: optStr(data.phoneHref),
      email: optStr(data.email),
      address: optStr(data.address),
      legal: optStr(data.legal),
      footerVkUrl: optStr(data.footerVkUrl),
      footerTelegramUrl: optStr(data.footerTelegramUrl),
      showSocialLinks: typeof data.showSocialLinks === 'boolean' ? data.showSocialLinks : undefined,
      contactsPageTitle: optStr(data.contactsPageTitle),
      contactsIntro: strOrEmpty(data.contactsIntro),
      contactsHours: strOrEmpty(data.contactsHours),
      contactsMetaDescription: optStr(data.contactsMetaDescription),
      contactsBackLinkLabel: optStr(data.contactsBackLinkLabel),
      calculatorEnabled:
        typeof data.calculatorEnabled === 'boolean' ? data.calculatorEnabled : undefined,
      productPhotoAspect: parseProductPhotoAspect(data.productPhotoAspect),
      catalogIntro: strOrEmpty(data.catalogIntro),
      checkout: parseCheckoutPublic(data.checkout),
      mapForm: parseMapFormOverlay(data.mapForm),
      analyticsYandex: (() => {
        const ax = data.analyticsYandex
        if (!ax || typeof ax !== 'object') return undefined
        const a = ax as Record<string, unknown>
        return {
          enabled: a.enabled === true,
          counterId: typeof a.counterId === 'string' ? a.counterId : '',
        }
      })(),
      seoDefaults: (() => {
        const sd = data.seoDefaults
        if (!sd || typeof sd !== 'object') return undefined
        const s = sd as Record<string, unknown>
        return {
          allowIndexing: s.allowIndexing !== false,
          region: typeof s.region === 'string' && s.region.trim() ? s.region : 'RU',
          defaultMetaDescription:
            typeof s.defaultMetaDescription === 'string' ? s.defaultMetaDescription : '',
          titleSuffix: typeof s.titleSuffix === 'string' ? s.titleSuffix : '',
          locale: typeof s.locale === 'string' && s.locale.trim() ? s.locale : 'ru_RU',
        }
      })(),
    }
  } catch {
    return null
  }
}

export async function fetchHomePageContent(): Promise<HomePayload | null> {
  try {
    const r = await fetch(`${apiBase()}/api/home-content/`)
    const data = await parseJson<{ home?: HomePayload }>(r)
    if (!data?.home || typeof data.home !== 'object') return null
    return data.home
  } catch {
    return null
  }
}

export type AuthUserDto = {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  phone: string
  isStaff: boolean
  groups: string[]
  passwordChangeDeadline?: string | null
  passwordChangeBlocking?: boolean
}

export async function postRegister(body: {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
  website?: string
}): Promise<{ access: string; refresh: string; user: AuthUserDto } | null> {
  try {
    const r = await fetch(`${apiBase()}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...body, website: body.website ?? '' }),
    })
    if (!r.ok) return null
    return parseJson(r)
  } catch {
    return null
  }
}

export async function postLogin(email: string, password: string): Promise<{ access: string; refresh: string } | null> {
  try {
    const r = await fetch(`${apiBase()}/api/auth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username: email.trim().toLowerCase(), password }),
    })
    if (!r.ok) return null
    return parseJson(r)
  } catch {
    return null
  }
}

export async function postRefreshToken(refresh: string): Promise<{ access: string } | null> {
  try {
    const r = await fetch(`${apiBase()}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!r.ok) return null
    return parseJson(r)
  } catch {
    return null
  }
}

export async function fetchAuthMe(accessToken: string): Promise<AuthUserDto | null> {
  try {
    const r = await fetch(`${apiBase()}/api/auth/me/`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
    if (!r.ok) return null
    return parseJson(r)
  } catch {
    return null
  }
}

export async function postChangePassword(
  accessToken: string,
  body: { oldPassword: string; newPassword: string },
): Promise<{ ok: true; user: AuthUserDto } | { ok: false; error: string }> {
  try {
    const r = await fetch(`${apiBase()}/api/auth/change-password/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = (await r.json().catch(() => null)) as Record<string, unknown> | null
    if (r.ok && data && typeof data.user === 'object' && data.user) {
      return { ok: true, user: data.user as AuthUserDto }
    }
    const first = (v: unknown) => (Array.isArray(v) && typeof v[0] === 'string' ? v[0] : null)
    const err =
      first(data?.oldPassword) ||
      first(data?.newPassword) ||
      first(data?.non_field_errors) ||
      (typeof data?.detail === 'string' ? data.detail : null)
    return { ok: false, error: err ?? 'Не удалось сменить пароль' }
  } catch {
    return { ok: false, error: 'Сеть недоступна' }
  }
}

export async function patchAuthProfile(
  accessToken: string,
  body: Partial<{ firstName: string; lastName: string; phone: string }>,
): Promise<AuthUserDto | null> {
  try {
    const r = await fetch(`${apiBase()}/api/auth/me/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!r.ok) return null
    return parseJson(r)
  } catch {
    return null
  }
}

export type CustomerOrderRow = {
  orderRef: string
  createdAt: string
  fulfillment_status: string
  fulfillmentStatusLabel?: string
  payment_status: string
  paymentStatusLabel?: string
  totalApprox: number
  lines: unknown[]
}

export async function fetchCustomerOrders(accessToken: string): Promise<CustomerOrderRow[] | null> {
  try {
    const r = await fetch(`${apiBase()}/api/orders/`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
    if (!r.ok) return null
    const data = await parseJson<CustomerOrderRow[]>(r)
    return data
  } catch {
    return null
  }
}

export async function fetchCustomerOrder(
  accessToken: string,
  orderRef: string,
): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(`${apiBase()}/api/orders/${encodeURIComponent(orderRef)}/`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
    if (!r.ok) return null
    return parseJson(r)
  } catch {
    return null
  }
}

export type ShippingAddressDto = {
  id: number
  label: string
  city: string
  street: string
  building: string
  apartment: string
  postal_code: string
  recipient_name: string
  recipient_phone: string
  is_default: boolean
}

export async function fetchAddresses(accessToken: string): Promise<ShippingAddressDto[] | null> {
  try {
    const r = await fetch(`${apiBase()}/api/addresses/`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
    if (!r.ok) return null
    return parseJson(r)
  } catch {
    return null
  }
}

export async function postAddress(
  accessToken: string,
  body: Omit<ShippingAddressDto, 'id'>,
): Promise<ShippingAddressDto | null> {
  try {
    const r = await fetch(`${apiBase()}/api/addresses/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!r.ok) return null
    return parseJson(r)
  } catch {
    return null
  }
}

export async function patchAddress(
  accessToken: string,
  id: number,
  body: Partial<Omit<ShippingAddressDto, 'id'>>,
): Promise<ShippingAddressDto | null> {
  try {
    const r = await fetch(`${apiBase()}/api/addresses/${id}/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!r.ok) return null
    return parseJson(r)
  } catch {
    return null
  }
}

export async function deleteAddress(accessToken: string, id: number): Promise<boolean> {
  try {
    const r = await fetch(`${apiBase()}/api/addresses/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return r.status === 204 || r.ok
  } catch {
    return false
  }
}

export async function postCartOrder(
  body: {
    customer: { name: string; phone: string; email?: string; comment?: string; website?: string }
    lines: {
      productId: string
      variantId?: string
      slug: string
      title: string
      priceFrom: number
      qty: number
      image?: string
    }[]
    totalApprox: number
    delivery?: Record<string, unknown>
    deliveryMethod?: string
    paymentMethod?: string
  },
  opts?: { accessToken?: string | null },
): Promise<
  | {
      ok: true
      orderRef: string
      clientAck: string
      fulfillmentStatus?: string
      paymentRedirectUrl?: string | null
    }
  | { ok: false; detail: string }
> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    if (opts?.accessToken) headers.Authorization = `Bearer ${opts.accessToken}`
    const r = await fetch(`${apiBase()}/api/leads/cart/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    if (!r.ok) {
      const err = await parseJson<Record<string, unknown>>(r)
      const detailRaw =
        (err?.detail as string | undefined) ??
        (typeof err?.non_field_errors === 'string'
          ? err.non_field_errors
          : Array.isArray(err?.non_field_errors)
            ? String(err?.non_field_errors?.[0] ?? '')
            : '')
      return { ok: false, detail: detailRaw?.trim() || 'Не удалось оформить заказ' }
    }
    const data = await parseJson<{
      orderRef: string
      clientAck: string
      fulfillmentStatus?: string
      paymentRedirectUrl?: string | null
    }>(r)
    if (!data) return { ok: false, detail: 'Пустой ответ сервера' }
    return { ok: true, ...data }
  } catch {
    return { ok: false, detail: 'Ошибка сети при оформлении заказа' }
  }
}
