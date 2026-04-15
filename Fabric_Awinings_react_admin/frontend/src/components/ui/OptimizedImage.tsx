import { useState, type ImgHTMLAttributes } from 'react'
import {
  canOptimizeMediaUrl,
  imageVariantSrcSet,
  imageVariantUrl,
} from '../../lib/optimizedImage'

const DEFAULT_WIDTHS = [480, 640, 960] as const

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> & {
  src: string
  /** Для srcSet вариантов API */
  widths?: readonly number[]
  sizes?: string
  /** LCP / первый экран */
  priority?: boolean
}

/**
 * Lazy-load + по возможности WebP/JPEG через /api/image-variant/ (тот же пайплайн для витрины).
 * Если URL не из /media/ или SVG — обычный <img>.
 */
export function OptimizedImage({
  src,
  alt,
  className,
  widths = DEFAULT_WIDTHS,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  onError,
  ...rest
}: Props) {
  const [useOriginal, setUseOriginal] = useState(false)
  const optimizable = !useOriginal && canOptimizeMediaUrl(src)
  const mainW = widths[Math.min(2, widths.length - 1)] ?? 640

  const webpSrcSet = optimizable ? imageVariantSrcSet(src, [...widths], 'webp') : ''
  const jpegSrcSet = optimizable ? imageVariantSrcSet(src, [...widths], 'jpeg') : ''
  const jpegMain = optimizable ? imageVariantUrl(src, { w: mainW, format: 'jpeg' }) : null
  const fallback = jpegMain ?? src

  const handleError: ImgHTMLAttributes<HTMLImageElement>['onError'] = (e) => {
    if (optimizable && !useOriginal) {
      setUseOriginal(true)
      return
    }
    onError?.(e)
  }

  if (!optimizable) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        onError={onError}
        {...rest}
      />
    )
  }

  return (
    <picture>
      {webpSrcSet ? (
        <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
      ) : null}
      {jpegSrcSet ? (
        <source type="image/jpeg" srcSet={jpegSrcSet} sizes={sizes} />
      ) : null}
      <img
        src={fallback}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        onError={handleError}
        {...rest}
      />
    </picture>
  )
}
