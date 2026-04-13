/** Поле-приманка; совпадает с backend `api.validators.HONEYPOT_FIELD`. */
export const HONEYPOT_FIELD = 'website' as const

export function antiSpamFields(): Record<string, string> {
  return { [HONEYPOT_FIELD]: '' }
}

export const COMMENT_MAX_LEN = 4000

/** Национальные 10 цифр без кода страны. */
export function nationalDigitsFromInput(value: string): string {
  let d = value.replace(/\D/g, '')
  if (d.startsWith('8')) d = '7' + d.slice(1)
  if (d.startsWith('7')) d = d.slice(1)
  return d.slice(0, 10)
}

export function formatRuPhoneMask(national10: string): string {
  const d = national10.replace(/\D/g, '').slice(0, 10)
  if (d.length === 0) return '+7'
  let s = '+7 ('
  s += d.slice(0, 3)
  if (d.length <= 3) return s
  s += ') ' + d.slice(3, 6)
  if (d.length <= 6) return s
  s += '-' + d.slice(6, 8)
  if (d.length <= 8) return s
  s += '-' + d.slice(8, 10)
  return s
}

export function isCompleteRuPhone(value: string): boolean {
  return nationalDigitsFromInput(value).length === 10
}

/** Для отправки на API после успешной клиентской проверки. */
export function phoneForApi(value: string): string {
  const d = nationalDigitsFromInput(value)
  return d.length === 10 ? `+7${d}` : value.trim()
}

export function personNameError(name: string): string | null {
  const t = name.trim()
  if (t.length < 2) return 'Укажите имя'
  if (t.length > 120) return 'Имя слишком длинное'
  for (const ch of t) {
    if (' .\'"'.includes(ch) || ch === '-' || ch === '\u2013' || ch === '\u2014') continue
    if (/\p{L}/u.test(ch)) continue
    return 'Имя содержит недопустимые символы'
  }
  return null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Пустая строка допустима. */
export function optionalEmailError(email: string): string | null {
  const t = email.trim()
  if (!t) return null
  if (t.length > 254) return 'Email слишком длинный'
  if (!EMAIL_RE.test(t)) return 'Некорректный email'
  return null
}
