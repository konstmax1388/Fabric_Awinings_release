/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Полный URL API; если не задан — запросы идут на тот же origin (`/api/...`). */
  readonly VITE_API_URL?: string
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
