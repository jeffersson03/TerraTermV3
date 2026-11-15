// Cliente de la API mensual REGIONAL de NASA POWER (rejilla 0,5° × 0,625°).
// Límites comprobados con la API (respuestas 422): entre 2° y 10° de latitud y de longitud
// por consulta, y un solo parámetro. Un área mayor se parte en mosaicos iguales; se piden
// de dos en dos y cada mosaico queda en caché.
// Rutas relativas (no `@/`) para poder probarlo con `node --test`.
import { PowerError } from './powerService.js'

const endpoint = 'https://power.larc.nasa.gov/api/temporal/monthly/regional'
const MAX_SPAN_DEG = 9.99 // margen para el redondeo de las coordenadas en la URL
const MIN_SPAN_DEG = 2
const CONCURRENCY = 2
const TIMEOUT_MS = 60000

const cache = new Map()
const pending = new Map()

// Parte un eje en tramos iguales de MIN_SPAN a MAX_SPAN grados (si es más corto, lo amplía).
function splitAxis(min, max) {
  if (max - min < MIN_SPAN_DEG) {
    const center = (min + max) / 2
    return [[center - MIN_SPAN_DEG / 2, center + MIN_SPAN_DEG / 2]]
  }
  const parts = Math.ceil((max - min) / MAX_SPAN_DEG)
  const step = (max - min) / parts
  return Array.from({ length: parts }, (_, i) => [min + i * step, i === parts - 1 ? max : min + (i + 1) * step])
}

// Divide [oeste, sur, este, norte] en mosaicos válidos para la API regional.
export function splitBbox([west, south, east, north]) {
  const tiles = []
  for (const [s, n] of splitAxis(south, north)) {
    for (const [w, e] of splitAxis(west, east)) tiles.push([w, s, e, n])
  }
  return tiles
}

export function regionalUrl([west, south, east, north], parameter, from, to) {
  const round = (value) => String(Math.round(value * 1000) / 1000)
  return `${endpoint}?` + new URLSearchParams({
    'latitude-min': round(south), 'latitude-max': round(north),
    'longitude-min': round(west), 'longitude-max': round(east),
    parameters: parameter, community: 'RE', start: String(from), end: String(to), format: 'JSON',
  })
}

// FeatureCollection → [{ lat, lon, years: { '2001': [12 valores | null] } }]
// La clave AAAA13 (resumen anual del proveedor) se ignora; el relleno pasa a null.
export function parseRegional(json, parameter) {
  if (!Array.isArray(json?.features)) throw new PowerError('format')
  const fill = json.header?.fill_value ?? -999
  return json.features.flatMap((feature) => {
    const [lon, lat] = feature?.geometry?.coordinates ?? []
    const values = feature?.properties?.parameter?.[parameter]
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !values) return []
    const years = {}
    for (const [key, value] of Object.entries(values)) {
      const match = /^(\d{4})(\d{2})$/.exec(key)
      const month = match ? Number(match[2]) : 0
      if (month < 1 || month > 12) continue
      years[match[1]] ??= Array(12).fill(null)
      years[match[1]][month - 1] = Number.isFinite(value) && value !== fill ? value : null
    }
    return [{ lat, lon, years }]
  })
}

async function requestTile(url, parameter, fetchImpl) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetchImpl(url, { signal: controller.signal })
    if (!response.ok) {
      const detail = await response.json().then((body) => body?.messages?.[0]).catch(() => undefined)
      throw new PowerError(response.status === 422 ? 'rejected' : 'http', detail)
    }
    return parseRegional(await response.json(), parameter)
  } catch (error) {
    if (error instanceof PowerError) throw error
    if (controller.signal.aborted) throw new PowerError('timeout')
    throw new PowerError(error instanceof SyntaxError ? 'format' : 'network')
  } finally {
    clearTimeout(timer)
  }
}

// Un mosaico con caché y unión de peticiones iguales en curso (un fallo no se guarda).
function fetchTile(tile, parameter, from, to, fetchImpl) {
  const url = regionalUrl(tile, parameter, from, to)
  if (cache.has(url)) return Promise.resolve(cache.get(url))
  if (pending.has(url)) return pending.get(url)
  const request = requestTile(url, parameter, fetchImpl)
    .then((points) => {
      cache.set(url, points)
      return points
    })
    .finally(() => pending.delete(url))
  pending.set(url, request)
  return request
}

/**
 * Serie mensual de un parámetro en todos los puntos de la rejilla de un área.
 * @param {{ bbox: number[], parameter: string, from: number, to: number, onProgress?: (done:number, total:number) => void }} query
 * @returns {Promise<Array<{ lat:number, lon:number, years:object }>>} puntos sin duplicados
 */
export async function fetchPowerRegionalMonthly({ bbox, parameter, from, to, onProgress, fetchImpl = globalThis.fetch }) {
  const tiles = splitBbox(bbox)
  const results = new Array(tiles.length)
  let next = 0
  let done = 0

  async function worker() {
    while (next < tiles.length) {
      const index = next++
      results[index] = await fetchTile(tiles[index], parameter, from, to, fetchImpl)
      onProgress?.(++done, tiles.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tiles.length) }, worker))

  // Los mosaicos vecinos comparten el borde: se quitan los puntos repetidos.
  const unique = new Map()
  for (const point of results.flat()) unique.set(`${point.lat}|${point.lon}`, point)
  return [...unique.values()]
}
