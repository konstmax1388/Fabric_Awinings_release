import { useSiteSettings } from '../../context/SiteSettingsContext'

type Props = {
  className?: string
  /** Заголовок над виджетом; пусто — «Отзывы в Яндексе». */
  title?: string
}

/**
 * Виджет и ссылка на карточку в Яндексе (настройки сайта). HTML приходит с бэкенда уже очищенным.
 */
export function ReviewsYandexBlock({ className, title = 'Отзывы в Яндексе' }: Props) {
  const { reviewsYandex } = useSiteSettings()
  const html = (reviewsYandex?.widgetHtml ?? '').trim()
  const profileUrl = (reviewsYandex?.profileUrl ?? '').trim()
  if (!html && !profileUrl) return null
  return (
    <div className={className ?? 'min-w-0'}>
      {html ? (
        <>
          <h2 className="font-heading text-xl font-semibold text-text md:text-2xl">{title}</h2>
          <div
            className="mt-3 min-w-0 overflow-x-auto rounded-2xl border border-border-light bg-surface/80 p-3 md:p-4"
            // eslint-disable-next-line react/no-danger -- доверенный HTML с бэкенда (bleach + allowlist)
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </>
      ) : null}
      {profileUrl ? (
        <p className="mt-3 font-body text-sm text-text-muted">
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
