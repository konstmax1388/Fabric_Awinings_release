import type { HomePayload } from '../types/homePage'

/** Согласовано с `config/home_section_layout.py` `VALID_HOME_SECTION_IDS`. */
export const HOME_SECTION_IDS = [
  'hero',
  'purchasePaths',
  'problemSolution',
  'processTimeline',
  'tentTypes',
  'featured',
  'promotions',
  'calculator',
  'portfolio',
  'whyUs',
  'reviews',
  'blog',
  'mapForm',
] as const

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number]

const ID_SET: ReadonlySet<string> = new Set(HOME_SECTION_IDS)

/**
 * Список id секций в порядке отображения: из `sectionLayout` и флагов витрины
 * (калькулятор/портфолио при выключенных настройках пропускаются).
 */
export function orderedVisibleHomeSectionIds(
  home: HomePayload | null,
  options: { calculatorEnabled: boolean; portfolioEnabled: boolean },
): HomeSectionId[] {
  const raw = home?.sectionLayout
  if (!raw?.length) {
    return HOME_SECTION_IDS.filter((id) => {
      if (id === 'calculator' && !options.calculatorEnabled) return false
      if (id === 'portfolio' && !options.portfolioEnabled) return false
      return true
    })
  }
  const out: HomeSectionId[] = []
  for (const row of raw) {
    if (!row || row.enabled === false) continue
    const id = String(row.id || '')
    if (!ID_SET.has(id)) continue
    if (id === 'calculator' && !options.calculatorEnabled) continue
    if (id === 'portfolio' && !options.portfolioEnabled) continue
    out.push(id as HomeSectionId)
  }
  return out
}
