import type { HomePayload } from '../types/homePage'
import type { StaticPageDto } from './api'

export type HeaderNavKey = 'home' | 'catalog' | 'about' | 'portfolio' | 'blog' | 'reviews' | 'contacts'

export type HeaderNavRow = {
  key: HeaderNavKey
  enabled: boolean
  order: number
  label: string
}

const PATHS: Record<Exclude<HeaderNavKey, 'about'>, string> = {
  home: '/',
  catalog: '/catalog',
  portfolio: '/portfolio',
  blog: '/blog',
  reviews: '/reviews',
  contacts: '/contacts',
}

export function sanitizeAboutSlug(raw: string | undefined): string {
  const t = (raw || 'o-nas').trim().toLowerCase()
  if (!t || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t)) return 'o-nas'
  return t.slice(0, 120)
}

/** URL страницы «О нас» из `home.ui.aboutPageSlug` (витрина, шапка/подвал). */
export function aboutPathFromHomeUi(ui: HomePayload['ui'] | undefined): string {
  return `/${sanitizeAboutSlug(ui?.aboutPageSlug)}`
}

function defaultLabelForKey(key: HeaderNavKey, ui: HomePayload['ui'] | undefined): string {
  const u = ui
  switch (key) {
    case 'home':
      return u?.navHome ?? 'Главная'
    case 'catalog':
      return u?.navCatalog ?? 'Каталог'
    case 'about':
      return u?.navAbout ?? 'О нас'
    case 'portfolio':
      return u?.navPortfolio ?? 'Портфолио'
    case 'blog':
      return u?.navBlog ?? 'Блог'
    case 'reviews':
      return u?.navReviews ?? 'Отзывы'
    case 'contacts':
      return u?.navContacts ?? 'Контакты'
    default:
      return key
  }
}

function parseRows(raw: unknown): HeaderNavRow[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const out: HeaderNavRow[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const key = r.key
    if (
      key !== 'home' &&
      key !== 'catalog' &&
      key !== 'about' &&
      key !== 'portfolio' &&
      key !== 'blog' &&
      key !== 'reviews' &&
      key !== 'contacts'
    ) {
      continue
    }
    const enabled = r.enabled !== false
    const order = typeof r.order === 'number' && Number.isFinite(r.order) ? r.order : 0
    const label = typeof r.label === 'string' ? r.label : ''
    out.push({ key, enabled, order, label })
  }
  return out.length ? out : null
}

export type MainNavChild = { key: string; to: string; label: string }

export type MainNavItem = {
  key: string
  to: string
  label: string
  end?: boolean
  children?: MainNavChild[]
}

/**
 * Пункты верхнего и мобильного меню: JSON из настроек + подписи из home.ui + статические страницы в шапке.
 * «О нас» при включении забирает в подменю «Отзывы» и «Портфолио» (если они включены).
 */
export function buildMainNavItems(
  headerNavigation: unknown,
  ui: HomePayload['ui'] | undefined,
  options: { portfolioEnabled: boolean; staticPages: StaticPageDto[] },
): MainNavItem[] {
  const aboutPath = aboutPathFromHomeUi(ui)
  const rows = parseRows(headerNavigation)
  const sorted = rows
    ? [...rows].sort((a, b) => a.order - b.order || a.key.localeCompare(b.key))
    : [
        { key: 'home' as const, enabled: true, order: 0, label: '' },
        { key: 'catalog' as const, enabled: true, order: 1, label: '' },
        { key: 'about' as const, enabled: true, order: 2, label: '' },
        { key: 'blog' as const, enabled: true, order: 3, label: '' },
        { key: 'contacts' as const, enabled: true, order: 4, label: '' },
        { key: 'reviews' as const, enabled: true, order: 5, label: '' },
        { key: 'portfolio' as const, enabled: true, order: 6, label: '' },
      ]

  const aboutOn = sorted.some((r) => r.key === 'about' && r.enabled)
  const reviewsRow = sorted.find((r) => r.key === 'reviews')
  const portfolioRow = sorted.find((r) => r.key === 'portfolio')
  const reviewsInSub = Boolean(aboutOn && reviewsRow && reviewsRow.enabled)
  const portfolioInSub = Boolean(aboutOn && portfolioRow && portfolioRow.enabled && options.portfolioEnabled)

  const out: MainNavItem[] = []
  for (const row of sorted) {
    if (!row.enabled) continue
    if (row.key === 'portfolio' && !options.portfolioEnabled) continue
    if (row.key === 'reviews' && reviewsInSub) continue
    if (row.key === 'portfolio' && portfolioInSub) continue

    if (row.key === 'about') {
      const label = row.label.trim() || defaultLabelForKey('about', ui)
      const aboutCompanyLabel = (ui?.navAboutCompany ?? 'О компании').trim() || 'О компании'
      const children: MainNavChild[] = [
        { key: 'about-company', to: aboutPath, label: aboutCompanyLabel },
      ]
      if (reviewsInSub) {
        children.push({
          key: 'reviews',
          to: PATHS.reviews,
          label: (reviewsRow?.label || '').trim() || defaultLabelForKey('reviews', ui),
        })
      }
      if (portfolioInSub) {
        children.push({
          key: 'portfolio',
          to: PATHS.portfolio,
          label: (portfolioRow?.label || '').trim() || defaultLabelForKey('portfolio', ui),
        })
      }
      if (children.length === 1) {
        children.push({
          key: 'about-contacts',
          to: PATHS.contacts,
          label: defaultLabelForKey('contacts', ui),
        })
      }
      out.push({
        key: row.key,
        to: aboutPath,
        label,
        end: false,
        children,
      })
      continue
    }

    if (row.key === 'home') {
      out.push({
        key: row.key,
        to: PATHS.home,
        label: row.label.trim() || defaultLabelForKey('home', ui),
        end: true,
      })
    } else if (row.key === 'catalog' || row.key === 'blog' || row.key === 'contacts' || row.key === 'portfolio' || row.key === 'reviews') {
      out.push({
        key: row.key,
        to: PATHS[row.key],
        label: row.label.trim() || defaultLabelForKey(row.key, ui),
        end: false,
      })
    }
  }
  const headerStatic = options.staticPages.filter((p) => p.showInHeader)
  for (const p of headerStatic) {
    out.push({
      key: `static-${p.slug}`,
      to: p.path,
      label: p.headerLinkLabel || p.title,
    })
  }
  return out
}
