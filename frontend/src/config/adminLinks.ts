/**
 * Ссылки на вход в панели из футера витрины.
 *
 * Явные URL (полный origin + путь или только origin) — через .env перед сборкой:
 *   VITE_PUBLIC_REACT_ADMIN_URL=https://site.ru/staff/
 *   VITE_PUBLIC_DJANGO_ADMIN_URL=https://site.ru/admin/
 *
 * Если не заданы, на production берётся `window.location.origin` + `/staff` и `/admin`
 * (та же схема, что и у nginx: витрина, `/staff/`, `/admin/`).
 */
function trimBase(s: string | undefined): string {
  return (s ?? '').trim().replace(/\/+$/, '')
}

/** React-админка: …/staff без дубля …/staff/staff */
export function ensureReactStaffEntryUrl(base: string): string {
  const b = trimBase(base)
  if (!b) return ''
  if (b.endsWith('/staff')) return b
  return `${b}/staff`
}

/** Классическая Django Admin: …/admin */
export function ensureDjangoAdminEntryUrl(base: string): string {
  const b = trimBase(base)
  if (!b) return ''
  if (b.endsWith('/admin')) return b
  return `${b}/admin`
}

export type PublicAdminLinks = {
  reactAdminUrl: string | null
  djangoAdminUrl: string | null
}

export function getPublicAdminLinks(): PublicAdminLinks {
  const reactRaw = trimBase(import.meta.env.VITE_PUBLIC_REACT_ADMIN_URL)
  const djangoRaw = trimBase(import.meta.env.VITE_PUBLIC_DJANGO_ADMIN_URL)

  if (import.meta.env.DEV) {
    return {
      reactAdminUrl: reactRaw ? ensureReactStaffEntryUrl(reactRaw) : 'http://localhost:17401/staff',
      djangoAdminUrl: djangoRaw ? ensureDjangoAdminEntryUrl(djangoRaw) : 'http://localhost:18000/admin',
    }
  }

  const origin =
    typeof window !== 'undefined' && window.location?.origin ? trimBase(window.location.origin) : ''

  return {
    reactAdminUrl: reactRaw ? ensureReactStaffEntryUrl(reactRaw) : origin ? ensureReactStaffEntryUrl(origin) : null,
    djangoAdminUrl: djangoRaw ? ensureDjangoAdminEntryUrl(djangoRaw) : origin ? ensureDjangoAdminEntryUrl(origin) : null,
  }
}
