import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = (
    env.VITE_PROXY_TARGET ||
    env.VITE_API_ORIGIN ||
    'http://127.0.0.1:18100'
  ).replace(/\/$/, '')

  // В Docker нет xdg-open — open: true даёт spawn ENOENT и шум в логах; локально можно открыть URL вручную.
  const openBrowser =
    process.env.DOCKER === 'true' ||
    process.env.CI === 'true' ||
    process.env.BROWSER === 'none'
      ? false
      : '/staff/'

  return {
    base: '/staff/',
    plugins: [
      react(),
      {
        name: 'redirect-dev-root-to-staff',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const pathOnly = (req.url ?? '').split('?')[0]
            if (pathOnly === '/' || pathOnly === '') {
              res.statusCode = 302
              res.setHeader('Location', '/staff/')
              res.end()
              return
            }
            if (pathOnly === '/staff') {
              res.statusCode = 302
              res.setHeader('Location', '/staff/')
              res.end()
              return
            }
            next()
          })
        },
      },
    ],
    server: {
      host: '0.0.0.0',
      port: 17401,
      strictPort: true,
      open: openBrowser,
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
