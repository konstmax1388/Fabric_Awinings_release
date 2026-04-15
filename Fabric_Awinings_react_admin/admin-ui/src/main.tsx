import { Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'

/** Публичный URL панели менеджеров на проде: …/staff/ (Django Unfold остаётся на …/admin/). */
const STAFF_APP_PREFIX = '/staff'

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
  if (path === '/' || path === '') return `${STAFF_APP_PREFIX}/`
  if (path === STAFF_APP_PREFIX) return `${STAFF_APP_PREFIX}/`
  if (!path.startsWith(`${STAFF_APP_PREFIX}/`)) return `${STAFF_APP_PREFIX}/`
  return null
}

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
              Без внешнего BrowserRouter react-admin поднимает HashRouter (createHashRouter).
              basename только здесь — у <Admin> не дублировать (иначе /staff/staff/login).
              StrictMode отключён: в dev он удваивал эффекты и визуально путал (двойной layout в инспекторе).
            */}
            <BrowserRouter basename="/staff">
              <App />
            </BrowserRouter>
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
