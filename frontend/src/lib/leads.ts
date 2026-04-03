/** Заявка с калькулятора — заглушка до POST /api/leads/ */

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
  if (import.meta.env.DEV) {
    console.info('[calculator lead]', payload)
  }
  await new Promise((r) => setTimeout(r, 500))
  return { ok: true }
}
