/** JSON макета «О нас» (api: aboutPayload), version 1. */

export type AboutIntro = {
  title?: string
  titleAccent?: string
  paragraphs?: string[]
  imageUrl?: string
  imageAlt?: string
}

export type AboutSpotlight = {
  eyebrow?: string
  line?: string
}

export type AboutGalleryItem = {
  url?: string
  alt?: string
}

export type AboutManufacturer = {
  imageUrl?: string
  imageAlt?: string
  videoUrl?: string
  videoCta?: string
  videoSub?: string
  heading?: string
  lead?: string
  legalText?: string
}

export type AboutMetric = {
  label?: string
  valuePercent?: number
  barPercent?: number
}

export type AboutFacts = {
  backgroundUrl?: string
  badge?: string
  subtitle?: string
  items?: Array<{ value?: string; label?: string }>
}

export type AboutReviewItem = {
  productTitle?: string
  text?: string
  authorName?: string
  source?: string
  avatarUrl?: string
}

export type AboutReviewsStrip = {
  title?: string
  titleAccent?: string
  subtitle?: string
  items?: AboutReviewItem[]
}

export type AboutPagePayload = {
  version?: number
  intro?: AboutIntro
  featureBullets?: string[]
  spotlight?: AboutSpotlight
  spotlightGallery?: AboutGalleryItem[]
  manufacturer?: AboutManufacturer
  metrics?: AboutMetric[]
  facts?: AboutFacts
  reviewsStrip?: AboutReviewsStrip
}
