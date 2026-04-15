import { useContext } from 'react'
import { CartContext, type CartContextValue } from '../cart/cartContext'

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart: оберните приложение в <CartProvider>')
  return ctx
}
