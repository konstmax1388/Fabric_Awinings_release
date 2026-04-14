export type CartLine = {
  /** Уникальная строка корзины: товар + опционально вариант */
  lineId: string
  productId: string
  variantId?: string
  slug: string
  title: string
  priceFrom: number
  image: string
  qty: number
  /** SKU в Ozon для createOrder при доставке Ozon Логистика (если не задан в админке у товара) */
  ozonSku?: number
}
