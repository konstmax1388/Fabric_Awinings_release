/** Запасной iframe, если поле карты пустое. */
export const YANDEX_MAP_IFRAME_FALLBACK =
  'https://yandex.ru/map-widget/v1/?ll=37.620393%2C55.753960&z=16&pt=37.620393%2C55.753960%2Cpm2rdm'

function decodeBasicHtmlEntities(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

/**
 * Из полного кода встраивания или строки URL возвращает URL скрипта конструктора api-maps…/constructor/…
 */
export function extractYandexConstructorScriptUrl(input: string): string | null {
  const t = input.trim()
  if (!t) return null
  if (t.includes('<script')) {
    const m = t.match(/\ssrc\s*=\s*["']([^"']+)["']/i)
    if (m?.[1]?.includes('api-maps.yandex.ru/services/constructor')) {
      return decodeBasicHtmlEntities(m[1])
    }
  }
  const decoded = decodeBasicHtmlEntities(t)
  if (decoded.startsWith('https://api-maps.yandex.ru/services/constructor')) {
    return decoded
  }
  return null
}

export type MapEmbed =
  | { kind: 'constructor'; scriptSrc: string }
  | { kind: 'iframe'; src: string }

/** Распознаёт конструктор Яндекса (script) или обычный URL для iframe. */
export function parseMapEmbed(raw: string | undefined): MapEmbed {
  const trimmed = (raw ?? '').trim()
  const constructorUrl = extractYandexConstructorScriptUrl(trimmed)
  if (constructorUrl) {
    return { kind: 'constructor', scriptSrc: constructorUrl }
  }
  return { kind: 'iframe', src: trimmed || YANDEX_MAP_IFRAME_FALLBACK }
}

/** Высота из параметра height=… в URL конструктора (игнорируем 100% и нечисловые). */
export function constructorMapHeightPx(scriptSrc: string): number | undefined {
  try {
    const u = new URL(scriptSrc)
    const h = u.searchParams.get('height')
    if (!h || h.includes('%')) return undefined
    const n = Number.parseInt(h, 10)
    return Number.isFinite(n) && n > 0 ? n : undefined
  } catch {
    return undefined
  }
}
