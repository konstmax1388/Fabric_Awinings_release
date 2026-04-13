/** Ответ GET /api/home-content/ (поле home) — после мерджа с дефолтами на бэкенде. */

export type ProblemCardIconKind = 'emoji' | 'fontawesome' | 'image'

export type ProblemCard = {
  problem: string
  solution: string
  icon: string
  iconKind?: ProblemCardIconKind
  fontawesomeClass?: string
  iconImageUrl?: string
}

export type WhyStat = { value: number; suffix: string; label: string }

export type WhyColumn = { title: string; text: string; icon: string }

export type HeroActionType = 'link' | 'callback'

export type HeroAction = {
  type?: HeroActionType
  href?: string
}

export type HeroCallbackModalTexts = {
  title?: string
  nameLabel?: string
  phoneLabel?: string
  submitButton?: string
  submitting?: string
  successMessage?: string
}

export type HomePayload = {
  meta?: {
    title?: string
    description?: string
    orgName?: string
    orgDescription?: string
  }
  hero?: {
    title?: string
    subtitle?: string
    ctaPrimary?: string
    ctaSecondary?: string
    primaryAction?: HeroAction
    secondaryAction?: HeroAction
    callbackModal?: HeroCallbackModalTexts
    bgImageUrl?: string
  }
  problemSolution?: {
    heading?: string
    subheading?: string
    cards?: ProblemCard[]
  }
  tentTypes?: {
    heading?: string
    subheading?: string
  }
  featured?: {
    heading?: string
    subheading?: string
    catalogCta?: string
  }
  calculator?: {
    heading?: string
    subheading?: string
    lengthLabel?: string
    widthLabel?: string
    materialLabel?: string
    optionsLabel?: string
    estimateLabel?: string
    estimateNote?: string
    nameLabel?: string
    phoneLabel?: string
    commentLabel?: string
    namePlaceholder?: string
    phonePlaceholder?: string
    commentPlaceholder?: string
    submitButton?: string
    submitting?: string
    successMessage?: string
  }
  portfolio?: {
    heading?: string
    subheading?: string
    filters?: string[]
    loading?: string
    empty?: string
    allProjectsCta?: string
  }
  whyUs?: {
    heading?: string
    subheading?: string
    stats?: WhyStat[]
    columns?: WhyColumn[]
  }
  reviews?: {
    heading?: string
    subheading?: string
    loading?: string
    videoCaption?: string
  }
  blog?: {
    heading?: string
    subheading?: string
    allLink?: string
    readMore?: string
    loading?: string
  }
  mapForm?: {
    heading?: string
    subheading?: string
    mapIframeSrc?: string
    mapTitle?: string
    formNameLabel?: string
    formPhoneLabel?: string
    formCommentLabel?: string
    namePlaceholder?: string
    phonePlaceholder?: string
    commentPlaceholder?: string
    submitButton?: string
    submitting?: string
    successMessage?: string
  }
  ui?: {
    loadingFeatured?: string
    buyOnMarketplaces?: string
    buyOnMarketplacesMobile?: string
  }
}
