import { Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'

/** Публичный URL панели менеджеров на проде: …/staff/ (Django Unfold остаётся на …/admin/). */
const STAFF_APP_PREFIX = '/staff'

/**
 * Старые URL с history (/staff/orders/1/show) при F5 отдают витринный index без правки nginx.
 * Один раз переносим путь в hash: /staff/#/orders/1/show — сервер запрашивает только /staff/.
 */
function migrateStaffBrowserPathToHashIfNeeded(): string | null {
  const { pathname, search, hash } = window.location
  if (pathname === '/staff' || pathname === '/staff/') return null
  if (!pathname.startsWith(`${STAFF_APP_PREFIX}/`)) return null
  const rest = pathname.slice(`${STAFF_APP_PREFIX}/`.length)
  if (!rest) return null
  if (hash && hash !== '#' && hash.length > 1) return null
  return `${STAFF_APP_PREFIX}/#/${rest}${search}`
}

/** Показать падение рендера вместо белого экрана. */
class RootErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null }

  static getDerivedStateFromError(err: Error) {
    return { err }
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error(err, info.componentStack)
  }

  render() {
    if (this.state.err) {
      return (
        <pre
          style={{
            padding: '1rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            color: '#b00020',
          }}
        >
          {this.state.err.stack ?? String(this.state.err)}
        </pre>
      )
    }
    return this.props.children
  }
}

function staffEntryUrlIfNeeded(): string | null {
  const path = window.location.pathname
  const h = window.location.hash
  // Уже на /staff с маршрутом в hash — не сбрасываем hash редиректом на /staff/
  if ((path === '/staff' || path === '/staff/') && h.length > 1) return null
  if (path === '/' || path === '') return `${STAFF_APP_PREFIX}/`
  if (path === STAFF_APP_PREFIX) return `${STAFF_APP_PREFIX}/`
  if (!path.startsWith(`${STAFF_APP_PREFIX}/`)) return `${STAFF_APP_PREFIX}/`
  return null
}

const migrated = migrateStaffBrowserPathToHashIfNeeded()
if (migrated !== null) {
  window.location.replace(migrated)
} else {
  const entry = staffEntryUrlIfNeeded()
  if (entry !== null) {
    window.location.replace(entry + window.location.search + window.location.hash)
  } else {
    const rootEl = document.getElementById('root')
    if (!rootEl) {
      document.body.innerHTML =
        '<p style="padding:1rem">Нет элемента #root в index.html</p>'
    } else {
      void import('./App.tsx')
        .then(({ default: App }) => {
          createRoot(rootEl).render(
            <RootErrorBoundary>
              {/*
                HashRouter: при обновлении страницы nginx запрашивает только /staff/, без «глубокого» пути
                (иначе нужен отдельный location в nginx). basename — у <Admin> не дублировать.
                StrictMode отключён: в dev он удваивал эффекты и визуально путал (двойной layout в инспекторе).
              */}
              <HashRouter basename="/staff">
                <App />
              </HashRouter>
            </RootErrorBoundary>,
          )
        })
        .catch((err: unknown) => {
          console.error(err)
          const el = document.getElementById('root')
          if (el) {
            el.innerHTML = `<pre style="padding:1rem;font-family:monospace;white-space:pre-wrap">Ошибка загрузки панели: ${String(err)}</pre>`
          }
        })
    }
  }
}
