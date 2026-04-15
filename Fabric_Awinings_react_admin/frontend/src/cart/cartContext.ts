import { createContext } from 'react'
import type { CartLine } from './cartTypes'
import type { Product, ProductVariantRow } from '../data/products'

export type CartContextValue = {
  items: CartLine[]
  addProduct: (product: Product, qty?: number, variant?: ProductVariantRow) => void
  /** Строки заказа с сайта (как в API) → в корзину; совпадающие позиции суммируются по количеству. */
  mergeLinesFromOrder: (rawLines: unknown[]) => number
  removeLine: (lineId: string) => void
  setQty: (lineId: string, qty: number) => void
  clear: () => void
  totalQty: number
  totalApprox: number
}

export const CartContext = createContext<CartContextValue | null>(null)
