import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  /** Прокси админки Django: в Docker — `http://api:8000`, локально — тот же хост, что и API */
  const proxyTarget =
    (env.VITE_PROXY_TARGET || env.VITE_API_URL || 'http://127.0.0.1:18000').replace(/\/$/, '')

  return {
    plugins: [react(), tailwindcss()],
    build: {
      chunkSizeWarningLimit: 500,
    },
    server: {
      host: '0.0.0.0',
      /** Как на хосте в Docker (`FABRIC_FRONTEND_PORT` → 17300), чтобы не путать с другим проектом на 5173 */
      port: 17300,
      strictPort: true,
      watch: {
        usePolling: true,
        interval: 200,
      },
      proxy: {
        // Публичное API (каталог, настройки) — как на проде за обратным прокси
        '/api': { target: proxyTarget, changeOrigin: true },
        // Django Admin и статика — с того же origin, что и сайт (иначе 17300 отдаёт SPA 404)
        '/admin': { target: proxyTarget, changeOrigin: true },
        // Картинка капчи на /admin/login (django-simple-captcha)
        '/captcha': { target: proxyTarget, changeOrigin: true },
        '/static': { target: proxyTarget, changeOrigin: true },
        // Загруженные в админке фото товаров (ImageField → MEDIA_URL)
        '/media': { target: proxyTarget, changeOrigin: true },
        '/sitemap.xml': { target: proxyTarget, changeOrigin: true },
      },
    },
  }
})
