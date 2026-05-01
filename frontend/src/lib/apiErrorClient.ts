/** Сообщения об ошибках API для показа посетителю (без HTML и «сырых» JSON-страниц). */

const ORDER_FALLBACK = 'Не удалось отправить заказ. Проверьте данные или свяжитесь с нами по телефону.'

export function sanitizeClientApiErrorMessage(raw: string, fallback: string = ORDER_FALLBACK): string {
  const t = (raw || '').trim()
  if (!t) return fallback
  if (t.length > 2000) return fallback
  const lower = t.slice(0, 64).toLowerCase()
  if (lower.startsWith('<!doctype') || lower.startsWith('<html')) return fallback
  if (t.startsWith('{') && t.includes('"') && t.length > 120) return fallback
  return t
}
