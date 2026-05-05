import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installChunkLoadRecovery } from './lib/chunkLoadRecovery'

void import('./fontawesome.css')

installChunkLoadRecovery()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
