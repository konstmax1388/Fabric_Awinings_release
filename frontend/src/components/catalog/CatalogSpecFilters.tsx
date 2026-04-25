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

  if (facets === null) {
    return (
      <div className="mt-6 border-t border-border pt-4">
        <p className="font-body text-sm font-semibold text-text">Параметры</p>
        <p className="mt-2 font-body text-sm text-text-muted">Загрузка…</p>
      </div>
    )
  }

  if (facets.length === 0) return null

  return (
    <div className="mt-6 border-t border-border pt-4">
      <p className="font-body text-sm font-semibold text-text">Параметры</p>
      {facets.map((facet) => (
        <div key={facet.id} className="mt-3">
          <p className="font-body text-xs font-medium text-text">
            {facet.label}
            {facet.groupName && (
              <span className="ml-1.5 font-normal text-text-muted">· {facet.groupName}</span>
            )}
          </p>
          <ul className="mt-1.5 max-h-48 space-y-0.5 overflow-y-auto pr-0.5">
            {facet.values.map((val, idx) => {
              const id = `catalog-f-${facet.id}-${idx}`
              const checked = isValueSelected(specFilters, facet.id, val)
              return (
                <li key={`${facet.id}-${idx}`} className="flex min-w-0 items-start gap-2">
                  <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={(e) => onToggleValue(facet.id, val, e.target.checked)}
                    className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded border-border text-accent"
                  />
                  <label
                    htmlFor={id}
                    className="min-w-0 cursor-pointer font-body text-sm leading-snug text-text-muted hover:text-text"
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
          className="mt-4 w-full rounded-xl border border-border px-3 py-2 font-body text-sm text-text-muted transition hover:border-accent hover:text-text"
        >
          Сбросить параметры
        </button>
      ) : null}
    </div>
  )
}
