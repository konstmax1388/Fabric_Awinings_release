import { useEffect, useState } from 'react'
import type { ProductPhotoAspect } from '../../lib/productPhotoAspect'
import {
  productGalleryMainFrameClass,
  productGalleryThumbClass,
} from '../../lib/productPhotoAspect'
import { OptimizedImage } from '../ui/OptimizedImage'

type Props = {
  images: string[]
  title: string
  aspect: ProductPhotoAspect
}

export function ProductGallery({ images, title, aspect }: Props) {
  const [active, setActive] = useState(0)
  const safe = images.length ? images : ['']

  const key = images.join('\0')
  useEffect(() => {
    setActive(0)
  }, [key])

  const mainFrame = productGalleryMainFrameClass(aspect)

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border-light bg-bg-base shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]">
        <div className={mainFrame}>
          {safe[active] ? (
            <OptimizedImage
              src={safe[active]}
              alt={title}
              priority
              widths={[640, 960, 1200]}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full object-contain p-3 sm:p-4"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg-base font-body text-sm text-text-subtle">
              Нет фото
            </div>
          )}
        </div>
      </div>
      {safe.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Миниатюры фото"
        >
          {safe.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              aria-label={`${title}: фото ${i + 1}`}
              className={`flex items-center justify-center ${productGalleryThumbClass(aspect, i === active)}`}
            >
              {src ? (
                <OptimizedImage
                  src={src}
                  alt=""
                  widths={[160, 320, 480]}
                  sizes="80px"
                  className="max-h-full max-w-full object-contain bg-bg-base p-0.5"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-[10px] text-text-subtle">—</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
