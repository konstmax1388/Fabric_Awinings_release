import { useMemo, useState } from 'react'

const materials = [
  { id: 'pvc', label: 'ПВХ 650 г/м²', pricePerM2: 3200 },
  { id: 'canvas', label: 'Ткань акрил', pricePerM2: 4100 },
  { id: 'mesh', label: 'Сетка теневая', pricePerM2: 2800 },
]

const options = [
  { id: 'eyelets', label: 'Люверсы по периметру', price: 1200 },
  { id: 'seams', label: 'Усиленные швы', price: 2500 },
  { id: 'pockets', label: 'Карманы под стойки', price: 1800 },
]

function calcPrice(
  length: number,
  width: number,
  materialId: string,
  selectedOpts: Set<string>,
) {
  const mat = materials.find((m) => m.id === materialId) ?? materials[0]
  const area = Math.max(0, length) * Math.max(0, width)
  let total = area * mat.pricePerM2
  options.forEach((o) => {
    if (selectedOpts.has(o.id)) total += o.price
  })
  return Math.round(total)
}

export function PriceCalculatorSection() {
  const [length, setLength] = useState(3)
  const [width, setWidth] = useState(2)
  const [materialId, setMaterialId] = useState(materials[0].id)
  const [opts, setOpts] = useState<Set<string>>(new Set())

  const price = useMemo(
    () => calcPrice(length, width, materialId, opts),
    [length, width, materialId, opts],
  )

  const toggleOpt = (id: string) => {
    setOpts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section id="calculator" className="mx-auto max-w-[1280px] scroll-mt-24 px-4 py-12 md:px-6 md:py-24">
      <h2 className="font-heading text-3xl font-bold tracking-tight text-text md:text-5xl">
        Калькулятор стоимости
      </h2>
      <p className="mt-3 max-w-2xl font-body text-text-muted md:text-lg">
        Предварительный расчёт по площади и материалу. Точную цену подтвердим после замера.
      </p>

      <div className="mt-10 rounded-[24px] border border-border-light bg-surface p-6 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] md:p-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block font-body text-sm font-medium text-text">Длина, м</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block font-body text-sm font-medium text-text">Ширина, м</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block font-body text-sm font-medium text-text">Материал</span>
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="h-14 w-full rounded-2xl border border-border bg-surface px-5 font-body text-text outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(232,122,0,0.1)]"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className="mb-3 block font-body text-sm font-medium text-text">Опции</span>
              <div className="flex flex-col gap-3">
                {options.map((o) => (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-light px-4 py-3 transition hover:border-accent/40"
                  >
                    <input
                      type="checkbox"
                      checked={opts.has(o.id)}
                      onChange={() => toggleOpt(o.id)}
                      className="h-5 w-5 rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="font-body text-sm text-text">
                      {o.label}
                      <span className="text-text-muted"> (+{o.price.toLocaleString('ru-RU')} ₽)</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-2xl bg-bg-base p-8">
            <p className="font-body text-sm text-text-muted">Ориентировочная стоимость</p>
            <p
              className="mt-2 font-body text-3xl font-bold tracking-tight text-accent transition-all duration-300 ease-out md:text-4xl"
              key={price}
            >
              {price.toLocaleString('ru-RU')} ₽
            </p>
            <p className="mt-4 font-body text-sm text-text-subtle">
              Не публичная оферта. Итоговая цена — в коммерческом предложении.
            </p>
            <button
              type="button"
              className="mt-8 inline-flex h-14 min-h-[44px] w-full items-center justify-center rounded-[40px] bg-accent font-body text-base font-medium text-surface shadow-[0_4px_8px_0_rgba(232,122,0,0.25)] transition hover:scale-[1.02] hover:bg-[#c65f00] md:w-auto md:self-start md:px-10"
              style={{ letterSpacing: '0.02em' }}
            >
              Отправить заявку
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
