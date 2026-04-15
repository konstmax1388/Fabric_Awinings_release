/** Совпадает с витриной: frontend/src/index.css, docs/design.md */

export const BRAND = {
  bgBase: '#FEFBF5',
  accent: '#E87A00',
  accentDark: '#C26200',
  accentLight: '#F59E2B',
  green: '#2D5A27',
  greenDark: '#1f3f1b',
  text: '#1A1A1A',
  textMuted: '#666666',
  textSubtle: '#999999',
  surface: '#FFFFFF',
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
} as const

/** Публичный файл из `admin-ui/public/branding/logo.svg` (Vite base `/staff/`). */
export function brandLogoUrl(): string {
  const base = import.meta.env.BASE_URL
  return `${base}branding/logo.svg`
}
