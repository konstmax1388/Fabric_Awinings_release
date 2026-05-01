/**
 * Единые правила для атрибута alt у изображений на витрине (SEO и доступность).
 * Всегда передавайте осмысленный контекст; fallback — только если данных нет.
 */

export function imageAltText(value: string | undefined | null, fallback: string): string {
  const t = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
  return t.length > 0 ? t : fallback
}

export function homeLogoAlt(siteName: string): string {
  return `На главную — ${imageAltText(siteName, 'сайт')}`
}

export function promotionCoverAlt(promotionTitle: string): string {
  return `${imageAltText(promotionTitle, 'Акция')}: изображение акции`
}

export function productCardPhotoAlt(productTitle: string): string {
  return `${imageAltText(productTitle, 'Товар')}: фото`
}

export function productGalleryMainAlt(productTitle: string): string {
  return `${imageAltText(productTitle, 'Товар')}: фото`
}

export function productGalleryThumbAlt(productTitle: string, indexOneBased: number): string {
  return `${imageAltText(productTitle, 'Товар')}: миниатюра ${indexOneBased}`
}

export function productMaterialMapAlt(mapTitle: string): string {
  return `${imageAltText(mapTitle, 'Карта материалов')}: схема слоёв`
}

export function catalogCategoryFilterAlt(categoryTitle: string): string {
  return `Категория «${imageAltText(categoryTitle, 'тип тента')}»: иконка`
}

export function tentTypeSectionCardAlt(categoryTitle: string): string {
  return `${imageAltText(categoryTitle, 'Раздел')}: фото`
}

export function reviewAuthorPhotoAlt(authorName: string): string {
  return `Фото автора отзыва: ${imageAltText(authorName, 'клиент')}`
}

export function problemCardIconAlt(cardTitle: string): string {
  return `Значок: ${imageAltText(cardTitle, 'этап')}`
}

export function marketplaceLogoAlt(marketplaceLabel: string): string {
  return `Логотип ${imageAltText(marketplaceLabel, 'маркетплейса')}`
}

export function cartLineThumbnailAlt(lineTitle: string): string {
  return `${imageAltText(lineTitle, 'Позиция')}: миниатюра`
}

export function articleCoverAlt(title: string): string {
  return `${imageAltText(title, 'Статья')}: обложка`
}

export function whyUsColumnIconAlt(columnTitle: string): string {
  return `Иконка: ${imageAltText(columnTitle, 'колонка')}`
}
