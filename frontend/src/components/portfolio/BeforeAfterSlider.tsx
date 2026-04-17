import { useState } from 'react'
import { OptimizedImage } from '../ui/OptimizedImage'

type Props = {
  before: string
  after: string
  title: string
}

export function BeforeAfterSlider({ before, after, title }: Props) {
  const [value, setValue] = useState(50)

  return (
    <div className="relative overflow-hidden rounded-t-2xl">
      <div className="relative aspect-[4/3] bg-border">
        <OptimizedImage
          src={before}
          alt={`${title} — до`}
          widths={[640, 800, 1024]}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${value}%` }}
        >
          <OptimizedImage
            src={after}
            alt={`${title} — после`}
            widths={[640, 800, 1024]}
            sizes="(max-width: 768px) 100vw, 33vw"
            className="h-full w-full object-cover"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-surface/90 shadow-[0_0_0_1px_rgba(0,0,0,0.18)]"
          style={{ left: `${value}%` }}
          aria-hidden
        />
      </div>
      <div className="bg-surface px-4 pb-4 pt-3">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full accent-accent"
          aria-label={`Сравнить до/после: ${title}`}
        />
      </div>
    </div>
  )
}
