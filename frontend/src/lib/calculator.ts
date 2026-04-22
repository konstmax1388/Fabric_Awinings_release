import type { HomePayload } from '../types/homePage'

export type CalcMaterialRow = { id: string; label: string; pricePerM2: number }
export type CalcOptionRow = { id: string; label: string; price: number }
export type PricingModel = 'area_plus_options' | 'area_only' | 'options_only'

const DEFAULT_MATERIALS: CalcMaterialRow[] = [
  { id: 'pvc', label: 'ПВХ 650 г/м²', pricePerM2: 3200 },
  { id: 'canvas', label: 'Ткань акрил', pricePerM2: 4100 },
  { id: 'mesh', label: 'Сетка теневая', pricePerM2: 2800 },
]

const DEFAULT_OPTIONS: CalcOptionRow[] = [
  { id: 'eyelets', label: 'Люверсы по периметру', price: 1200 },
  { id: 'seams', label: 'Усиленные швы', price: 2500 },
  { id: 'pockets', label: 'Карманы под стойки', price: 1800 },
]

const ROUND_STEPS = new Set([1, 10, 50, 100, 500, 1000])

export type CalculatorRuntimeConfig = {
  pricingModel: PricingModel
  lengthMinM: number
  lengthMaxM: number
  widthMinM: number
  widthMaxM: number
  minimumTotalRub: number
  roundingStep: number
  materials: CalcMaterialRow[]
  options: CalcOptionRow[]
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

function parseMaterialRows(raw: unknown): CalcMaterialRow[] {
  if (!Array.isArray(raw)) return []
  const out: CalcMaterialRow[] = []
  raw.forEach((row, idx) => {
    if (!row || typeof row !== 'object') return
    const r = row as Record<string, unknown>
    const label = String(r.label ?? '').trim()
    const ppm = Number(r.pricePerM2)
    if (!label || !Number.isFinite(ppm) || ppm <= 0) return
    const idRaw = String(r.id ?? '').trim()
    const id =
      idRaw && /^[a-z0-9_-]{1,48}$/i.test(idRaw)
        ? idRaw.toLowerCase()
        : `mat${idx}`
    out.push({ id, label, pricePerM2: Math.round(ppm) })
  })
  return out
}

function parseOptionRows(raw: unknown): CalcOptionRow[] {
  if (!Array.isArray(raw)) return []
  const out: CalcOptionRow[] = []
  raw.forEach((row, idx) => {
    if (!row || typeof row !== 'object') return
    const r = row as Record<string, unknown>
    const label = String(r.label ?? '').trim()
    const pr = Number(r.price)
    if (!label || !Number.isFinite(pr) || pr < 0) return
    const idRaw = String(r.id ?? '').trim()
    const id =
      idRaw && /^[a-z0-9_-]{1,48}$/i.test(idRaw)
        ? idRaw.toLowerCase()
        : `opt${idx}`
    out.push({ id, label, price: Math.round(pr) })
  })
  return out
}

/** Конфиг калькулятора с сайта (после мерджа с дефолтами на бэкенде) + запасные константы. */
export function calculatorRuntimeFromHome(
  calculator: HomePayload['calculator'] | undefined,
): CalculatorRuntimeConfig {
  const c = calculator ?? {}
  const materials = parseMaterialRows(c.materials)
  const options = parseOptionRows(c.options)
  let step = Number(c.roundingStep)
  if (!Number.isFinite(step) || !ROUND_STEPS.has(Math.round(step))) step = 1
  step = Math.round(step)
  let lmin = Number(c.lengthMinM)
  let lmax = Number(c.lengthMaxM)
  let wmin = Number(c.widthMinM)
  let wmax = Number(c.widthMaxM)
  if (!Number.isFinite(lmin) || lmin < 0.1) lmin = 1
  if (!Number.isFinite(lmax) || lmax < 0.1) lmax = 30
  if (!Number.isFinite(wmin) || wmin < 0.1) wmin = 1
  if (!Number.isFinite(wmax) || wmax < 0.1) wmax = 20
  if (lmin >= lmax) {
    lmin = 1
    lmax = 30
  }
  if (wmin >= wmax) {
    wmin = 1
    wmax = 20
  }
  let minTotal = Number(c.minimumTotalRub)
  if (!Number.isFinite(minTotal) || minTotal < 0) minTotal = 0
  minTotal = Math.round(minTotal)
  const pm: PricingModel =
    c.pricingModel === 'area_only'
      ? 'area_only'
      : c.pricingModel === 'options_only'
        ? 'options_only'
        : 'area_plus_options'
  return {
    pricingModel: pm,
    lengthMinM: lmin,
    lengthMaxM: lmax,
    widthMinM: wmin,
    widthMaxM: wmax,
    minimumTotalRub: minTotal,
    roundingStep: step,
    materials: materials.length ? materials : [...DEFAULT_MATERIALS],
    options: options.length ? options : [...DEFAULT_OPTIONS],
  }
}

function roundToStep(value: number, step: number): number {
  if (!Number.isFinite(value)) return 0
  if (!step || step <= 0) return Math.round(value)
  return Math.round(value / step) * step
}

export function calcTentPriceFromConfig(
  cfg: CalculatorRuntimeConfig,
  length: number,
  width: number,
  materialId: string,
  selectedOpts: Set<string>,
): number {
  const mat = cfg.materials.find((m) => m.id === materialId) ?? cfg.materials[0]
  const area = Math.max(0, length) * Math.max(0, width)
  const optionsTotal = cfg.options.reduce(
    (sum, o) => (selectedOpts.has(o.id) ? sum + o.price : sum),
    0,
  )
  let total = area * mat.pricePerM2
  if (cfg.pricingModel === 'area_only') {
    total = area * mat.pricePerM2
  } else if (cfg.pricingModel === 'options_only') {
    total = optionsTotal
  } else {
    total = area * mat.pricePerM2 + optionsTotal
  }
  total = roundToStep(total, cfg.roundingStep)
  if (total < cfg.minimumTotalRub) total = cfg.minimumTotalRub
  return Math.round(total)
}
