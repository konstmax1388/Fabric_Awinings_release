import { useLayoutEffect, useRef } from 'react'
import type { CatalogFilterFacetKey } from '../../lib/api'

function isValueSelected(
  specFilters: ReadonlyMap<number, readonly string[]>,
  keyId: number,
  value: string,
): boolean {
  const list = specFilters.get(keyId) ?? []
  const want = value.toLowerCase()
  return list.some((x) => (x || '').toLowerCase() === want)
}

type CatalogSpecFiltersProps = {
  facets: CatalogFilterFacetKey[] | null
  specFilters: ReadonlyMap<number, string[]>
  onToggleValue: (keyId: number, value: string, nextSelected: boolean) => void
  onClear: () => void
}

export function CatalogSpecFilters({
  facets,
  specFilters,
  onToggleValue,
  onClear,
}: CatalogSpecFiltersProps) {
  const hasActive = specFilters.size > 0
  const detailsRef = useRef<HTMLDetailsElement>(null)

  /** На десктопе блок всегда раскрыт; на мобилке — свёрнут по умолчанию (экономия высоты). */
  useLayoutEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => {
      const el = detailsRef.current
      if (!el) return
      el.open = mq.matches
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [facets])

  if (facets === null) {
    return (
      <div className="mt-4 border-t border-border pt-3 lg:mt-6 lg:pt-4">
        <p className="font-body text-xs font-semibold text-text lg:text-sm">Параметры</p>
        <p className="mt-1.5 font-body text-xs text-text-muted lg:mt-2 lg:text-sm">Загрузка…</p>
      </div>
    )
  }

  if (facets.length === 0) return null

  return (
    <details
      ref={detailsRef}
      className="group mt-4 border-t border-border pt-3 lg:mt-6 lg:border-t lg:pt-4 [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg py-0.5 font-body text-xs font-semibold text-text outline-none ring-accent focus-visible:ring-2 lg:pointer-events-none lg:cursor-default lg:py-0 lg:text-sm">
        <span>Параметры</span>
        <span
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-text-muted transition group-open:rotate-180 lg:hidden"
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="stroke-current" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="mt-2 lg:mt-0">
        {facets.map((facet) => (
          <div key={facet.id} className="mt-2 first:mt-0 lg:mt-3 lg:first:mt-3">
            <p className="font-body text-[11px] font-medium leading-tight text-text lg:text-xs">
              {facet.label}
              {facet.groupName && (
                <span className="ml-1 font-normal text-text-muted">· {facet.groupName}</span>
              )}
            </p>
            <ul className="mt-1 grid max-h-[min(9.5rem,28vh)] grid-cols-2 gap-x-2 gap-y-0.5 overflow-y-auto overscroll-y-contain pr-0.5 sm:max-h-36 lg:mt-1.5 lg:block lg:max-h-48 lg:space-y-0.5">
              {facet.values.map((val, idx) => {
                const id = `catalog-f-${facet.id}-${idx}`
                const checked = isValueSelected(specFilters, facet.id, val)
                return (
                  <li key={`${facet.id}-${idx}`} className="flex min-w-0 items-start gap-1.5 lg:gap-2">
                    <input
                      type="checkbox"
                      id={id}
                      checked={checked}
                      onChange={(e) => onToggleValue(facet.id, val, e.target.checked)}
                      className="mt-1 h-3 w-3 shrink-0 rounded border-border text-accent lg:mt-1.5 lg:h-3.5 lg:w-3.5"
                    />
                    <label
                      htmlFor={id}
                      className="min-w-0 cursor-pointer font-body text-[11px] leading-snug text-text-muted hover:text-text lg:text-sm"
                    >
                      {val}
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
        {hasActive ? (
          <button
            type="button"
            onClick={onClear}
            className="mt-2.5 w-full rounded-lg border border-border px-2 py-1.5 font-body text-[11px] text-text-muted transition hover:border-accent hover:text-text lg:mt-4 lg:rounded-xl lg:px-3 lg:py-2 lg:text-sm"
          >
            Сбросить параметры
          </button>
        ) : null}
      </div>
    </details>
  )
}
