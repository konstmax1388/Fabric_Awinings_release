const base = () =>
  (import.meta.env.VITE_API_URL ?? 'http://localhost:18000').replace(/\/$/, '')

export async function fetchHealth(): Promise<{
  status: string
  service: string
  time: string
} | null> {
  try {
    const r = await fetch(`${base()}/api/health/`)
    if (!r.ok) return null
    return r.json()
  } catch {
    return null
  }
}
