import type { CartLine } from '../cart/cartTypes'
import { antiSpamFields } from './formValidation'
import { postCalculatorLead, postCallbackLead, postCartOrder } from './api'

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
    ...antiSpamFields(),
  })
  return { ok }
}

export async function submitCallbackLead(payload: {
  name: string
  phone: string
  comment?: string
  source?: 'hero' | 'other'
}): Promise<{ ok: boolean }> {
  const ok = await postCallbackLead({
    name: payload.name,
    phone: payload.phone,
    comment: payload.comment ?? '',
    leadSource: payload.source ?? 'hero',
    ...antiSpamFields(),
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
  delivery?: { city?: string; address?: string; comment?: string }
  accessToken?: string | null
}): Promise<{ ok: boolean; clientAck: string; orderRef: string }> {
  const data = await postCartOrder(
    {
      customer: {
        name: payload.customer.name,
        phone: payload.customer.phone,
        email: payload.customer.email,
        comment: payload.customer.comment,
        ...antiSpamFields(),
      },
      lines: payload.lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId ?? '',
        slug: l.slug,
        title: l.title,
        priceFrom: l.priceFrom,
        qty: l.qty,
      })),
      totalApprox: payload.totalApprox,
      delivery: payload.delivery,
    },
    { accessToken: payload.accessToken },
  )
  if (!data) return { ok: false, clientAck: '', orderRef: '' }
  return { ok: true, clientAck: data.clientAck, orderRef: data.orderRef }
}
