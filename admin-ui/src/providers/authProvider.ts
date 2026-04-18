import type { AuthProvider } from 'react-admin'

import { staffApiUrl } from '../lib/apiBase'

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const r = await fetch(staffApiUrl('/api/staff/v1/auth/token/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (r.status === 429) {
      throw new Error('Слишком много попыток входа. Подождите и попробуйте снова.')
    }
    if (!r.ok) {
      throw new Error('Неверные учётные данные или нет прав staff.')
    }
    const data = (await r.json()) as { access: string; refresh: string }
    localStorage.setItem('staff_access', data.access)
    localStorage.setItem('staff_refresh', data.refresh)
  },
  logout: () => {
    localStorage.removeItem('staff_access')
    localStorage.removeItem('staff_refresh')
    return Promise.resolve()
  },
  checkError: (error: unknown) => {
    let status = 0
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const s = (error as { status: unknown }).status
      status = typeof s === 'number' ? s : Number(s) || 0
    }
    if (status === 401 || status === 403) {
      localStorage.removeItem('staff_access')
      localStorage.removeItem('staff_refresh')
      return Promise.reject()
    }
    return Promise.resolve()
  },
  checkAuth: () =>
    localStorage.getItem('staff_access') ? Promise.resolve() : Promise.reject(),
  getPermissions: () => Promise.resolve(undefined),
}
