import { useSiteSettings } from '../../context/SiteSettingsContext'
export function YandexMetrika() {
  const { analyticsYandex, loading } = useSiteSettings()
  if (loading || !analyticsYandex.enabled) return null
  return null
}
