import { useSiteSettings } from '../../context/SiteSettingsContext'

const titleClass = 'font-heading text-4xl font-bold text-text md:text-5xl'

type Props = {
  /** На странице /contacts — H1, в секции главной — H2 (одинаковые стили). */
  titleAs?: 'h1' | 'h2'
}

/**
 * Текстовый блок реквизитов: заголовок, вводный текст, реквизиты, телефон, почта, адрес, режим работы.
 * Те же данные, что на маршруте /contacts (без карты и формы).
 */
export function ContactsContentBlock({ titleAs = 'h1' }: Props) {
  const {
    contactsPageTitle,
    contactsIntro,
    contactsHours,
    phone,
    phoneHref,
    email,
    address,
    legal,
  } = useSiteSettings()

  const hoursLine = contactsHours.trim()
  const TitleTag = titleAs

  return (
    <>
      <TitleTag className={titleClass}>{contactsPageTitle}</TitleTag>
      {contactsIntro.trim() ? (
        <p className="mt-4 max-w-2xl whitespace-pre-line font-body leading-relaxed text-text-muted">
          {contactsIntro.trim()}
        </p>
      ) : null}
      {legal.trim() ? <p className="mt-4 font-body text-text-muted">{legal}</p> : null}
      <ul className="mt-6 space-y-2 break-words font-body text-text">
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
    </>
  )
}
