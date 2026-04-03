import type { MarketplaceId } from '../config/site'
import type { Product, ProductCategory, ProductTeaser } from '../data/products'

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

export function parseProduct(raw: Record<string, unknown>): Product | null {
  if (typeof raw.slug !== 'string' || typeof raw.title !== 'string') return null
  const id = typeof raw.id === 'string' ? raw.id : String(raw.id ?? '')
  const category = raw.category as ProductCategory
  if (!['truck', 'warehouse', 'cafe', 'events'].includes(category)) return null
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
  return {
    id,
    slug: raw.slug,
    title: raw.title,
    excerpt: typeof raw.excerpt === 'string' ? raw.excerpt : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    category,
    images,
    priceFrom,
    marketplaceLinks,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
    showOnHome: Boolean(raw.showOnHome),
    teasers,
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

export type BlogDetail = BlogListItem & { body: string }

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
    return {
      slug: o.slug,
      title: typeof o.title === 'string' ? o.title : '',
      excerpt: typeof o.excerpt === 'string' ? o.excerpt : '',
      date: typeof o.date === 'string' ? o.date : '',
      img: typeof o.img === 'string' ? o.img : '',
      body: typeof o.body === 'string' ? o.body : '',
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

export async function postCartOrder(body: {
  customer: { name: string; phone: string; email?: string; comment?: string }
  lines: { productId: string; slug: string; title: string; priceFrom: number; qty: number }[]
  totalApprox: number
}): Promise<{ orderRef: string; clientAck: string } | null> {
  try {
    const r = await fetch(`${apiBase()}/api/leads/cart/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    if (!r.ok) return null
    const data = await parseJson<{ orderRef: string; clientAck: string }>(r)
    return data
  } catch {
    return null
  }
}
