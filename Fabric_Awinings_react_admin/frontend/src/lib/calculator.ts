export const CALC_MATERIALS = [
  { id: 'pvc', label: 'ПВХ 650 г/м²', pricePerM2: 3200 },
  { id: 'canvas', label: 'Ткань акрил', pricePerM2: 4100 },
  { id: 'mesh', label: 'Сетка теневая', pricePerM2: 2800 },
] as const

export const CALC_OPTIONS = [
  { id: 'eyelets', label: 'Люверсы по периметру', price: 1200 },
  { id: 'seams', label: 'Усиленные швы', price: 2500 },
  { id: 'pockets', label: 'Карманы под стойки', price: 1800 },
] as const

export type CalcMaterialId = (typeof CALC_MATERIALS)[number]['id']
export type CalcOptionId = (typeof CALC_OPTIONS)[number]['id']

export function calcTentPrice(
  length: number,
  width: number,
  materialId: string,
  selectedOpts: Set<string>,
): number {
  const mat = CALC_MATERIALS.find((m) => m.id === materialId) ?? CALC_MATERIALS[0]
  const area = Math.max(0, length) * Math.max(0, width)
  let total = area * mat.pricePerM2
  CALC_OPTIONS.forEach((o) => {
    if (selectedOpts.has(o.id)) total += o.price
  })
  return Math.round(total)
}
