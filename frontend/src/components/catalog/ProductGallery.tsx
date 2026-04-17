import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
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
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const touchStartX = useRef<number | null>(null)
  const safe = images.length ? images : ['']

  const key = images.join('\0')
  useEffect(() => {
    setActive(0)
  }, [key])

  const mainFrame = productGalleryMainFrameClass(aspect)
  const hasMany = safe.length > 1

  const goPrev = () => {
    setDirection(-1)
    setActive((v) => (v - 1 + safe.length) % safe.length)
  }

  const goNext = () => {
    setDirection(1)
    setActive((v) => (v + 1) % safe.length)
  }

  const goTo = (idx: number) => {
    if (idx === active) return
    setDirection(idx > active ? 1 : -1)
    setActive(idx)
  }

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!hasMany || touchStartX.current === null) return
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const delta = endX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < 42) return
    if (delta > 0) goPrev()
    else goNext()
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border-light bg-bg-base shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]">
        <div className={`${mainFrame} relative`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            {safe[active] ? (
              <motion.div
                key={`${safe[active]}-${active}`}
                custom={direction}
                className="absolute inset-0"
                initial={
                  reduce
                    ? { opacity: 0 }
                    : { opacity: 0, x: direction > 0 ? 34 : -34, scale: 0.985 }
                }
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={
                  reduce
                    ? { opacity: 0 }
                    : { opacity: 0, x: direction > 0 ? -34 : 34, scale: 0.99 }
                }
                transition={{ duration: reduce ? 0.18 : 0.34, ease: [0.22, 1, 0.36, 1] }}
              >
                <OptimizedImage
                  src={safe[active]}
                  alt={title}
                  priority
                  widths={[640, 960, 1200]}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="h-full w-full object-contain p-3 sm:p-4"
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty-image"
                className="absolute inset-0 flex h-full w-full items-center justify-center bg-bg-base font-body text-sm text-text-subtle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                Нет фото
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {hasMany && (
        <>
          <div className="flex justify-center gap-1.5 sm:hidden" aria-hidden>
            {safe.map((_, i) => (
              <span
                key={`dot-${i}`}
                className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-accent' : 'w-1.5 bg-border'}`}
              />
            ))}
          </div>
          <p className="text-center font-body text-[11px] text-text-subtle sm:hidden">Свайпните фото влево/вправо</p>
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
                onClick={() => goTo(i)}
                aria-label={`${title}: фото ${i + 1}`}
                className={`flex items-center justify-center shrink-0 ${productGalleryThumbClass(aspect, i === active)}`}
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
        </>
      )}
    </div>
  )
}
