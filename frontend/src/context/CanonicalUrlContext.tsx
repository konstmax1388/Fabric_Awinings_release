import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { publicSiteUrl } from '../config/publicSite'
import { defaultCanonicalHref } from '../lib/canonicalPublicUrl'

type CanonicalUrlContextValue = {
  override: string | null
  setCanonicalOverride: (v: string | null) => void
}

const CanonicalUrlContext = createContext<CanonicalUrlContextValue | null>(null)

export function CanonicalUrlProvider({ children }: { children: ReactNode }) {
  const [override, setCanonicalOverride] = useState<string | null>(null)
  const value = useMemo(
    () => ({ override, setCanonicalOverride }),
    [override],
  )
  return <CanonicalUrlContext.Provider value={value}>{children}</CanonicalUrlContext.Provider>
}

function useCanonicalCtx(): CanonicalUrlContextValue {
  const c = useContext(CanonicalUrlContext)
  if (!c) {
    throw new Error('CanonicalUrlProvider обязателен выше в дереве')
  }
  return c
}

/**
 * Фиксированный каноникал страницы (товар/статья из CMS, успех оплаты без query и т.д.).
 * После размонтирования сбрасывается на авто по URL.
 */
export function useSetCanonical(href: string | null) {
  const { setCanonicalOverride } = useCanonicalCtx()
  useLayoutEffect(() => {
    setCanonicalOverride(href)
    return () => setCanonicalOverride(null)
  }, [href, setCanonicalOverride])
}

/** Совпадает с rel=canonical — для og:url и прочих мета. */
export function useCanonicalHrefForMeta(): string {
  const loc = useLocation()
  const site = publicSiteUrl()
  const { override } = useCanonicalCtx()
  return override ?? defaultCanonicalHref(site, loc.pathname, loc.search)
}

/** Глобальный каноникал: на всех маршрутах; может быть переопределён useSetCanonical. */
export function DocumentCanonical() {
  const loc = useLocation()
  const site = publicSiteUrl()
  const { override } = useCanonicalCtx()
  const href = override ?? defaultCanonicalHref(site, loc.pathname, loc.search)
  return (
    <Helmet>
      <link rel="canonical" href={href} />
    </Helmet>
  )
}
