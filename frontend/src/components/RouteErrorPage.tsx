import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

/** Fallback при ошибке загрузки lazy-модуля или рендера маршрута. */
export function RouteErrorPage() {
  const err = useRouteError()
  let message = 'Произошла ошибка. Попробуйте обновить страницу или зайти с главной.'
  if (isRouteErrorResponse(err)) {
    message = err.statusText || `Ошибка ${err.status}`
  } else if (err instanceof Error) {
    message = err.message
  }
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-bg-base px-4 font-body text-text">
      <h1 className="text-xl font-semibold text-text">Не удалось открыть страницу</h1>
      <p className="max-w-md text-center text-sm text-text-muted">{message}</p>
      <a
        href="/"
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        На главную
      </a>
    </div>
  )
}
