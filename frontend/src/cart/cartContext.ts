import { createContext } from 'react'
import type { CartLine } from './cartTypes'
import type { Product } from '../data/products'

export type CartContextValue = {
  items: CartLine[]
  addProduct: (product: Product, qty?: number) => void
  removeLine: (productId: string) => void
  setQty: (productId: string, qty: number) => void
  clear: () => void
  totalQty: number
  totalApprox: number
}

export const CartContext = createContext<CartContextValue | null>(null)
