import { useState } from 'react'

type Props = { images: string[]; title: string }

export function ProductGallery({ images, title }: Props) {
  const [active, setActive] = useState(0)
  const safe = images.length ? images : ['']

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border-light bg-bg-base shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)]">
        <img
          src={safe[active]}
          alt=""
          className="aspect-[4/3] w-full object-cover md:aspect-[16/10]"
        />
      </div>
      {safe.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {safe.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${title}: фото ${i + 1}`}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition md:h-[72px] md:w-[96px] ${
                i === active ? 'border-accent ring-2 ring-accent/20' : 'border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
