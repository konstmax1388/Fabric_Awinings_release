import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { SITE } from '../config/site'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { MapFormSection } from '../components/home/MapFormSection'

export function ContactsPage() {
  return (
    <>
      <Helmet>
        <title>Контакты — Фабрика Тентов</title>
        <meta name="description" content={`Телефон, email и адрес: ${SITE.address}`} />
      </Helmet>
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-12 md:px-6">
        <h1 className="font-heading text-4xl font-bold text-text md:text-5xl">Контакты</h1>
        <p className="mt-4 font-body text-text-muted">{SITE.legal}</p>
        <ul className="mt-6 space-y-2 font-body text-text">
          <li>
            <a href={SITE.phoneHref} className="text-accent hover:underline">
              {SITE.phone}
            </a>
          </li>
          <li>
            <a href={`mailto:${SITE.email}`} className="text-accent hover:underline">
              {SITE.email}
            </a>
          </li>
          <li>{SITE.address}</li>
          <li>Пн–Пт 9:00–18:00</li>
        </ul>
        <Link to="/" className="mt-8 inline-block font-medium text-accent hover:underline">
          ← На главную
        </Link>
        <div className="mt-16 border-t border-border-light pt-16">
          <MapFormSection showHeading={false} />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
