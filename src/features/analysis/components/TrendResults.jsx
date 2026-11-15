import { format, precision, signed } from '../utils/format.js'
import { powerCell } from '@/services/nasa/powerService.js'
import { formatCoordinate, powerLink, sources } from '../utils/study.js'

export default function TrendResults({ series, unit, variable, month, from, to }) {
  return (
    <div aria-live="polite" className="space-y-3">
      {series.map(entry => <Result key={entry.id} entry={entry} unit={unit} variable={variable} from={from} to={to} />)}
      {month && (
        <aside className="rounded-lg border border-hud-border bg-space-950/50 p-3 text-sm text-ink-secondary">
          <span className="font-semibold text-ink">Junio de 2025</span>
          <p className="mt-1">
            NASA POWER estima {format(month.power, 1)} mm y GPM IMERG vía USF {format(month.imerg)} mm
            para la misma celda. El contraste es mensual. Confirmar cuánto llovió requiere datos de estaciones.
          </p>
        </aside>
      )}
    </div>
  )
}

function Result({ entry, unit, variable, from, to }) {
  const { label, place, points, source, shift, trend, definition } = entry
  const metric = `${unit}/década`
  const incomplete = points.length !== to - from + 1
  const power = source === 'power'
  const rainfall = variable === 'PRECTOTCORR'
  const cell = power ? powerCell(definition.lat, definition.lon) : null
  const sourceMeta = sources[source]
  const available = trend.interval !== undefined

  return (
    <article className="rounded-lg border border-hud-border bg-space-800/60 p-3.5 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold">{label}</h3>
        <p className="text-xs text-ink-secondary">{trend.n} años completos</p>
      </div>
      <div className="mt-2 grid grid-cols-1 items-baseline gap-2 min-[420px]:grid-cols-[minmax(0,1fr)_auto]">
        <p className="text-sm font-medium">{trend.verdict}</p>
        {available && (
          <p className="font-mono text-xl tabular-nums">
            {signed(trend.slope)} <span className="text-xs text-ink-secondary">{metric}</span>
          </p>
        )}
      </div>
      {trend.shortPeriod && (
        <p className="mt-2 rounded-md border border-terra-400/30 bg-terra-400/10 px-2.5 py-2 text-sm text-ink">
          <strong className="text-terra-400">Periodo corto: {trend.n} años completos.</strong>
          {' '}Interpreta la tendencia con cautela.
        </p>
      )}
      {shift && (
        <p className="mt-2 rounded-md border border-terra-400/30 bg-terra-400/10 px-2.5 py-2 text-sm text-ink">
          <strong className="text-terra-400">Posible cambio de nivel hacia {shift.year}.</strong>
          {' '}En {label}, el promedio pasa de {format(shift.beforeMean, 0)} a {format(shift.afterMean, 0)} {unit}/año.
          {' '}{place === 'ica' ? 'Consulta el resultado del otro producto para el mismo periodo.' : 'Contrasta con otra fuente antes de interpretarlo.'}
        </p>
      )}
      {available && (
        <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
          IC 95 %: {signed(trend.interval[0], precision(trend.interval[0]))} a {signed(trend.interval[1], precision(trend.interval[1]))} {metric}
          <span className="mx-2" aria-hidden="true">·</span>
          Mann–Kendall p {trend.p < 0.0001 ? '< 0,0001' : `= ${format(trend.p, 4)}`}
        </p>
      )}
      {incomplete && <p className="mt-2 text-xs text-ink-secondary">Se muestran los años completos disponibles en todas las series.</p>}
      {!!trend.outliers?.length && (
        <p className="mt-2 text-xs text-ink-secondary">Años atípicos en la serie: {trend.outliers.join(', ')}.</p>
      )}
      <details className="mt-3 border-t border-hud-border pt-2 text-xs text-ink-secondary">
        <summary className="cursor-pointer text-ink">Fuente y método</summary>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
          <dt>Producto</dt>
          <dd><a className="underline underline-offset-2 hover:text-ink" href={power ? powerLink(definition, variable) : sourceMeta.href}>{sourceMeta.label}</a></dd>
          <dt>Punto de consulta</dt><dd>{definition.latitude}, {definition.longitude}</dd>
          {cell && (
            <>
              <dt>Celda del modelo</dt>
              <dd>
                Centro {formatCoordinate(cell.latitude, 'latitude', 3)}, {formatCoordinate(cell.longitude, 'longitude', 3)}
                {' '}· unos {Math.round(cell.heightKm)} × {Math.round(cell.widthKm)} km
              </dd>
            </>
          )}
          <dt>Resolución</dt><dd>{sourceMeta.resolution}</dd>
          <dt>Unidad</dt><dd>{unit} · {rainfall ? 'acumulado anual' : 'promedio anual'}</dd>
          <dt>Periodo</dt><dd>{points.length ? `${points[0].year}–${points.at(-1).year}` : 'Sin años completos'}</dd>
          <dt>Frecuencia original</dt><dd>Mensual</dd>
          <dt>Obtención</dt>
          <dd>
            {definition.live
              ? `Consulta en vivo · ${new Date(definition.live.fetchedAt).toLocaleString('es-PE')}${definition.live.version ? ` · API ${definition.live.version}` : ''}`
              : 'Copia verificada guardada en el proyecto'}
          </dd>
          {power && definition.elevation && <><dt>Elevación del modelo</dt><dd>{definition.elevation}</dd></>}
          {available && <><dt>Pendiente de Sen</dt><dd>{signed(trend.sen)} {metric}</dd></>}
        </dl>
        <p className="mt-2 leading-relaxed">
          {power
            ? 'Serie histórica de un reanálisis. La cifra representa la celda del modelo.'
            : 'Promedio de 42 píxeles ponderado por el área que aporta cada uno a la celda de Ica.'}
          {available && ' IC aproximado de Newey–West (2 rezagos). Mann–Kendall ordinario, sensible a la autocorrelación.'}
        </p>
      </details>
    </article>
  )
}
