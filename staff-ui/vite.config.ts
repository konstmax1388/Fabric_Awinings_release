import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = (
    env.VITE_PROXY_TARGET ||
    env.VITE_API_ORIGIN ||
    'http://127.0.0.1:18000'
  ).replace(/\/$/, '')

  return {
    base: '/admin/',
    plugins: [
      react(),
      {
        name: 'redirect-dev-root-to-admin',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const pathOnly = (req.url ?? '').split('?')[0]
            if (pathOnly === '/' || pathOnly === '') {
              res.statusCode = 302
              res.setHeader('Location', '/admin/')
              res.end()
              return
            }
            if (pathOnly === '/admin') {
              res.statusCode = 302
              res.setHeader('Location', '/admin/')
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
      port: 17301,
      strictPort: true,
      open: '/admin/',
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
