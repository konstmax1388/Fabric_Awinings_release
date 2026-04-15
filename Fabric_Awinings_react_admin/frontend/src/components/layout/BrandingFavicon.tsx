import { useEffect } from 'react'
import { useSiteSettings } from '../../context/SiteSettingsContext'

/** Подставляет фавикон из API (или /branding/favicon.ico). */
export function BrandingFavicon() {
  const { faviconUrl } = useSiteSettings()

  useEffect(() => {
    const href = faviconUrl || '/branding/favicon.ico'
    let el = document.querySelector<HTMLLinkElement>("link[rel='icon']")
    if (!el) {
      el = document.createElement('link')
      el.rel = 'icon'
      document.head.appendChild(el)
    }
    el.href = href
    if (href.endsWith('.ico')) el.type = 'image/x-icon'
    else if (href.endsWith('.svg')) el.type = 'image/svg+xml'
    else if (href.endsWith('.png')) el.type = 'image/png'
    else el.removeAttribute('type')
  }, [faviconUrl])

  return null
}
