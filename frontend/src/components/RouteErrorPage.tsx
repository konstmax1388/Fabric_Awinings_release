import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

function isStaleChunkError(message: string): boolean {
  return /Failed to fetch dynamically imported module|Loading chunk \d+ failed|ChunkLoadError|Importing a module script failed|error loading dynamically imported module/i.test(
    message,
  )
}

/** Fallback при ошибке загрузки lazy-модуля или рендера маршрута. */
export function RouteErrorPage() {
  const err = useRouteError()
  let message = 'Произошла ошибка. Попробуйте обновить страницу или зайти с главной.'
  if (isRouteErrorResponse(err)) {
    message = err.statusText || `Ошибка ${err.status}`
  } else if (err instanceof Error) {
    message = err.message
  }
  const chunkStale = isStaleChunkError(message)
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-bg-base px-4 font-body text-text">
      <h1 className="text-xl font-semibold text-text">Не удалось открыть страницу</h1>
      <p className="max-w-md text-center text-sm text-text-muted">
        {chunkStale
          ? 'Вышла новая версия сайта или сбросился кэш. Обычно помогает одно обновление страницы.'
          : message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {chunkStale ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Обновить страницу
          </button>
        ) : null}
        <a
          href="/"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface"
        >
          На главную
        </a>
      </div>
    </div>
  )
}
