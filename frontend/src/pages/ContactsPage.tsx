import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ContactsContentBlock } from '../components/contacts/ContactsContentBlock'
import { MapFormSection } from '../components/home/MapFormSection'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { useSiteSettings } from '../context/SiteSettingsContext'

export function ContactsPage() {
  const { siteName, address, contactsPageTitle, contactsMetaDescription, contactsBackLinkLabel } =
    useSiteSettings()

  const metaDescription =
    contactsMetaDescription.trim() ||
    `Телефон, email и адрес: ${address}`.slice(0, 500)

  return (
    <>
      <Helmet>
        <title>{`${contactsPageTitle} — ${siteName}`}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      <SiteHeader />
      <main className="mx-auto min-w-0 max-w-[1280px] overflow-x-clip px-4 py-12 md:px-6">
        <ContactsContentBlock titleAs="h1" />
        <Link to="/" className="mt-8 inline-block font-medium text-accent hover:underline">
          {contactsBackLinkLabel}
        </Link>
        <div className="mt-16 border-t border-border-light pt-16">
          <MapFormSection showHeading={false} />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
