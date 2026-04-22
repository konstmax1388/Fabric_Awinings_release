import { fetchCurrentPolicyVersion, postConsentLog } from './api'

export const CONSENT_STORAGE_KEY = 'fabrika_consent'
export const CONSENT_FALLBACK_POLICY_VERSION = '2026-04-22'

export type StoredConsent = {
  consent: boolean
  timestamp: string
  expiresAt: string
  policyVersion: string
}

let cachedPolicyVersion: string | null = null

function addMonths(ts: Date, months: number): Date {
  const out = new Date(ts.getTime())
  out.setMonth(out.getMonth() + months)
  return out
}

function safeLocalStorageGet(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  } catch {
    // no-op
  }
}

function safeCookieSet(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return
  const maxAge = Math.max(1, Math.floor(days * 24 * 60 * 60))
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function safeCookieGet(name: string): string | null {
  if (typeof document === 'undefined') return null
  const safe = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')
  const m = document.cookie.match(new RegExp(`(?:^|; )${safe}=([^;]*)`))
  return m ? decodeURIComponent(m[1].trim()) : null
}

export function readStoredConsent(): StoredConsent | null {
  const raw = safeLocalStorageGet(CONSENT_STORAGE_KEY) || safeCookieGet(CONSENT_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<StoredConsent>
    if (
      typeof parsed.consent !== 'boolean' ||
      typeof parsed.timestamp !== 'string' ||
      typeof parsed.expiresAt !== 'string' ||
      typeof parsed.policyVersion !== 'string'
    ) {
      return null
    }
    return {
      consent: parsed.consent,
      timestamp: parsed.timestamp,
      expiresAt: parsed.expiresAt,
      policyVersion: parsed.policyVersion,
    }
  } catch {
    return null
  }
}

export function hasValidConsent(currentPolicyVersion: string): boolean {
  const stored = readStoredConsent()
  if (!stored || stored.consent !== true) return false
  if (stored.policyVersion !== currentPolicyVersion) return false
  const expiresAtTs = Date.parse(stored.expiresAt)
  if (!Number.isFinite(expiresAtTs)) return false
  return Date.now() <= expiresAtTs
}

export async function getCurrentPolicyVersion(): Promise<string> {
  if (cachedPolicyVersion) return cachedPolicyVersion
  const apiVersion = await fetchCurrentPolicyVersion()
  cachedPolicyVersion = apiVersion || CONSENT_FALLBACK_POLICY_VERSION
  return cachedPolicyVersion
}

export async function persistConsent(consent: boolean, policyVersion: string): Promise<StoredConsent> {
  const now = new Date()
  const stored: StoredConsent = {
    consent,
    timestamp: now.toISOString(),
    expiresAt: addMonths(now, 12).toISOString(),
    policyVersion,
  }
  const raw = JSON.stringify(stored)
  safeLocalStorageSet(CONSENT_STORAGE_KEY, raw)
  safeCookieSet(CONSENT_STORAGE_KEY, raw, 365)
  return stored
}

export async function trackConsentServer(consent: boolean, policyVersion: string): Promise<void> {
  const ts = new Date().toISOString()
  const url = typeof window === 'undefined' ? '/' : window.location.href
  void postConsentLog({
    consent,
    timestamp: ts,
    policy_version: policyVersion,
    url: url.slice(0, 500),
  })
}

export function trackConsentAnalytics(eventName: 'consent_accept' | 'consent_decline'): void {
  if (typeof window === 'undefined') return
  const ym = (window as unknown as { ym?: (...args: unknown[]) => void }).ym
  if (typeof ym === 'function') {
    try {
      ym(undefined, 'reachGoal', eventName)
    } catch {
      // no-op
    }
  }
}
