export type CartLine = {
  /** Уникальная строка корзины: товар + опционально вариант */
  lineId: string
  productId: string
  variantId?: string
  slug: string
  title: string
  priceFrom: number
  /** База до акции, ₽ (для отображения; суммы считаются по priceFrom). */
  priceList?: number
  image: string
  qty: number
  /** SKU в Ozon для createOrder при доставке Ozon Логистика (если не задан в админке у товара) */
  ozonSku?: number
  cdekWeightGrams?: number | null
  cdekLengthCm?: number | null
  cdekWidthCm?: number | null
  cdekHeightCm?: number | null
}
