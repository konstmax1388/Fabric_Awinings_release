import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ContactsContentBlock } from '../components/contacts/ContactsContentBlock'
import { MapFormSection } from '../components/home/MapFormSection'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { publicSiteUrl } from '../config/publicSite'
import { useSiteSettings } from '../context/SiteSettingsContext'

export function ContactsPage() {
  const site = publicSiteUrl()
  const {
    siteName,
    address,
    contactsPageTitle,
    contactsMetaDescription,
    contactsBackLinkLabel,
    seoDefaults,
  } = useSiteSettings()

  const metaDescription =
    contactsMetaDescription.trim() ||
    `Телефон, email и адрес: ${address}`.slice(0, 500)

  return (
    <>
      <Helmet>
        <title>{`${contactsPageTitle} — ${siteName}`}</title>
        <meta name="description" content={metaDescription} />
        {!seoDefaults.allowIndexing ? <meta name="robots" content="noindex, nofollow" /> : null}
        <link rel="canonical" href={`${site}/contacts`} />
      </Helmet>
      <SiteHeader />
      <main className="fabric-page">
        <div className="fabric-page-main min-w-0 overflow-x-clip">
        <div className="fabric-card p-6 md:p-8">
          <ContactsContentBlock titleAs="h1" />
        </div>
        <Link to="/" className="fabric-strap-btn mt-8 inline-block rounded-full border border-border px-5 py-2 font-medium text-accent hover:border-accent/60">
          {contactsBackLinkLabel}
        </Link>
        <div className="mt-16 border-t border-border pt-16">
          <MapFormSection showHeading={false} />
        </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
