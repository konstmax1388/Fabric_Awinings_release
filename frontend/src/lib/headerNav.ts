import type { HomePayload } from '../types/homePage'
import type { StaticPageDto } from './api'

export type HeaderNavKey = 'home' | 'catalog' | 'portfolio' | 'blog' | 'reviews' | 'contacts'

export type HeaderNavRow = {
  key: HeaderNavKey
  enabled: boolean
  order: number
  label: string
}

const PATHS: Record<HeaderNavKey, string> = {
  home: '/',
  catalog: '/catalog',
  portfolio: '/portfolio',
  blog: '/blog',
  reviews: '/reviews',
  contacts: '/contacts',
}

function defaultLabelForKey(key: HeaderNavKey, ui: HomePayload['ui'] | undefined): string {
  const u = ui
  switch (key) {
    case 'home':
      return u?.navHome ?? 'Главная'
    case 'catalog':
      return u?.navCatalog ?? 'Каталог'
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

export type MainNavItem = {
  key: string
  to: string
  label: string
  end?: boolean
}

/**
 * Пункты верхнего и мобильного меню: JSON из настроек + подписи из home.ui + статические страницы в шапке.
 */
export function buildMainNavItems(
  headerNavigation: unknown,
  ui: HomePayload['ui'] | undefined,
  options: { portfolioEnabled: boolean; staticPages: StaticPageDto[] },
): MainNavItem[] {
  const rows = parseRows(headerNavigation)
  const sorted = rows
    ? [...rows].sort((a, b) => a.order - b.order || a.key.localeCompare(b.key))
    : [
        { key: 'home' as const, enabled: true, order: 0, label: '' },
        { key: 'catalog' as const, enabled: true, order: 1, label: '' },
        { key: 'portfolio' as const, enabled: true, order: 2, label: '' },
        { key: 'reviews' as const, enabled: true, order: 3, label: '' },
        { key: 'blog' as const, enabled: true, order: 4, label: '' },
        { key: 'contacts' as const, enabled: true, order: 5, label: '' },
      ]
  const out: MainNavItem[] = []
  for (const row of sorted) {
    if (!row.enabled) continue
    if (row.key === 'portfolio' && !options.portfolioEnabled) continue
    const label = row.label.trim() || defaultLabelForKey(row.key, ui)
    out.push({
      key: row.key,
      to: PATHS[row.key],
      label,
      end: row.key === 'home',
    })
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
