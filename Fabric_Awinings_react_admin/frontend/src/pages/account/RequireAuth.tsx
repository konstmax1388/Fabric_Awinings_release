import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-body text-sm text-text-muted">
        Загрузка…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/account/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
