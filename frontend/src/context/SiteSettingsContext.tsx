import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SITE } from '../config/site'
import type { MarketplaceId } from '../config/site'
import type { HomePayload } from '../types/homePage'
import {
  fetchHomePageContent,
  fetchSiteSettings,
  type AnalyticsYandexDto,
  type MapFormSiteOverlay,
  type SeoDefaultsDto,
} from '../lib/api'
import {
  DEFAULT_PRODUCT_PHOTO_ASPECT,
  type ProductPhotoAspect,
} from '../lib/productPhotoAspect'
import {
  DEFAULT_CHECKOUT_PUBLIC,
  type CheckoutPublicConfig,
} from '../types/checkoutPublic'

export type SiteSettingsContextValue = {
  enabledMarketplaces: MarketplaceId[]
  globalMarketplaceUrls: Partial<Record<MarketplaceId, string>>
  siteName: string
  siteTagline: string
  footerNote: string
  logoUrl: string
  faviconUrl: string
  phone: string
  phoneHref: string
  email: string
  address: string
  legal: string
  footerVkUrl: string
  footerTelegramUrl: string
  showSocialLinks: boolean
  contactsPageTitle: string
  contactsIntro: string
  contactsHours: string
  contactsMetaDescription: string
  contactsBackLinkLabel: string
  calculatorEnabled: boolean
  productPhotoAspect: ProductPhotoAspect
  catalogIntro: string
  checkout: CheckoutPublicConfig
  /** Перекрытия карты/формы на главной из настроек сайта (поверх home.mapForm). */
  mapForm: MapFormSiteOverlay | null
  home: HomePayload | null
  loading: boolean
  analyticsYandex: AnalyticsYandexDto
  seoDefaults: SeoDefaultsDto
}

const defaultEnabled: MarketplaceId[] = ['wb', 'ozon']

const initialValue: SiteSettingsContextValue = {
  enabledMarketplaces: defaultEnabled,
  globalMarketplaceUrls: {},
  siteName: SITE.name,
  siteTagline: SITE.tagline,
  footerNote: 'Производство и монтаж под ключ.',
  logoUrl: '/branding/logo.svg',
  faviconUrl: '/branding/favicon.ico',
  phone: SITE.phone,
  phoneHref: SITE.phoneHref,
  email: SITE.email,
  address: SITE.address,
  legal: SITE.legal,
  footerVkUrl: '',
  footerTelegramUrl: '',
  showSocialLinks: false,
  contactsPageTitle: 'Контакты',
  contactsIntro: '',
  contactsHours: 'Пн–Пт 9:00–18:00',
  contactsMetaDescription: '',
  contactsBackLinkLabel: '← На главную',
  calculatorEnabled: true,
  productPhotoAspect: DEFAULT_PRODUCT_PHOTO_ASPECT,
  catalogIntro: SITE.catalogIntro,
  checkout: DEFAULT_CHECKOUT_PUBLIC,
  mapForm: null,
  home: null,
  loading: true,
  analyticsYandex: { enabled: false, counterId: '' },
  seoDefaults: {
    allowIndexing: true,
    region: 'RU',
    defaultMetaDescription: '',
    titleSuffix: '',
    locale: 'ru_RU',
  },
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>(initialValue)

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [enabledMarketplaces, setEnabled] = useState<MarketplaceId[]>(defaultEnabled)
  const [globalMarketplaceUrls, setGlobal] = useState<Partial<Record<MarketplaceId, string>>>({})
  const [siteName, setSiteName] = useState<string>(SITE.name)
  const [siteTagline, setSiteTagline] = useState<string>(SITE.tagline)
  const [footerNote, setFooterNote] = useState('Производство и монтаж под ключ.')
  const [logoUrl, setLogoUrl] = useState('/branding/logo.svg')
  const [faviconUrl, setFaviconUrl] = useState('/branding/favicon.ico')
  const [phone, setPhone] = useState<string>(SITE.phone)
  const [phoneHref, setPhoneHref] = useState<string>(SITE.phoneHref)
  const [email, setEmail] = useState<string>(SITE.email)
  const [address, setAddress] = useState<string>(SITE.address)
  const [legal, setLegal] = useState<string>(SITE.legal)
  const [footerVkUrl, setFooterVkUrl] = useState('')
  const [footerTelegramUrl, setFooterTelegramUrl] = useState('')
  const [showSocialLinks, setShowSocialLinks] = useState(false)
  const [contactsPageTitle, setContactsPageTitle] = useState('Контакты')
  const [contactsIntro, setContactsIntro] = useState('')
  const [contactsHours, setContactsHours] = useState('Пн–Пт 9:00–18:00')
  const [contactsMetaDescription, setContactsMetaDescription] = useState('')
  const [contactsBackLinkLabel, setContactsBackLinkLabel] = useState('← На главную')
  const [calculatorEnabled, setCalculatorEnabled] = useState(true)
  const [productPhotoAspect, setProductPhotoAspect] =
    useState<ProductPhotoAspect>(DEFAULT_PRODUCT_PHOTO_ASPECT)
  const [catalogIntro, setCatalogIntro] = useState<string>(SITE.catalogIntro)
  const [checkout, setCheckout] = useState<CheckoutPublicConfig>(DEFAULT_CHECKOUT_PUBLIC)
  const [mapForm, setMapForm] = useState<MapFormSiteOverlay | null>(null)
  const [home, setHome] = useState<HomePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsYandex, setAnalyticsYandex] = useState<AnalyticsYandexDto>({
    enabled: false,
    counterId: '',
  })
  const [seoDefaults, setSeoDefaults] = useState<SeoDefaultsDto>(initialValue.seoDefaults)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchSiteSettings(), fetchHomePageContent()]).then(([s, h]) => {
      if (cancelled) return
      if (s) {
        if (s.enabledMarketplaces?.length) setEnabled(s.enabledMarketplaces as MarketplaceId[])
        setGlobal(s.globalMarketplaceUrls ?? {})
        setSiteName(s.siteName ?? SITE.name)
        setSiteTagline(s.siteTagline ?? SITE.tagline)
        setFooterNote(s.footerNote ?? 'Производство и монтаж под ключ.')
        if (s.logoUrl) setLogoUrl(s.logoUrl)
        else setLogoUrl('/branding/logo.svg')
        if (s.faviconUrl) setFaviconUrl(s.faviconUrl)
        else setFaviconUrl('/branding/favicon.ico')
        setPhone(s.phone ?? SITE.phone)
        setPhoneHref(s.phoneHref ?? SITE.phoneHref)
        setEmail(s.email ?? SITE.email)
        setAddress(s.address ?? SITE.address)
        setLegal(s.legal ?? SITE.legal)
        setFooterVkUrl(s.footerVkUrl ?? '')
        setFooterTelegramUrl(s.footerTelegramUrl ?? '')
        setShowSocialLinks(s.showSocialLinks === true)
        setContactsPageTitle(s.contactsPageTitle?.trim() || 'Контакты')
        setContactsIntro(s.contactsIntro ?? '')
        setContactsHours(s.contactsHours !== undefined ? s.contactsHours : 'Пн–Пт 9:00–18:00')
        setContactsMetaDescription(s.contactsMetaDescription?.trim() ?? '')
        setContactsBackLinkLabel(s.contactsBackLinkLabel?.trim() || '← На главную')
        setCalculatorEnabled(s.calculatorEnabled !== false)
        setProductPhotoAspect(s.productPhotoAspect ?? DEFAULT_PRODUCT_PHOTO_ASPECT)
        setCatalogIntro(
          s.catalogIntro !== undefined && s.catalogIntro !== null && String(s.catalogIntro).trim()
            ? String(s.catalogIntro).trim()
            : SITE.catalogIntro,
        )
        setCheckout(s.checkout ?? DEFAULT_CHECKOUT_PUBLIC)
        setMapForm(s.mapForm ?? null)
        if (s.analyticsYandex) {
          setAnalyticsYandex({
            enabled: s.analyticsYandex.enabled === true,
            counterId: s.analyticsYandex.counterId ?? '',
          })
        }
        if (s.seoDefaults) {
          setSeoDefaults({
            allowIndexing: s.seoDefaults.allowIndexing !== false,
            region: s.seoDefaults.region?.trim() || 'RU',
            defaultMetaDescription: s.seoDefaults.defaultMetaDescription ?? '',
            titleSuffix: s.seoDefaults.titleSuffix ?? '',
            locale: s.seoDefaults.locale?.trim() || 'ru_RU',
          })
        }
      }
      setHome(h)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      enabledMarketplaces,
      globalMarketplaceUrls,
      siteName,
      siteTagline,
      footerNote,
      logoUrl,
      faviconUrl,
      phone,
      phoneHref,
      email,
      address,
      legal,
      footerVkUrl,
      footerTelegramUrl,
      showSocialLinks,
      contactsPageTitle,
      contactsIntro,
      contactsHours,
      contactsMetaDescription,
      contactsBackLinkLabel,
      calculatorEnabled,
      productPhotoAspect,
      catalogIntro,
      checkout,
      mapForm,
      home,
      loading,
      analyticsYandex,
      seoDefaults,
    }),
    [
      enabledMarketplaces,
      globalMarketplaceUrls,
      siteName,
      siteTagline,
      footerNote,
      logoUrl,
      faviconUrl,
      phone,
      phoneHref,
      email,
      address,
      legal,
      footerVkUrl,
      footerTelegramUrl,
      showSocialLinks,
      contactsPageTitle,
      contactsIntro,
      contactsHours,
      contactsMetaDescription,
      contactsBackLinkLabel,
      calculatorEnabled,
      productPhotoAspect,
      catalogIntro,
      checkout,
      mapForm,
      home,
      loading,
      analyticsYandex,
      seoDefaults,
    ],
  )

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
