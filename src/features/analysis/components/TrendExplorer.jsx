import { useState } from 'react'
import { isValidPoint, powerCell } from '@/services/nasa/powerService.js'
import dataset from '../data/ica-pisco.json'
import { analyzeStudy, customPlace, formatCoordinate, june2025, periodFor, places, variables } from '../utils/study.js'
import TrendChart from './TrendChart.jsx'
import TrendResults from './TrendResults.jsx'
import { usePowerPlace } from '../hooks/usePowerPlace.js'

const selectStyle = 'min-h-10 w-full min-w-0 rounded-md border border-hud-border bg-space-950 px-2.5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-aqua-400'
const labelStyle = 'mb-1 block text-xs font-medium text-ink-secondary'

const liveErrors = {
  timeout: 'NASA POWER tardó demasiado en responder.',
  network: 'No se pudo conectar con NASA POWER. Revisa la conexión.',
  rejected: 'NASA POWER no aceptó esas coordenadas.',
  http: 'NASA POWER respondió con un error.',
  format: 'La respuesta de NASA POWER no tiene el formato esperado.',
}

function defaultSelection(variable, place = variables[variable].defaultPlace) {
  return { variable, place, ...periodFor(variable, place) }
}

function parseCoordinate(text) {
  return text.trim() === '' ? NaN : Number(text.trim().replace(',', '.').replace('−', '-'))
}

export default function TrendExplorer() {
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
  const series = ready ? analyzeStudy(source, selection, definitions) : []
  const cell = custom && ready ? powerCell(live.data.latitude, live.data.longitude) : null

  return (
    <section className="min-w-0 px-4 py-5 sm:px-6 lg:mx-auto lg:max-w-3xl" aria-labelledby="analysis-title">
      <h2 id="analysis-title" className="text-xl font-semibold tracking-tight">Explora las tendencias</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="min-w-0">
          <span className={labelStyle}>Variable</span>
          <select value={variable} className={selectStyle} onChange={event => {
            const selected = event.target.value
            setSelection(previous => defaultSelection(selected, previous.place === 'custom' ? 'custom' : undefined))
          }}>
            {Object.entries(variables).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="min-w-0">
          <span className={labelStyle}>Lugar</span>
          <select value={place} className={selectStyle} onChange={event => {
            const selected = event.target.value
            setSelection(previous => {
              const before = periodFor(previous.variable, previous.place)
              const after = periodFor(previous.variable, selected)
              const samePeriod = before.from === after.from && before.to === after.to
              return { ...previous, place: selected, ...(samePeriod ? {} : after) }
            })
          }}>
            {current.places.map(key => <option key={key} value={key}>{places[key].label}</option>)}
          </select>
        </label>
        <YearSelect label="Desde" value={from} first={bounds.from} last={to} onChange={year => {
          setSelection(previous => ({ ...previous, from: year }))
        }} />
        <YearSelect label="Hasta" value={to} first={from} last={bounds.to} onChange={year => {
          setSelection(previous => ({ ...previous, to: year }))
        }} />
      </div>
      {custom && (
        <LivePlaceForm coordinates={coordinates} onChange={setCoordinates} live={live} onSubmit={loadLive} />
      )}
      {bounds.to === 2025 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Periodos de la demo">
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
      <p className="mt-3 text-sm text-ink">{current.definition}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-secondary">
        {cell
          ? `La celda consultada mide unos ${Math.round(cell.heightKm)} × ${Math.round(cell.widthKm)} km y su centro está en ${formatCoordinate(cell.latitude, 'latitude', 3)}, ${formatCoordinate(cell.longitude, 'longitude', 3)}.`
          : 'Cada celda de POWER abarca unos 56 × 67 km en estas latitudes.'}
        {rain && !custom && ' El contraste anual con IMERG usa años completos de 2003 a 2024.'}
      </p>
      {ready && (
        <>
          <div className="mt-4 border-t border-hud-border pt-4">
            <TrendChart series={series} from={from} to={to} unit={current.unit} />
          </div>
          <div className="mt-4">
            <TrendResults
              series={series} variable={variable} unit={current.unit}
              from={from} to={to} month={rain && !custom ? june2025(dataset) : null}
            />
          </div>
        </>
      )}
    </section>
  )
}

function LivePlaceForm({ coordinates, onChange, live, onSubmit }) {
  const latitude = parseCoordinate(coordinates.latitude)
  const longitude = parseCoordinate(coordinates.longitude)
  const filled = coordinates.latitude.trim() !== '' && coordinates.longitude.trim() !== ''
  const valid = isValidPoint(latitude, longitude)
  const loading = live.status === 'loading'

  let message = 'Usa grados decimales; sur y oeste van en negativo. Ejemplo: −12.05 y −77.04 (Lima).'
  if (filled && !valid) message = 'La latitud va de −90 a 90 y la longitud de −180 a 180.'
  else if (loading) message = 'Consultando NASA POWER… puede tardar unos segundos.'
  else if (live.status === 'error') message = `${liveErrors[live.code] ?? liveErrors.network} Los ejemplos de Ica y Pisco siguen disponibles sin conexión.`
  else if (live.status === 'ready') message = `Datos recibidos de NASA POWER para ${customPlace(live.data).label}.`

  return (
    <form
      className="mt-3 rounded-lg border border-hud-border bg-space-950/50 p-3" aria-label="Consulta en vivo a NASA POWER"
      onSubmit={event => {
        event.preventDefault()
        if (valid && !loading) onSubmit(latitude, longitude)
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        {[['latitude', 'Latitud', '-12.05'], ['longitude', 'Longitud', '-77.04']].map(([key, label, example]) => (
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
          Consultar
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
