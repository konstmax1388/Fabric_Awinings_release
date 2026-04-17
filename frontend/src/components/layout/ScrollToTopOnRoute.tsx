import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * В SPA при смене маршрута браузер не перезагружает страницу — без этого новый экран
 * открывается с той же прокруткой, что и предыдущий (часто "с середины").
 */
export function ScrollToTopOnRoute() {
  const { pathname, search } = useLocation()

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname, search])

  return null
}
