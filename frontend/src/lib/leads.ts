import type { CartLine } from '../cart/cartTypes'
import { postCalculatorLead, postCartOrder } from './api'

export type CalculatorLeadPayload = {
  name: string
  phone: string
  comment?: string
  lengthM: number
  widthM: number
  materialId: string
  materialLabel: string
  options: string[]
  estimatedPriceRub: number
}

export async function submitCalculatorLead(payload: CalculatorLeadPayload): Promise<{ ok: boolean }> {
  const ok = await postCalculatorLead({
    name: payload.name,
    phone: payload.phone,
    comment: payload.comment ?? '',
    lengthM: payload.lengthM,
    widthM: payload.widthM,
    materialId: payload.materialId,
    materialLabel: payload.materialLabel,
    options: payload.options,
    estimatedPriceRub: payload.estimatedPriceRub,
  })
  return { ok }
}

export type CartOrderCustomer = {
  name: string
  phone: string
  email?: string
  comment?: string
}

export async function submitCartOrder(payload: {
  customer: CartOrderCustomer
  lines: CartLine[]
  totalApprox: number
}): Promise<{ ok: boolean; clientAck: string; orderRef: string }> {
  const data = await postCartOrder({
    customer: {
      name: payload.customer.name,
      phone: payload.customer.phone,
      email: payload.customer.email,
      comment: payload.customer.comment,
    },
    lines: payload.lines.map((l) => ({
      productId: l.productId,
      slug: l.slug,
      title: l.title,
      priceFrom: l.priceFrom,
      qty: l.qty,
    })),
    totalApprox: payload.totalApprox,
  })
  if (!data) return { ok: false, clientAck: '', orderRef: '' }
  return { ok: true, clientAck: data.clientAck, orderRef: data.orderRef }
}
