import { format, precision, signed } from '../utils/format.js'
import { powerCell } from '@/services/nasa/powerService.js'
import { useT } from '@/i18n/useT'
import { formatCoordinate, powerLink, sources } from '../utils/study.js'
import { verdicts } from '../utils/trend.js'

// Veredicto (texto en español de trend.js) → clave de i18n
const VERDICT_KEY = Object.fromEntries(Object.entries(verdicts).map(([key, text]) => [text, key]))

export default function TrendResults({ series, unit, variable, month, from, to }) {
  const { t, locale } = useT()
  return (
    <div aria-live="polite" className="space-y-3">
      {series.map(entry => <Result key={entry.id} entry={entry} unit={unit} variable={variable} from={from} to={to} />)}
      {month && (
        <aside className="rounded-lg border border-hud-border bg-space-950/50 p-3 text-sm text-ink-secondary">
          <span className="font-semibold text-ink">{t('analysis.june2025.title')}</span>
          <p className="mt-1">{t('analysis.june2025.text', { power: format(month.power, 1, locale), imerg: format(month.imerg, 2, locale) })}</p>
        </aside>
      )}
    </div>
  )
}

function Result({ entry, unit, variable, from, to }) {
  const { t, tc, locale } = useT()
  const { label, place, points, source, shift, trend, definition } = entry
  const metric = `${unit}/${t('analysis.decade')}`
  const incomplete = points.length !== to - from + 1
  const power = source === 'power'
  const rainfall = variable === 'PRECTOTCORR'
  const cell = power ? powerCell(definition.lat, definition.lon) : null
  const sourceMeta = sources[source]
  const available = trend.interval !== undefined
  const verdictKey = VERDICT_KEY[trend.verdict]
  const pointLabel = Number.isFinite(definition.lat)
    ? `${formatCoordinate(definition.lat, 'latitude', 2, locale)}, ${formatCoordinate(definition.lon, 'longitude', 2, locale)}`
    : `${definition.latitude}, ${definition.longitude}`
  const elevation = Number.isFinite(definition.elevationM)
    ? `${new Intl.NumberFormat(locale).format(definition.elevationM)} m`
    : definition.elevation

  return (
    <article className="rounded-lg border border-hud-border bg-space-800/60 p-3.5 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold">{label}</h3>
        <p className="text-xs text-ink-secondary">{t('analysis.completeYears', { n: trend.n })}</p>
      </div>
      <div className="mt-2 grid grid-cols-1 items-baseline gap-2 min-[420px]:grid-cols-[minmax(0,1fr)_auto]">
        <p className="text-sm font-medium">{verdictKey ? t(`analysis.verdicts.${verdictKey}`) : trend.verdict}</p>
        {available && (
          <p className="font-mono text-xl tabular-nums">
            {signed(trend.slope, 2, locale)} <span className="text-xs text-ink-secondary">{metric}</span>
          </p>
        )}
      </div>
      {trend.shortPeriod && (
        <p className="mt-2 rounded-md border border-terra-400/30 bg-terra-400/10 px-2.5 py-2 text-sm text-ink">
          <strong className="text-terra-400">{t('analysis.shortPeriod', { n: trend.n })}</strong>
          {' '}{t('analysis.shortPeriodHint')}
        </p>
      )}
      {shift && (
        <p className="mt-2 rounded-md border border-terra-400/30 bg-terra-400/10 px-2.5 py-2 text-sm text-ink">
          <strong className="text-terra-400">{t('analysis.shift.title', { year: shift.year })}</strong>
          {' '}{t('analysis.shift.text', { label, before: format(shift.beforeMean, 0, locale), after: format(shift.afterMean, 0, locale), unit })}
          {' '}{place === 'ica' ? t('analysis.shift.otherProduct') : t('analysis.shift.otherSource')}
        </p>
      )}
      {available && (
        <p className="mt-2 text-xs leading-relaxed text-ink-secondary">
          {t('analysis.ci')}: {signed(trend.interval[0], precision(trend.interval[0]), locale)} {t('analysis.toWord')} {signed(trend.interval[1], precision(trend.interval[1]), locale)} {metric}
          <span className="mx-2" aria-hidden="true">·</span>
          Mann–Kendall p {trend.p < 0.0001 ? `< ${format(0.0001, 4, locale)}` : `= ${format(trend.p, 4, locale)}`}
        </p>
      )}
      {incomplete && <p className="mt-2 text-xs text-ink-secondary">{t('analysis.incomplete')}</p>}
      {!!trend.outliers?.length && (
        <p className="mt-2 text-xs text-ink-secondary">{t('analysis.outliers', { years: trend.outliers.join(', ') })}</p>
      )}
      <details className="mt-3 border-t border-hud-border pt-2 text-xs text-ink-secondary">
        <summary className="cursor-pointer text-ink">{t('analysis.method.title')}</summary>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
          <dt>{t('analysis.method.product')}</dt>
          <dd>
            <a className="underline underline-offset-2 hover:text-ink" href={power ? powerLink(definition, variable) : sourceMeta.href}>
              {tc('studySources', source, 'label', sourceMeta.label)}
            </a>
          </dd>
          <dt>{t('analysis.method.point')}</dt><dd>{pointLabel}</dd>
          {cell && (
            <>
              <dt>{t('analysis.method.cell')}</dt>
              <dd>
                {t('analysis.method.cellValue', {
                  lat: formatCoordinate(cell.latitude, 'latitude', 3, locale),
                  lon: formatCoordinate(cell.longitude, 'longitude', 3, locale),
                  height: Math.round(cell.heightKm),
                  width: Math.round(cell.widthKm),
                })}
              </dd>
            </>
          )}
          <dt>{t('analysis.method.resolution')}</dt><dd>{tc('studySources', source, 'resolution', sourceMeta.resolution)}</dd>
          <dt>{t('analysis.method.unit')}</dt><dd>{unit} · {rainfall ? t('analysis.method.annualTotal') : t('analysis.method.annualMean')}</dd>
          <dt>{t('analysis.method.period')}</dt><dd>{points.length ? `${points[0].year}–${points.at(-1).year}` : t('analysis.method.noYears')}</dd>
          <dt>{t('analysis.method.frequency')}</dt><dd>{t('analysis.method.monthly')}</dd>
          <dt>{t('analysis.method.obtained')}</dt>
          <dd>
            {definition.live
              ? `${t('analysis.method.live')} · ${new Date(definition.live.fetchedAt).toLocaleString(locale)}${definition.live.version ? ` · API ${definition.live.version}` : ''}`
              : t('analysis.method.stored')}
          </dd>
          {power && elevation && <><dt>{t('analysis.method.elevation')}</dt><dd>{elevation}</dd></>}
          {available && <><dt>{t('analysis.method.sen')}</dt><dd>{signed(trend.sen, 2, locale)} {metric}</dd></>}
        </dl>
        <p className="mt-2 leading-relaxed">
          {power ? t('analysis.method.powerNote') : t('analysis.method.imergNote')}
          {available && ` ${t('analysis.method.ciNote')}`}
        </p>
      </details>
    </article>
  )
}
