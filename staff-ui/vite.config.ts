import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = (env.VITE_API_ORIGIN || 'http://127.0.0.1:18000').replace(/\/$/, '')

  return {
    base: '/staff/',
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 17301,
      strictPort: true,
      /** Удобный старт: открыть сразу панель, а не корень без /staff/ */
      open: '/staff/',
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true },
        '/media': { target: proxyTarget, changeOrigin: true },
        '/static': { target: proxyTarget, changeOrigin: true },
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
    },
  }
})
