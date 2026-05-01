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
    <div
      className={`fabric-reviews-yandex min-w-0 rounded-2xl border border-border-light bg-gradient-to-br from-surface via-surface to-accent/[0.06] p-1 shadow-sm ring-1 ring-accent/10 md:p-1.5 ${className ?? ''}`}
    >
      <div className="rounded-xl bg-surface/90 px-1 pb-1 pt-3 md:px-2 md:pt-4">
        <h2 className="font-heading px-2 text-xl font-semibold text-text md:px-1 md:text-2xl">{title}</h2>
        {noteTrim ? (
          <p className="mt-2 max-w-3xl px-2 font-body text-sm leading-relaxed text-text-muted md:px-1 md:text-[15px]">
            {noteTrim}
          </p>
        ) : null}
        {html ? (
          <div
            className={`min-h-[200px] min-w-0 overflow-x-auto rounded-lg border border-border-light/80 bg-bg-base/40 p-2 md:p-3 ${noteTrim ? 'mt-4' : 'mt-3'}`}
            // eslint-disable-next-line react/no-danger -- доверенный HTML с бэкенда (bleach + allowlist)
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : null}
        {profileUrl ? (
          <p className={`px-2 font-body text-sm text-text-muted md:px-1 ${html ? 'mt-3' : noteTrim ? 'mt-4' : 'mt-3'}`}>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-accent underline-offset-2 hover:underline"
            >
              Все отзывы на Яндексе
              <span aria-hidden className="text-xs opacity-70">
                ↗
              </span>
            </a>
          </p>
        ) : null}
      </div>
    </div>
  )
}
