/** Значение `productPhotoAspect` из GET /api/site-settings/ (бэкенд: portrait_3_4 | square). */

export type ProductPhotoAspect = 'portrait_3_4' | 'square'

export const DEFAULT_PRODUCT_PHOTO_ASPECT: ProductPhotoAspect = 'portrait_3_4'

export function parseProductPhotoAspect(raw: unknown): ProductPhotoAspect {
  return raw === 'square' ? 'square' : 'portrait_3_4'
}

/** Рамка превью в карточке каталога / подборке. */
export function productCardImageFrameClass(aspect: ProductPhotoAspect): string {
  return aspect === 'square' ? 'aspect-square' : 'aspect-[3/4]'
}

/** Основной кадр галереи на странице товара. */
export function productGalleryMainFrameClass(aspect: ProductPhotoAspect): string {
  return aspect === 'square'
    ? 'aspect-square w-full max-w-[min(100%,920px)] mx-auto'
    : 'aspect-[3/4] w-full max-w-[min(100%,900px)] mx-auto'
}

/** Миниатюры под основным фото. */
export function productGalleryThumbClass(aspect: ProductPhotoAspect, active: boolean): string {
  const base =
    aspect === 'square'
      ? 'h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition'
      : 'h-20 w-auto aspect-[3/4] shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-[4.75rem]'
  const state = active
    ? 'border-accent shadow-md ring-2 ring-accent/25'
    : 'border-transparent opacity-85 hover:opacity-100 hover:ring-1 hover:ring-border-light'
  return `${base} ${state}`
}

/** Сетка страницы товара: колонка с галереей уже в режиме портрета. */
export function productPageGridClass(aspect: ProductPhotoAspect): string {
  const base = 'mt-8 grid items-start gap-10 lg:gap-14'
  if (aspect === 'square') {
    return `${base} lg:grid-cols-2`
  }
  return `${base} lg:grid-cols-[minmax(0,38%)_minmax(0,1fr)]`
}

/** Превью в корзине (компактная рамка). */
export function cartLineImageFrameClass(aspect: ProductPhotoAspect): string {
  return aspect === 'square'
    ? 'relative aspect-square w-full max-w-[7.5rem] shrink-0 self-start overflow-hidden rounded-xl bg-bg-base sm:w-28'
    : 'relative aspect-[3/4] w-full max-w-[6.25rem] shrink-0 self-start overflow-hidden rounded-xl bg-bg-base sm:max-w-[7rem]'
}
