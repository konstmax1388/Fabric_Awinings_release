import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SITE } from '../config/site'
import type { MarketplaceId } from '../config/site'
import type { HomePayload } from '../types/homePage'
import { fetchHomePageContent, fetchSiteSettings } from '../lib/api'
import {
  DEFAULT_PRODUCT_PHOTO_ASPECT,
  type ProductPhotoAspect,
} from '../lib/productPhotoAspect'

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
  home: HomePayload | null
  loading: boolean
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
  home: null,
  loading: true,
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
  const [home, setHome] = useState<HomePayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchSiteSettings(), fetchHomePageContent()]).then(([s, h]) => {
      if (cancelled) return
      if (s) {
        if (s.enabledMarketplaces?.length) setEnabled(s.enabledMarketplaces as MarketplaceId[])
        setGlobal(s.globalMarketplaceUrls ?? {})
        if (s.siteName) setSiteName(s.siteName)
        if (s.siteTagline) setSiteTagline(s.siteTagline)
        if (s.footerNote) setFooterNote(s.footerNote)
        if (s.logoUrl) setLogoUrl(s.logoUrl)
        else setLogoUrl('/branding/logo.svg')
        if (s.faviconUrl) setFaviconUrl(s.faviconUrl)
        else setFaviconUrl('/branding/favicon.ico')
        if (s.phone) setPhone(s.phone)
        if (s.phoneHref) setPhoneHref(s.phoneHref)
        if (s.email) setEmail(s.email)
        if (s.address) setAddress(s.address)
        if (s.legal) setLegal(s.legal)
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
      home,
      loading,
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
      home,
      loading,
    ],
  )

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
