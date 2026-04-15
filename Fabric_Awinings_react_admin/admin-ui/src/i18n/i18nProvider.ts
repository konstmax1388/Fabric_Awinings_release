import polyglotI18nProvider from 'ra-i18n-polyglot'

import russianMessages from './russianMessages'

/** Интерфейс RA по умолчанию на русском (кнопки списка, уведомления, ошибки). */
export const i18nProvider = polyglotI18nProvider(() => russianMessages, 'ru', [
  { locale: 'ru', name: 'Русский' },
])
