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

export type HeroSlide = {
  imageUrl?: string
  videoUrl?: string
  textTone?: 'light' | 'dark'
}

export type HeroStat = {
  value?: string
  label?: string
}

export type HomePayload = {
  meta?: {
    title?: string
    description?: string
    orgName?: string
    orgDescription?: string
  }
  hero?: {
    eyebrow?: string
    usp?: string
    textTone?: 'light' | 'dark'
    heightMode?: 'normal' | 'tall' | 'wow'
    title?: string
    subtitle?: string
    trustLine?: string
    trustItems?: string[]
    stats?: HeroStat[]
    ctaPrimary?: string
    ctaSecondary?: string
    primaryAction?: HeroAction
    secondaryAction?: HeroAction
    callbackModal?: HeroCallbackModalTexts
    bgImageUrl?: string
    slides?: HeroSlide[]
  }
  problemSolution?: {
    heading?: string
    subheading?: string
    cards?: ProblemCard[]
  }
  processTimeline?: {
    heading?: string
    subheading?: string
    steps?: Array<{
      title?: string
      text?: string
    }>
  }
  purchasePaths?: {
    eyebrow?: string
    heading?: string
    subheading?: string
    readyTitle?: string
    readySubtitle?: string
    readyBullets?: string[]
    readyCta?: string
    readyHref?: string
    customTitle?: string
    customSubtitle?: string
    customBullets?: string[]
    customCta?: string
    customHref?: string
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
    mode?: 'calculator' | 'request_form'
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
    requestFormTitle?: string
    requestFormSubtitle?: string
    requestFormBenefit1?: string
    requestFormBenefit2?: string
    requestFormBenefit3?: string
    pricingModel?: 'area_plus_options' | 'area_only' | 'options_only'
    lengthMinM?: number
    lengthMaxM?: number
    widthMinM?: number
    widthMaxM?: number
    minimumTotalRub?: number
    roundingStep?: number
    materials?: Array<{ id?: string; label?: string; pricePerM2?: number }>
    options?: Array<{ id?: string; label?: string; price?: number }>
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
