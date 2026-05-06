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

export type WhyColumnIconKind = 'emoji' | 'fontawesome' | 'image'

export type WhyColumn = {
  title: string
  text: string
  icon: string
  iconKind?: WhyColumnIconKind
  fontawesomeClass?: string
  /** URL файла иконки (из админки), если iconKind === 'image' */
  iconImageUrl?: string
}

/** Карточка в блоке «Акции» на главной (контент из админки). */
export type HomePromotionCard = {
  title: string
  text?: string
  badge?: string
  ctaLabel?: string
  href?: string
  /** Дата окончания для таймера, ГГГГ-ММ-ДД (конец календарного дня в локальном времени браузера). */
  endDate?: string
  showTimer?: boolean
}

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

export type HeroUspAccentVariant = 'pulse' | 'shimmer'

export type HeroStat = {
  value?: string
  label?: string
}

/** Слайд hero: v1 — только медиа; v2 — полные поля + imageUrl (постер) и videoUrl (ролик). */
export type HeroSlide = {
  enabled?: boolean
  showEyebrow?: boolean
  showTrustLine?: boolean
  showTrustI0?: boolean
  showTrustI1?: boolean
  showTrustI2?: boolean
  showStat0?: boolean
  showStat1?: boolean
  showStat2?: boolean
  imageUrl?: string
  videoUrl?: string
  textTone?: 'light' | 'dark'
  /** 0–100: сила вуали поверх фото/видео (линейный градиент + мягкий блик) */
  overlayStrength?: number
  eyebrow?: string
  usp?: string
  heightMode?: 'normal' | 'tall' | 'wow'
  uspAccentVariant?: HeroUspAccentVariant
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
}

export type HomePayload = {
  meta?: {
    title?: string
    description?: string
    orgName?: string
    orgDescription?: string
  }
  /** Порядок и включение блоков главной (админка «Порядок и включение»). */
  sectionLayout?: Array<{ id: string; enabled?: boolean }>
  hero?: {
    schemaVersion?: number
    /** Автосмена слайдов, мс (3–120 с в админке) */
    autoplayIntervalMs?: number
    showCarouselArrows?: boolean
    showCarouselProgress?: boolean
    eyebrow?: string
    usp?: string
    textTone?: 'light' | 'dark'
    heightMode?: 'normal' | 'tall' | 'wow'
    uspAccentVariant?: HeroUspAccentVariant
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
  promotions?: {
    heading?: string
    subheading?: string
    cards?: HomePromotionCard[]
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
    step1Title?: string
    step2Title?: string
    virtualRulerTitle?: string
    requestBadge?: string
    errorPhoneIncomplete?: string
    errorCommentTooLong?: string
    errorSubmitFailed?: string
    errorNetwork?: string
    consentPrefix?: string
    consentPrivacyLinkLabel?: string
    consentAndLabel?: string
    consentOfferLinkLabel?: string
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
    pageHeading?: string
    pageSubheading?: string
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
    /** Заголовок и текст тизера на главной (компактный блок). */
    teaserTitle?: string
    teaserSubtitle?: string
    teaserCta?: string
    /** Сколько карточек на главной (тизер); на сервере до 24, в админке JSON главной. */
    teaserMaxItems?: number
    /** Страница /reviews: заголовок и описание (мета / h1). */
    pageTitle?: string
    pageDescription?: string
    /** Заголовок и подпись над виджетом Яндекса на /reviews. */
    yandexBlockHeading?: string
    yandexBlockNote?: string
    /** На /reviews при паре «Яндекс + сайт»: заголовок и подпись над сеткой отзывов с сайта. */
    siteReviewsListHeading?: string
    siteReviewsListSubheading?: string
    loading?: string
    videoCaption?: string
    readMoreLabel?: string
    collapseLabel?: string
    formHeading?: string
    formSubheading?: string
    namePlaceholder?: string
    cityPlaceholder?: string
    textPlaceholder?: string
    consentPrefix?: string
    consentLinkLabel?: string
    /** Подпись к чекбоксу: только публикация отзыва (152-ФЗ и ссылки — в FormPersonalDataConsent выше). */
    publicationConsentLabel?: string
    submitButton?: string
    submitting?: string
    successMessage?: string
    errorMessage?: string
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
    navHome?: string
    navCatalog?: string
    navAbout?: string
    /** Подпункт в дропдауне «О нас» — ссылка на ту же страницу (по умолчанию «О компании»). */
    navAboutCompany?: string
    /** Слаг статичной страницы «О нас» (по умолчанию o-nas), см. /api/static-pages/ */
    aboutPageSlug?: string
    navPortfolio?: string
    navContacts?: string
    navBlog?: string
    navPromotions?: string
    navReviews?: string
    navCart?: string
    navAccount?: string
    navMenuTitle?: string
    navMenuSubtitle?: string
    mobileBarProfile?: string
    footerNavTitle?: string
    footerMarketplacesTitle?: string
    footerSocialTitle?: string
    footerContactsTitle?: string
    footerPaymentTitle?: string
    footerDeliveryTitle?: string
    footerStaffLogin?: string
    footerPrivacyLink?: string
    footerOfferLink?: string
    footerCopyrightSuffix?: string
    /** Дисклеймер про ст. 437 ГК РФ и согласие с условиями ИМ; пусто — подставляется текст по умолчанию в футере. */
    footerOfferDisclaimer?: string
    headerMainMenuAria?: string
    headerThemeToLightAria?: string
    headerThemeToDarkAria?: string
    headerThemeLightTitle?: string
    headerThemeDarkTitle?: string
    headerMenuOpenAria?: string
    headerMenuCloseAria?: string
    headerMobileMenuAria?: string
    headerBottomNavAria?: string
    staffModalCloseOverlayAria?: string
    staffModalCloseButtonAria?: string
    staffModalTitle?: string
    staffModalSubtitle?: string
    staffModalManagerLabel?: string
    staffModalManagerHint?: string
    staffModalAdminLabel?: string
    staffModalAdminHint?: string
    introAriaLabel?: string
    introTag1?: string
    introTag2?: string
    introTag3?: string
    introTitle?: string
    introSubtitle?: string
    introStage1?: string
    introStage2?: string
    introStage3?: string
    introSkipButton?: string
    productNoPhoto?: string
    productPricePrefix?: string
    productAddToCart?: string
    /** Кнопка «в 1 клик» на карточке товара (каталог, главная, похожие). */
    productOneClick?: string
    productAddedTitle?: string
    productContinueShopping?: string
    productGoToCart?: string
    productMarketplacesTitle?: string
    productBadgeInStock?: string
    productBadgeSeasonal?: string
    cartPageTitle?: string
    cartPageIntro?: string
    cartEmptyTitle?: string
    cartEmptyText?: string
    cartEmptyCta?: string
    cartItemsTitle?: string
    cartNoPhoto?: string
    cartPricePerUnitPrefix?: string
    cartPricePerUnitSuffix?: string
    cartQtyLabel?: string
    cartRemoveOrDecreaseAria?: string
    cartIncreaseAria?: string
    cartRemoveLine?: string
    cartAddMoreCta?: string
    cartSummaryTitle?: string
    cartSummaryItemsLabel?: string
    cartSummaryApproxLabel?: string
    cartSummaryDeliveryNote?: string
    cartCheckoutButton?: string
    cartCheckoutFootnote?: string
    cartTermsPrefix?: string
    /** Оформление заказа: подписи для клиента (редактируются в «Главная (контент)» → блок интерфейса). */
    checkoutSettingsLoading?: string
    checkoutDeliveryIntro?: string
    checkoutNoDeliveryBanner?: string
    checkoutNoDeliveryInlineError?: string
    checkoutOzonPartialWarning?: string
    checkoutCdekAfterSubmitWarning?: string
    checkoutOnlinePayLinkError?: string
    checkoutCdekMapMissingKeyHelp?: string
    checkoutCdekMapMissingServiceHelp?: string
    checkoutCdekMapInitFailedHelp?: string
    checkoutCdekAddressSuggestFooter?: string
    oneClickConsentTail?: string
    productNotFoundTitle?: string
    productNotFoundText?: string
    productBackToCatalog?: string
    productBreadcrumbAria?: string
    productBreadcrumbHome?: string
    productBreadcrumbCatalog?: string
    productPriceLabel?: string
    productVariantLabel?: string
    productDetailsButton?: string
    productMarketplacesCardTitle?: string
    productMarketplacesCardHint?: string
    productCustomOrderCta?: string
    productRelatedTitle?: string
    productRelatedSubtitlePrefix?: string
    productMaterialMapSubtitleFallback?: string
  }
}
