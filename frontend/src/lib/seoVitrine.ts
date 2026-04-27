import type { SeoDefaultsDto } from './api'

export type SeoTitleTemplateKey = 'home' | 'listing' | 'static' | 'article' | 'emdash'

const DEFAULT_FALLBACK: Record<SeoTitleTemplateKey, string> = {
  home: '',
  listing: '{title}{suffix}',
  static: '{title} — {siteName}',
  article: '{title}{suffix}',
  emdash: '{title} — {siteName}',
}

/**
 * Собирает <title> по шаблону из настроек (как в крупных CMS: плейсхолдеры + суффикс).
 * home с пустым шаблоном: как раньше — baseTitle + суффикс из настроек.
 */
export function buildSeoTitle(
  key: SeoTitleTemplateKey,
  parts: { title: string; siteName: string },
  seo: SeoDefaultsDto,
): string {
  const suffix = seo.titleSuffix?.trim() ? ` ${seo.titleSuffix}` : ''
  const sep = (seo.titleSeparator || ' | ').trim() || ' | '

  if (key === 'home') {
    const custom = typeof seo.titleTemplates?.home === 'string' ? seo.titleTemplates.home.trim() : ''
    if (!custom) {
      return `${parts.title}${suffix}`
    }
  }

  const tRaw = seo.titleTemplates?.[key]
  const useTpl =
    (typeof tRaw === 'string' && tRaw.trim() ? tRaw.trim() : null) ?? (DEFAULT_FALLBACK[key] || '{title}{suffix}')

  return useTpl
    .replace(/{title}/g, parts.title)
    .replace(/{siteName}/g, parts.siteName)
    .replace(/{suffix}/g, suffix)
    .replace(/{sep}/g, sep)
}

/** Полный title у статичной страницы: кастомный meta title или шаблон static. */
export function resolveStaticPageDocumentTitle(
  page: { title: string; pageTitle?: string | null },
  siteName: string,
  seo: SeoDefaultsDto,
): string {
  const doc = (page.pageTitle && String(page.pageTitle).trim()) || ''
  if (doc) return doc
  return buildSeoTitle('static', { title: page.title, siteName }, seo)
}

export function truncateMetaDescription(text: string, maxLen: number | undefined, seo: SeoDefaultsDto): string {
  const m =
    typeof maxLen === 'number' && maxLen > 0 ? maxLen : (typeof seo.metaDescriptionMaxLength === 'number' && seo.metaDescriptionMaxLength > 0 ? seo.metaDescriptionMaxLength : 160)
  const t = (text || '').replace(/\s+/g, ' ').trim()
  if (t.length <= m) return t
  return `${t.slice(0, m - 1).trimEnd()}…`
}
