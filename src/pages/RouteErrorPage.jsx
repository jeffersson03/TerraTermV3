import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { ROUTE_PATHS } from '@/router/routePaths'
import { useT } from '@/i18n/useT'

// Pantalla para rutas inexistentes o errores no controlados al renderizar.
function RouteErrorPage() {
  const error = useRouteError()
  const isNotFound = isRouteErrorResponse(error) && error.status === 404
  const { t } = useT()

  return (
    <main className="grid h-dvh place-items-center bg-space-950 p-4 text-ink">
      <div className="max-w-md rounded-sm border border-hud-border bg-space-900 p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-ink-muted">
          {isNotFound ? 'Error 404' : t('routeError.appError')}
        </p>
        <h1 className="mt-2 text-lg font-semibold">
          {isNotFound ? t('routeError.notFound') : t('routeError.generic')}
        </h1>
        <Link
          to={ROUTE_PATHS.explorer}
          className="mt-4 inline-block rounded-sm border border-sensor-accent px-4 py-2 text-sm text-sensor-accent hover:bg-sensor-glow"
        >
          {t('routeError.back')}
        </Link>
      </div>
    </main>
  )
}

export default RouteErrorPage
