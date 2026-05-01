import { useSiteSettings } from '../../context/SiteSettingsContext'

type Props = {
  className?: string
  /** Заголовок над виджетом; пусто — «Отзывы в Яндексе». */
  title?: string
  /** Подпись под заголовком (например, про виджет Маркета). */
  note?: string
}

/**
 * Виджет и ссылка на карточку в Яндексе (настройки сайта). HTML приходит с бэкенда уже очищенным.
 */
export function ReviewsYandexBlock({ className, title = 'Отзывы в Яндексе', note }: Props) {
  const { reviewsYandex } = useSiteSettings()
  const html = (reviewsYandex?.widgetHtml ?? '').trim()
  const profileUrl = (reviewsYandex?.profileUrl ?? '').trim()
  if (!html && !profileUrl) return null
  const noteTrim = (note ?? '').trim()
  return (
    <div className={className ?? 'min-w-0'}>
      <h2 className="font-heading text-xl font-semibold text-text md:text-2xl">{title}</h2>
      {noteTrim ? (
        <p className="mt-2 max-w-3xl font-body text-sm leading-relaxed text-text-muted md:text-[15px]">
          {noteTrim}
        </p>
      ) : null}
      {html ? (
        <div
          className={`min-w-0 overflow-x-auto rounded-2xl border border-border-light bg-surface/80 p-3 md:p-4 ${noteTrim ? 'mt-4' : 'mt-3'}`}
          // eslint-disable-next-line react/no-danger -- доверенный HTML с бэкенда (bleach + allowlist)
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
      {profileUrl ? (
        <p className={`font-body text-sm text-text-muted ${html ? 'mt-3' : noteTrim ? 'mt-4' : 'mt-3'}`}>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline-offset-2 hover:underline"
          >
            Все отзывы на Яндексе
          </a>
        </p>
      ) : null}
    </div>
  )
}
