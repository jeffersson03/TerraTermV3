// Cliente de la API mensual por punto de NASA POWER.
// Es pública: no usa clave ni cuenta y admite consultas directas desde el navegador.
const endpoint = 'https://power.larc.nasa.gov/api/temporal/monthly/point'

export const powerParameters = ['T2M', 'TS', 'PRECTOTCORR']
export const powerCoverage = { from: 1981, to: 2025 }

// Cuadrícula meteorológica de MERRA-2: 0,5° de latitud por 0,625° de longitud.
const grid = { latitude: 0.5, longitude: 0.625 }
const kmPerDegree = 111.2
const cache = new Map()
// Consultas en curso: si dos componentes piden la misma celda a la vez, comparten una sola llamada.
const pending = new Map()

// code: invalid | timeout | network | rejected | http | format
export class PowerError extends Error {
  constructor(code, detail) {
    super(detail ?? code)
    this.name = 'PowerError'
    this.code = code
  }
}

export function isValidPoint(latitude, longitude) {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
}

export function powerUrl({
  latitude, longitude, parameters = powerParameters, from = powerCoverage.from, to = powerCoverage.to,
}) {
  return `${endpoint}?` + new URLSearchParams({
    parameters: [parameters].flat().join(','), community: 'RE',
    longitude: String(longitude), latitude: String(latitude),
    start: String(from), end: String(to), format: 'JSON',
  })
}

// Celda del modelo que contiene el punto: centro, límites y tamaño aproximado.
export function powerCell(latitude, longitude) {
  const centerLatitude = Math.round(latitude / grid.latitude) * grid.latitude
  const centerLongitude = Math.round((longitude + 180) / grid.longitude) * grid.longitude - 180
  return {
    latitude: centerLatitude, longitude: centerLongitude,
    south: centerLatitude - grid.latitude / 2, north: centerLatitude + grid.latitude / 2,
    west: centerLongitude - grid.longitude / 2, east: centerLongitude + grid.longitude / 2,
    heightKm: grid.latitude * kmPerDegree,
    widthKm: grid.longitude * kmPerDegree * Math.cos(centerLatitude * Math.PI / 180),
  }
}

// Convierte la respuesta en { variable: { año: [12 valores mensuales] } }.
// La clave AAAA13 es el resumen anual del proveedor y se ignora; el valor de relleno pasa a null.
// Una respuesta sin alguna variable pedida, sin meses o sin coordenadas válidas se rechaza como 'format'.
export function parsePowerMonthly(json, required = powerParameters) {
  const parameters = json?.properties?.parameter
  if (!parameters || typeof parameters !== 'object') throw new PowerError('format')
  const fill = json.header?.fill_value ?? -999
  const series = {}
  for (const [name, values] of Object.entries(parameters)) {
    const years = {}
    for (const [key, value] of Object.entries(values ?? {})) {
      const match = /^(\d{4})(\d{2})$/.exec(key)
      const month = match ? Number(match[2]) : 0
      if (month < 1 || month > 12) continue
      years[match[1]] ??= Array(12).fill(null)
      years[match[1]][month - 1] = Number.isFinite(value) && value !== fill ? value : null
    }
    series[name] = years
  }
  const [longitude, latitude, elevation] = json.geometry?.coordinates ?? []
  const complete = required.every(name => series[name] && Object.keys(series[name]).length > 0)
  if (!complete || !isValidPoint(latitude, longitude)) throw new PowerError('format')
  return { series, latitude, longitude, elevation, version: json.header?.api?.version ?? null }
}

export async function fetchPowerMonthly({ latitude, longitude, timeoutMs = 30000, fetchImpl = globalThis.fetch }) {
  if (!isValidPoint(latitude, longitude)) throw new PowerError('invalid')
  // La consulta exacta identifica la respuesta guardada: dos puntos cercanos pueden caer en celdas distintas.
  const url = powerUrl({ latitude, longitude })
  if (cache.has(url)) return cache.get(url)
  if (pending.has(url)) return pending.get(url)

  // Solo se guarda en caché una respuesta válida; un fallo se puede reintentar.
  const request = requestPowerMonthly(url, timeoutMs, fetchImpl)
    .then((result) => {
      cache.set(url, result)
      return result
    })
    .finally(() => pending.delete(url))
  pending.set(url, request)
  return request
}

async function requestPowerMonthly(url, timeoutMs, fetchImpl) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(url, { signal: controller.signal })
    if (!response.ok) {
      const detail = await response.json().then(body => body?.messages?.[0]).catch(() => undefined)
      throw new PowerError(response.status === 422 ? 'rejected' : 'http', detail)
    }
    return { ...parsePowerMonthly(await response.json()), fetchedAt: new Date().toISOString() }
  } catch (error) {
    if (error instanceof PowerError) throw error
    if (controller.signal.aborted) throw new PowerError('timeout')
    throw new PowerError(error instanceof SyntaxError ? 'format' : 'network')
  } finally {
    clearTimeout(timer)
  }
}
