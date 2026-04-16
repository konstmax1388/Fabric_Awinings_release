/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SITE_URL?: string
  /** Полный URL или origin панели менеджеров (/staff/); на проде можно не задавать — возьмётся текущий сайт. */
  readonly VITE_PUBLIC_REACT_ADMIN_URL?: string
  /** Полный URL или origin Django Admin (/admin/); на проде можно не задавать — возьмётся текущий сайт. */
  readonly VITE_PUBLIC_DJANGO_ADMIN_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
