import { Helmet } from 'react-helmet-async'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSiteSettings } from '../../context/SiteSettingsContext'
import { resolveMetaDescription } from '../../lib/seoVitrine'

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const { seoDefaults } = useSiteSettings()

  if (loading) {
    const desc = resolveMetaDescription('Загрузка личного кабинета.', seoDefaults)
    return (
      <>
        <Helmet>
          <meta name="description" content={desc} />
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="flex min-h-[40vh] items-center justify-center font-body text-sm text-text-muted">
          Загрузка…
        </div>
      </>
    )
  }

  if (!user) {
    return <Navigate to="/account/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
