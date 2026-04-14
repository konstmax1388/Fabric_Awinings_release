/** Запасной маппинг, если API без localized-полей (старый бэкенд). Совпадает с CartOrder в Django. */
export const FULFILLMENT_STATUS_RU: Record<string, string> = {
  received: 'Принят с сайта',
  awaiting_payment: 'Ожидает оплаты',
  paid: 'Оплачен',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
}

export const PAYMENT_STATUS_RU: Record<string, string> = {
  not_required: 'Оплата не требовалась',
  pending: 'Ожидает оплаты',
  authorized: 'Предавторизация',
  captured: 'Оплачен',
  failed: 'Ошибка оплаты',
  refunded: 'Возврат',
}

export function fulfillmentLabel(code: string, apiLabel?: string): string {
  const fromApi = (apiLabel ?? '').trim()
  if (fromApi) return fromApi
  return FULFILLMENT_STATUS_RU[code] ?? code
}

export function paymentLabel(code: string, apiLabel?: string): string {
  const fromApi = (apiLabel ?? '').trim()
  if (fromApi) return fromApi
  return PAYMENT_STATUS_RU[code] ?? code
}
