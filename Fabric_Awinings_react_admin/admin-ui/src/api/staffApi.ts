/**
 * Прямые вызовы Staff API (actions, singleton-секции, reorder).
 */
import { staffApiUrl } from '../lib/apiBase'
import { staffFetchJson } from '../providers/httpStaff'

export async function reorderProductVariants(productId: string, orderedIds: string[]) {
  const url = staffApiUrl(
    `/api/staff/v1/products/${encodeURIComponent(productId)}/reorder-variants/`,
  )
  return staffFetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  })
}

export async function reorderProductImages(productId: string, orderedIds: string[]) {
  const url = staffApiUrl(
    `/api/staff/v1/products/${encodeURIComponent(productId)}/reorder-images/`,
  )
  return staffFetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  })
}

export async function fetchSiteSettingsCurrent() {
  return staffFetchJson(staffApiUrl('/api/staff/v1/site-settings/current/'))
}

export async function patchSiteSettingsCurrent(body: Record<string, unknown>) {
  return staffFetchJson(staffApiUrl('/api/staff/v1/site-settings/current/'), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function fetchSiteSettingsSection(slug: string) {
  return staffFetchJson(
    staffApiUrl(`/api/staff/v1/site-settings/sections/${encodeURIComponent(slug)}/`),
  )
}

export async function patchSiteSettingsSection(slug: string, body: Record<string, unknown>) {
  return staffFetchJson(
    staffApiUrl(`/api/staff/v1/site-settings/sections/${encodeURIComponent(slug)}/`),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
}

export async function fetchHomeContentCurrent() {
  return staffFetchJson(staffApiUrl('/api/staff/v1/home-content/current/'))
}

export async function fetchHomeSection(slug: string) {
  return staffFetchJson(
    staffApiUrl(`/api/staff/v1/home-content/sections/${encodeURIComponent(slug)}/`),
  )
}

export async function patchHomeSection(slug: string, body: Record<string, unknown>) {
  return staffFetchJson(
    staffApiUrl(`/api/staff/v1/home-content/sections/${encodeURIComponent(slug)}/`),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
}

export type WbImportRow = { url: string; ok: boolean; message: string; productId: string | null }

export async function postWbImport(body: {
  urls: string[]
  categoryId: number
  publish: boolean
  dryRun: boolean
}) {
  return staffFetchJson(staffApiUrl('/api/staff/v1/actions/wb-import/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as Promise<{ results: WbImportRow[] }>
}

export async function postSmtpTest(body: { toEmail?: string }) {
  return staffFetchJson(staffApiUrl('/api/staff/v1/actions/smtp-test/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as Promise<{ ok: boolean; detail: string }>
}

export async function postBitrix24WebhookTest() {
  return staffFetchJson(staffApiUrl('/api/staff/v1/actions/bitrix24-webhook-test/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }) as Promise<{ results: unknown }>
}

export async function postBitrix24CatalogSync(body: {
  dryRun: boolean
  force: boolean
  skipVariants: boolean
  skipProducts: boolean
  noProducts: boolean
  noOffers: boolean
  timeoutSec: number
}) {
  return staffFetchJson(staffApiUrl('/api/staff/v1/actions/bitrix24-catalog-sync/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as Promise<{ summary: Record<string, unknown> }>
}

export async function postOzonPayTest() {
  return staffFetchJson(staffApiUrl('/api/staff/v1/actions/ozon-pay-test/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }) as Promise<{ ok: boolean; detail: string; payLink: string | null; raw: string | null }>
}
