import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const ADMIN_PREFIX = '/admin'

function adminEntryUrlIfNeeded(): string | null {
  const path = window.location.pathname
  if (path === '/' || path === '') return `${ADMIN_PREFIX}/`
  if (path === ADMIN_PREFIX) return `${ADMIN_PREFIX}/`
  if (!path.startsWith(`${ADMIN_PREFIX}/`)) return `${ADMIN_PREFIX}/`
  return null
}

const entry = adminEntryUrlIfNeeded()
if (entry !== null) {
  window.location.replace(entry + window.location.search + window.location.hash)
} else {
  void import('./App.tsx').then(({ default: App }) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
}
