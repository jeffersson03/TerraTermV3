import { useState } from 'react'
import { isValidPoint, powerCell } from '@/services/nasa/powerService.js'
import { useT } from '@/i18n/useT'
import dataset from '../data/ica-pisco.json'
import { analyzeStudy, customPlace, formatCoordinate, june2025, periodFor, places, variables } from '../utils/study.js'
import TrendChart from './TrendChart.jsx'
import TrendResults from './TrendResults.jsx'
import { usePowerPlace } from '../hooks/usePowerPlace.js'

const selectStyle = 'min-h-10 w-full min-w-0 rounded-md border border-hud-border bg-space-950 px-2.5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-aqua-400'
const labelStyle = 'mb-1 block text-xs font-medium text-ink-secondary'

// Códigos de error de powerService → clave de i18n (analysis.liveErrors.<código>)
const LIVE_ERROR_CODES = new Set(['timeout', 'network', 'rejected', 'http', 'format'])

function defaultSelection(variable, place = variables[variable].defaultPlace) {
  return { variable, place, ...periodFor(variable, place) }
}

function parseCoordinate(text) {
  return text.trim() === '' ? NaN : Number(text.trim().replace(',', '.').replace('−', '-'))
}

// Nombre visible de cada serie en el idioma activo (los catálogos de study.js están en español)
function useSeriesLabel() {
  const { t, tc } = useT()
  return (entry) => {
    if (entry.id === 'imerg') return t('analysis.imergLabel')
    if (entry.place === 'custom' || entry.label === 'NASA POWER') return entry.label
    return tc('studyPlaces', entry.place, 'label', entry.label)
  }
}

export default function TrendExplorer() {
  const { t, tc, locale } = useT()
  const seriesLabel = useSeriesLabel()
  const [selection, setSelection] = useState(() => defaultSelection('T2M'))
  const [coordinates, setCoordinates] = useState({ latitude: '', longitude: '' })
  const [live, loadLive] = usePowerPlace()
  const { variable, place, from, to } = selection
  const current = variables[variable]
  const bounds = periodFor(variable, place)
  const rain = variable === 'PRECTOTCORR'
  const custom = place === 'custom'
  const ready = !custom || live.status === 'ready'

  const definitions = custom && ready ? { ...places, custom: customPlace(live.data) } : places
  const source = custom && ready ? { ...dataset, power: { ...dataset.power, custom: live.data.series } } : dataset
  const series = (ready ? analyzeStudy(source, selection, definitions) : []).map(entry => ({ ...entry, label: seriesLabel(entry) }))
  const cell = custom && ready ? powerCell(live.data.latitude, live.data.longitude) : null
  const unit = tc('studyVariables', variable, 'unit', current.unit)

  return (
    <section className="min-w-0 px-4 py-5 sm:px-6 lg:mx-auto lg:max-w-3xl" aria-labelledby="analysis-title">
      <h2 id="analysis-title" className="text-xl font-semibold tracking-tight">{t('analysis.title')}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="min-w-0">
          <span className={labelStyle}>{t('filters.variable')}</span>
          <select value={variable} className={selectStyle} onChange={event => {
            const selected = event.target.value
            setSelection(previous => defaultSelection(selected, previous.place === 'custom' ? 'custom' : undefined))
          }}>
            {Object.entries(variables).map(([key, { label }]) => (
              <option key={key} value={key}>{tc('studyVariables', key, 'label', label)}</option>
            ))}
          </select>
        </label>
        <label className="min-w-0">
          <span className={labelStyle}>{t('analysis.place')}</span>
          <select value={place} className={selectStyle} onChange={event => {
            const selected = event.target.value
            setSelection(previous => {
              const before = periodFor(previous.variable, previous.place)
              const after = periodFor(previous.variable, selected)
              const samePeriod = before.from === after.from && before.to === after.to
              return { ...previous, place: selected, ...(samePeriod ? {} : after) }
            })
          }}>
            {current.places.map(key => <option key={key} value={key}>{tc('studyPlaces', key, 'label', places[key].label)}</option>)}
          </select>
        </label>
        <YearSelect label={t('analysis.from')} value={from} first={bounds.from} last={to} onChange={year => {
          setSelection(previous => ({ ...previous, from: year }))
        }} />
        <YearSelect label={t('analysis.to')} value={to} first={from} last={bounds.to} onChange={year => {
          setSelection(previous => ({ ...previous, to: year }))
        }} />
      </div>
      {custom && (
        <LivePlaceForm coordinates={coordinates} onChange={setCoordinates} live={live} onSubmit={loadLive} />
      )}
      {bounds.to === 2025 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label={t('analysis.demoPeriods')}>
          {[1981, 2003].map(year => (
            <button
              key={year} type="button" aria-pressed={from === year && to === 2025}
              className="rounded-md border border-hud-border px-3 py-1.5 font-mono text-xs text-ink-secondary aria-pressed:border-terra-400/50 aria-pressed:bg-terra-400/10 aria-pressed:text-terra-400"
              onClick={() => setSelection(previous => ({ ...previous, from: year, to: 2025 }))}
            >
              {year}–2025
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-sm text-ink">{tc('studyVariables', variable, 'definition', current.definition)}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-secondary">
        {cell
          ? t('analysis.cellLive', {
            height: Math.round(cell.heightKm),
            width: Math.round(cell.widthKm),
            lat: formatCoordinate(cell.latitude, 'latitude', 3, locale),
            lon: formatCoordinate(cell.longitude, 'longitude', 3, locale),
          })
          : t('analysis.cellDefault')}
        {rain && !custom && ` ${t('analysis.imergYears')}`}
      </p>
      {ready && (
        <>
          <div className="mt-4 border-t border-hud-border pt-4">
            <TrendChart series={series} from={from} to={to} unit={unit} />
          </div>
          <div className="mt-4">
            <TrendResults
              series={series} variable={variable} unit={unit}
              from={from} to={to} month={rain && !custom ? june2025(dataset) : null}
            />
          </div>
        </>
      )}
    </section>
  )
}

function LivePlaceForm({ coordinates, onChange, live, onSubmit }) {
  const { t } = useT()
  const latitude = parseCoordinate(coordinates.latitude)
  const longitude = parseCoordinate(coordinates.longitude)
  const filled = coordinates.latitude.trim() !== '' && coordinates.longitude.trim() !== ''
  const valid = isValidPoint(latitude, longitude)
  const loading = live.status === 'loading'

  let message = t('analysis.live.hint')
  if (filled && !valid) message = t('analysis.live.range')
  else if (loading) message = t('analysis.live.loading')
  else if (live.status === 'error') {
    const code = LIVE_ERROR_CODES.has(live.code) ? live.code : 'network'
    message = `${t(`analysis.liveErrors.${code}`)} ${t('analysis.live.offline')}`
  } else if (live.status === 'ready') message = t('analysis.live.ready', { place: customPlace(live.data).label })

  return (
    <form
      className="mt-3 rounded-lg border border-hud-border bg-space-950/50 p-3" aria-label={t('analysis.live.formLabel')}
      onSubmit={event => {
        event.preventDefault()
        if (valid && !loading) onSubmit(latitude, longitude)
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        {[['latitude', t('analysis.live.latitude'), '-12.05'], ['longitude', t('analysis.live.longitude'), '-77.04']].map(([key, label, example]) => (
          <label key={key} className="min-w-0">
            <span className={labelStyle}>{label}</span>
            <input
              type="text" autoComplete="off" placeholder={example} value={coordinates[key]} className={selectStyle}
              onChange={event => onChange({ ...coordinates, [key]: event.target.value })}
            />
          </label>
        ))}
        <button
          type="submit" disabled={!valid || loading}
          className="min-h-10 rounded-md border border-terra-400/50 bg-terra-400/10 px-4 text-sm font-medium text-terra-400 disabled:opacity-50"
        >
          {t('analysis.live.submit')}
        </button>
      </div>
      <p role="status" className="mt-2 text-xs leading-relaxed text-ink-secondary">{message}</p>
    </form>
  )
}

function YearSelect({ label, first, last, value, onChange }) {
  return (
    <label className="min-w-0">
      <span className={labelStyle}>{label}</span>
      <select value={value} className={selectStyle} onChange={event => onChange(Number(event.target.value))}>
        {Array.from({ length: last - first + 1 }, (_, i) => first + i).map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </label>
  )
}
