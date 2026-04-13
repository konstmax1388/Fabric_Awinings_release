import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { MapFormSection } from '../components/home/MapFormSection'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { useSiteSettings } from '../context/SiteSettingsContext'

export function ContactsPage() {
  const {
    siteName,
    address,
    phone,
    phoneHref,
    email,
    legal,
    contactsPageTitle,
    contactsIntro,
    contactsHours,
    contactsMetaDescription,
    contactsBackLinkLabel,
  } = useSiteSettings()

  const metaDescription =
    contactsMetaDescription.trim() ||
    `Телефон, email и адрес: ${address}`.slice(0, 500)

  const hoursLine = contactsHours.trim()

  return (
    <>
      <Helmet>
        <title>{`${contactsPageTitle} — ${siteName}`}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-12 md:px-6">
        <h1 className="font-heading text-4xl font-bold text-text md:text-5xl">{contactsPageTitle}</h1>
        {contactsIntro.trim() ? (
          <p className="mt-4 max-w-2xl whitespace-pre-line font-body leading-relaxed text-text-muted">
            {contactsIntro.trim()}
          </p>
        ) : null}
        {legal.trim() ? <p className="mt-4 font-body text-text-muted">{legal}</p> : null}
        <ul className="mt-6 space-y-2 font-body text-text">
          <li>
            <a href={phoneHref} className="text-accent hover:underline">
              {phone}
            </a>
          </li>
          <li>
            <a href={`mailto:${email}`} className="text-accent hover:underline">
              {email}
            </a>
          </li>
          <li>{address}</li>
          {hoursLine ? <li>{hoursLine}</li> : null}
        </ul>
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
