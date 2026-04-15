import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUserDto } from '../lib/api'
import { fetchAuthMe, postLogin, postRefreshToken, postRegister } from '../lib/api'

const LS_ACCESS = 'fabric_awnings_access'
const LS_REFRESH = 'fabric_awnings_refresh'

type AuthContextValue = {
  user: AuthUserDto | null
  accessToken: string | null
  loading: boolean
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; passwordChangeBlocking?: boolean }>
  register: (p: {
    email: string
    password: string
    firstName?: string
    lastName?: string
    phone?: string
  }) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserDto | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(LS_ACCESS))
  const [loading, setLoading] = useState(true)

  const applyTokens = useCallback((access: string, refresh: string) => {
    localStorage.setItem(LS_ACCESS, access)
    localStorage.setItem(LS_REFRESH, refresh)
    setAccessToken(access)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(LS_ACCESS)
    localStorage.removeItem(LS_REFRESH)
    setAccessToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(LS_ACCESS)
    if (!token) {
      setUser(null)
      return
    }
    let me = await fetchAuthMe(token)
    if (!me) {
      const refr = localStorage.getItem(LS_REFRESH)
      if (refr) {
        const next = await postRefreshToken(refr)
        if (next?.access) {
          localStorage.setItem(LS_ACCESS, next.access)
          setAccessToken(next.access)
          me = await fetchAuthMe(next.access)
        }
      }
    }
    if (!me) logout()
    else setUser(me)
  }, [logout])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await postLogin(email, password)
      if (!data?.access || !data.refresh) return { ok: false, error: 'Неверный email или пароль' }
      applyTokens(data.access, data.refresh)
      const me = await fetchAuthMe(data.access)
      if (!me) {
        logout()
        return { ok: false, error: 'Не удалось загрузить профиль' }
      }
      setUser(me)
      return { ok: true, passwordChangeBlocking: Boolean(me.passwordChangeBlocking) }
    },
    [applyTokens, logout],
  )

  const register = useCallback(
    async (p: {
      email: string
      password: string
      firstName?: string
      lastName?: string
      phone?: string
    }) => {
      const data = await postRegister(p)
      if (!data?.access || !data.refresh) return { ok: false, error: 'Не удалось зарегистрироваться' }
      applyTokens(data.access, data.refresh)
      setUser(data.user)
      return { ok: true }
    },
    [applyTokens],
  )

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, accessToken, loading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth: оберните приложение в AuthProvider')
  return ctx
}
