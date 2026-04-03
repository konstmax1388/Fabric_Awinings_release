import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    /** Как на хосте в Docker (`FABRIC_FRONTEND_PORT` → 17300), чтобы не путать с другим проектом на 5173 */
    port: 17300,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 200,
    },
  },
})
