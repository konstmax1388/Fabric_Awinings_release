/** Совпадает с CartOrder (backend/api/models.py) — подписи для кодов в панели staff. */

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

export const DELIVERY_METHOD_RU: Record<string, string> = {
  pickup: 'Самовывоз со склада',
  cdek: 'СДЭК (ПВЗ / курьер)',
  ozon_logistics: 'Логистика Ozon',
}

export const PAYMENT_METHOD_RU: Record<string, string> = {
  cash_pickup: 'Наличные при самовывозе',
  cod_cdek: 'Наложенный платёж (СДЭК)',
  card_online: 'Онлайн-оплата (эквайринг Ozon Pay)',
}

export const BITRIX_SYNC_STATUS_RU: Record<string, string> = {
  not_sent: 'Не отправляли в Б24',
  pending: 'Очередь / повтор',
  synced: 'В Битрикс24',
  error: 'Ошибка синхронизации',
}

export function enumLabelRu(map: Record<string, string>, code: string | null | undefined): string {
  if (code == null || code === '') return '—'
  return map[code] ?? code
}
