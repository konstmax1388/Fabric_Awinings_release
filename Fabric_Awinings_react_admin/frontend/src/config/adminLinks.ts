/**
 * Ссылки на вход в панели из футера витрины.
 * В production задайте в .env перед сборкой (полный URL, можно с завершающим /):
 *   VITE_PUBLIC_REACT_ADMIN_URL=https://…/staff/
 *   VITE_PUBLIC_DJANGO_ADMIN_URL=https://…/admin/
 * Либо только origin: https://site.com — тогда к React добавится /staff, к Django — /admin.
 *
 * На проде типичная схема: React (менеджеры) — путь /staff/, классическая Django Admin — /admin/ на том же или другом хосте.
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
      djangoAdminUrl: djangoRaw ? ensureDjangoAdminEntryUrl(djangoRaw) : 'http://localhost:18100/admin',
    }
  }

  return {
    reactAdminUrl: reactRaw ? ensureReactStaffEntryUrl(reactRaw) : null,
    djangoAdminUrl: djangoRaw ? ensureDjangoAdminEntryUrl(djangoRaw) : null,
  }
}
