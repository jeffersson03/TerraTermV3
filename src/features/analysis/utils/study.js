// Ruta relativa (no `@/`): los tests de `node --test` importan este módulo y Node no resuelve el alias de Vite.
import { powerCoverage, powerUrl } from '../../../services/nasa/powerService.js'
import { format } from './format.js'
import { analyzeTrend, findLevelShift } from './trend.js'

export const variables = {
  T2M: {
    label: 'Temperatura del aire', unit: '°C',
    definition: 'Qué tan cálido está el aire a 2 metros del suelo.',
    from: 1981, to: 2025, defaultPlace: 'ica',
    places: ['ica', 'custom'],
  },
  TS: {
    label: 'Temperatura superficial', unit: '°C',
    definition: 'Qué tan cálida está la superficie de la tierra o del mar.',
    from: 1981, to: 2025, defaultPlace: 'compare',
    places: ['ica', 'pisco', 'compare', 'custom'],
  },
  PRECTOTCORR: {
    label: 'Precipitación', unit: 'mm',
    definition: 'Cuánta precipitación se acumula en la celda durante el año.',
    from: 2003, to: 2024, defaultPlace: 'ica',
    places: ['ica', 'custom'],
  },
}

export const places = {
  ica: { label: 'Ica', latitude: '14,07° S', longitude: '75,73° O', elevation: '1.320 m', lat: -14.07, lon: -75.73 },
  pisco: { label: 'Mar frente a Pisco', latitude: '14,00° S', longitude: '77,00° O', lat: -14, lon: -77 },
  compare: { label: 'Ica y mar frente a Pisco' },
  custom: { label: 'Otro lugar (consulta en vivo)' },
}

// La lluvia de Ica se limita a los años comparables con IMERG; el resto usa toda la cobertura de POWER.
export function periodFor(variable, place) {
  return variable === 'PRECTOTCORR' && place !== 'custom'
    ? { from: variables[variable].from, to: variables[variable].to }
    : { ...powerCoverage }
}

export function formatCoordinate(value, axis, digits = 2) {
  const hemisphere = axis === 'latitude' ? (value < 0 ? 'S' : 'N') : (value < 0 ? 'O' : 'E')
  return `${format(Math.abs(value), digits)}° ${hemisphere}`
}

// Definición de un punto consultado en vivo, con la misma forma que los lugares guardados.
export function customPlace({ latitude, longitude, elevation, version, fetchedAt }) {
  const shown = { latitude: formatCoordinate(latitude, 'latitude'), longitude: formatCoordinate(longitude, 'longitude') }
  return {
    ...shown, label: `${shown.latitude}, ${shown.longitude}`, lat: latitude, lon: longitude,
    elevation: Number.isFinite(elevation)
      ? `${String(Math.round(elevation)).replace(/\B(?=(\d{3})+$)/g, '.')} m` : undefined,
    live: { version, fetchedAt },
  }
}

export const sources = {
  power: {
    label: 'NASA POWER / MERRA-2',
    resolution: '0,5° × 0,625°',
  },
  imerg: {
    label: 'GPM IMERG (NASA), extracto servido por USF',
    resolution: '0,1°, ponderada sobre la celda de Ica',
    href: 'https://erddap.marine.usf.edu/erddap/griddap/IMERG_monthly_global_precip.html',
  },
}

function daysInMonth(year, monthIndex) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}

export function annualSeries(monthly, from, to, aggregation) {
  const years = []
  for (let year = from; year <= to; year++) {
    const values = monthly[year]
    if (values?.length !== 12 || !values.every(value => Number.isFinite(value) && value !== -999)) continue
    if (aggregation === 'monthlyTotal') {
      years.push({ year, value: values.reduce((sum, value) => sum + value, 0) })
      continue
    }
    const days = values.map((_, month) => daysInMonth(year, month))
    const total = values.reduce((sum, value, month) => sum + value * days[month], 0)
    years.push({ year, value: aggregation === 'dailyRate' ? total : total / days.reduce((a, b) => a + b) })
  }
  return years
}

export function powerLink(definition, variable) {
  return powerUrl({ latitude: definition.lat, longitude: definition.lon, parameters: variable })
}

export function analyzeStudy(dataset, { variable, place, from, to }, definitions = places) {
  const rain = variable === 'PRECTOTCORR'
  const locations = place === 'compare' ? ['ica', 'pisco'] : [place]
  const inputs = locations.map(id => ({
    id, place: id, source: 'power', label: rain ? 'NASA POWER' : definitions[id].label, definition: definitions[id],
    points: annualSeries(dataset.power[id][variable], from, to, rain ? 'dailyRate' : 'mean'),
  }))
  if (rain && place === 'ica') inputs.push({
    id: 'imerg', place: 'ica', source: 'imerg', label: 'GPM IMERG vía USF', definition: definitions.ica,
    points: annualSeries(dataset.imerg, from, to, 'monthlyTotal'),
  })
  const commonYears = inputs.reduce((common, input) => {
    const years = new Set(input.points.map(({ year }) => year))
    return common.filter(year => years.has(year))
  }, inputs[0].points.map(({ year }) => year))
  const allowed = new Set(commonYears)
  return inputs.map(input => {
    const points = input.points.filter(({ year }) => allowed.has(year))
    const trend = analyzeTrend(points)
    const shift = rain ? findLevelShift(points, trend.outliers) : null
    return { ...input, points, trend, shift }
  })
}

export function june2025(dataset) {
  const rate = dataset.power.ica.PRECTOTCORR[2025][5]
  return { power: rate * daysInMonth(2025, 5), imerg: dataset.imerg[2025][5] }
}
