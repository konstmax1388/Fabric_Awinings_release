import { staffApiUrl } from '../lib/apiBase'

type Json = Record<string, unknown>

function formatStaffErrorMessage(data: Json, status: number): string {
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.non_field_errors) && typeof data.non_field_errors[0] === 'string') {
    return data.non_field_errors[0]
  }
  const fieldParts: string[] = []
  for (const [k, v] of Object.entries(data)) {
    if (k === 'detail' || k === 'non_field_errors') continue
    if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
      fieldParts.push(`${k}: ${(v as string[]).join('; ')}`)
    } else if (typeof v === 'string') {
      fieldParts.push(`${k}: ${v}`)
    }
  }
  if (fieldParts.length) return fieldParts.join('\n')
  return `HTTP ${status}`
}

async function tryRefresh(): Promise<boolean> {
  const refresh = localStorage.getItem('staff_refresh')
  if (!refresh) return false
  const r = await fetch(staffApiUrl('/api/staff/v1/auth/token/refresh/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh }),
  })
  if (!r.ok) return false
  const data = (await r.json()) as { access?: string }
  if (data.access) {
    localStorage.setItem('staff_access', data.access)
    return true
  }
  return false
}

/** JSON fetch с Bearer и одним повтором после refresh при 401. */
export async function staffFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  const token = localStorage.getItem('staff_access')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res = await fetch(input, { ...init, headers })
  if (res.status === 401) {
    const ok = await tryRefresh()
    if (ok) {
      const h2 = new Headers(init.headers)
      h2.set('Accept', 'application/json')
      const t2 = localStorage.getItem('staff_access')
      if (t2) h2.set('Authorization', `Bearer ${t2}`)
      res = await fetch(input, { ...init, headers: h2 })
    }
  }
  return res
}

export async function staffFetchJson(input: string, init: RequestInit = {}): Promise<Json> {
  const res = await staffFetch(input, init)
  const text = await res.text()
  let data: Json = {}
  if (text) {
    try {
      data = JSON.parse(text) as Json
    } catch {
      data = {}
    }
  }
  if (!res.ok) {
    const msg = formatStaffErrorMessage(data, res.status)
    const err = new Error(msg) as Error & { status: number; body?: Json }
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}
