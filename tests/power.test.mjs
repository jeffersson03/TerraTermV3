import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  fetchPowerMonthly, isValidPoint, parsePowerMonthly, powerCell, powerUrl,
} from '../src/services/nasa/powerService.js'
import { analyzeStudy, customPlace, periodFor, places } from '../src/features/analysis/utils/study.js'
import { verdicts } from '../src/features/analysis/utils/trend.js'

const dataset = JSON.parse(readFileSync(
  new URL('../src/features/analysis/data/ica-pisco.json', import.meta.url), 'utf8',
))

// Respuesta con la forma real de la API, armada con la copia verificada de Ica.
function powerResponse(point, { latitude, longitude, elevation }) {
  const parameter = {}
  for (const [name, years] of Object.entries(point)) {
    parameter[name] = {}
    for (const [year, months] of Object.entries(years)) {
      months.forEach((value, month) => { parameter[name][`${year}${String(month + 1).padStart(2, '0')}`] = value })
      parameter[name][`${year}13`] = 999
    }
  }
  return {
    type: 'Feature', geometry: { type: 'Point', coordinates: [longitude, latitude, elevation] },
    properties: { parameter }, header: { fill_value: -999, api: { version: 'v2.10.0' } },
  }
}
const icaResponse = () => powerResponse(dataset.power.ica, { latitude: -14.07, longitude: -75.73, elevation: 1319.63 })
const reply = (body, status = 200) => async () => ({ ok: status < 400, status, json: async () => body })
const near = (actual, expected, tolerance = 0.00006) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`)

test('the request URL and the model cell match the Ica reference', () => {
  assert.equal(
    powerUrl({ latitude: -14.07, longitude: -75.73 }),
    'https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M%2CTS%2CPRECTOTCORR&community=RE&longitude=-75.73&latitude=-14.07&start=1981&end=2025&format=JSON',
  )
  const cell = powerCell(-14.07, -75.73)
  assert.deepEqual(
    [cell.latitude, cell.longitude, cell.south, cell.north, cell.west, cell.east],
    [-14, -75.625, -14.25, -13.75, -75.9375, -75.3125],
  )
  assert.deepEqual([Math.round(cell.heightKm), Math.round(cell.widthKm)], [56, 67])
  assert.equal(isValidPoint(-91, 0), false)
  assert.equal(isValidPoint(NaN, 0), false)
})

test('a live response reproduces the verified results through the same engine', async () => {
  const data = await fetchPowerMonthly({ latitude: -14.07, longitude: -75.73, fetchImpl: reply(icaResponse()) })
  assert.deepEqual(data.series.T2M, dataset.power.ica.T2M)
  assert.equal(Object.keys(data.series.T2M).length, 45)
  assert.equal(data.elevation, 1319.63)

  const definitions = { ...places, custom: customPlace(data) }
  assert.equal(definitions.custom.label, '14,07° S, 75,73° O')
  assert.equal(definitions.custom.elevation, '1.320 m')
  const live = { ...dataset, power: { ...dataset.power, custom: data.series } }
  const [air] = analyzeStudy(live, { variable: 'T2M', place: 'custom', from: 2003, to: 2025 }, definitions)
  near(air.trend.slope, 0.3748)
  near(air.trend.interval[0], 0.1731)
  near(air.trend.interval[1], 0.5765)
  assert.equal(air.trend.verdict, verdicts.evidence)

  assert.deepEqual(periodFor('PRECTOTCORR', 'custom'), { from: 1981, to: 2025 })
  assert.deepEqual(periodFor('PRECTOTCORR', 'ica'), { from: 2003, to: 2024 })
  const rain = analyzeStudy(live, { variable: 'PRECTOTCORR', place: 'custom', from: 2003, to: 2025 }, definitions)
  assert.equal(rain.length, 1)
  assert.equal(rain[0].points.length, 23)
  near(rain[0].trend.slope, 92.0302)
  near(rain[0].points.at(-1).value, 389.68)
  assert.deepEqual(rain[0].trend.outliers, [2025])
})

test('fill values exclude the year and the provider summary is ignored', () => {
  const response = icaResponse()
  response.properties.parameter.T2M['200406'] = -999
  const { series } = parsePowerMonthly(response)
  assert.equal(series.T2M[2004][5], null)
  assert.equal(series.T2M[2004].length, 12)
  const live = { power: { custom: series } }
  const [air] = analyzeStudy(live, { variable: 'T2M', place: 'custom', from: 2003, to: 2025 }, { custom: { label: 'x' } })
  assert.equal(air.points.length, 22)
  assert.ok(!air.points.some(point => point.year === 2004))
})

test('failures are reported with a code the interface can explain', async () => {
  const code = promise => promise.then(() => 'ok', error => error.code)
  assert.equal(await code(fetchPowerMonthly({ latitude: 120, longitude: 0 })), 'invalid')
  assert.equal(await code(fetchPowerMonthly({
    latitude: 1, longitude: 1, fetchImpl: reply({ messages: ['Please provide a correct latitude value.'] }, 422),
  })), 'rejected')
  assert.equal(await code(fetchPowerMonthly({ latitude: 2, longitude: 2, fetchImpl: reply({}, 503) })), 'http')
  assert.equal(await code(fetchPowerMonthly({ latitude: 3, longitude: 3, fetchImpl: reply({ nada: true }) })), 'format')
  assert.equal(await code(fetchPowerMonthly({
    latitude: 4, longitude: 4, fetchImpl: async () => { throw new TypeError('Failed to fetch') },
  })), 'network')
  assert.equal(await code(fetchPowerMonthly({
    latitude: 5, longitude: 5, timeoutMs: 20,
    fetchImpl: (_, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))),
  })), 'timeout')
})

test('the exact query identifies a cached response', async () => {
  const requests = []
  const counting = async url => {
    requests.push(url)
    const latitude = Number(new URL(url).searchParams.get('latitude'))
    return { ok: true, status: 200, json: async () => powerResponse(dataset.power.ica, { latitude, longitude: -75.73, elevation: 1 }) }
  }
  // Los dos puntos quedan a ambos lados del límite de celda de −14,25.
  const south = await fetchPowerMonthly({ latitude: -14.25001, longitude: -75.73, fetchImpl: counting })
  const north = await fetchPowerMonthly({ latitude: -14.24999, longitude: -75.73, fetchImpl: counting })
  assert.equal(requests.length, 2)
  assert.notEqual(requests[0], requests[1])
  assert.deepEqual([south.latitude, north.latitude], [-14.25001, -14.24999])
  assert.notEqual(powerCell(-14.25001, -75.73).latitude, powerCell(-14.24999, -75.73).latitude)

  const again = await fetchPowerMonthly({ latitude: -14.24999, longitude: -75.73, fetchImpl: counting })
  assert.equal(requests.length, 2)
  assert.equal(again, north)
})

test('an incomplete response is rejected as a format error and is not cached', async () => {
  const code = promise => promise.then(() => 'ok', error => error.code)
  const without = name => { const body = icaResponse(); delete body.properties.parameter[name]; return body }
  const empty = icaResponse(); empty.properties.parameter.TS = {}
  const noPoint = icaResponse(); delete noPoint.geometry
  const badPoint = icaResponse(); badPoint.geometry.coordinates = [-75.73, 'x', 0]

  assert.equal(await code(fetchPowerMonthly({ latitude: 6, longitude: 6, fetchImpl: reply(without('TS')) })), 'format')
  assert.equal(await code(fetchPowerMonthly({ latitude: 7, longitude: 7, fetchImpl: reply(empty) })), 'format')
  assert.equal(await code(fetchPowerMonthly({ latitude: 8, longitude: 8, fetchImpl: reply(noPoint) })), 'format')
  assert.equal(await code(fetchPowerMonthly({ latitude: 9, longitude: 9, fetchImpl: reply(badPoint) })), 'format')
  assert.throws(() => parsePowerMonthly(without('PRECTOTCORR')), { code: 'format' })

  // Un mes ausente sigue siendo un dato faltante, no un error de formato.
  const gap = icaResponse(); gap.properties.parameter.TS['201003'] = -999
  assert.equal(parsePowerMonthly(gap).series.TS[2010][2], null)

  // El fallo no queda guardado: la misma consulta funciona cuando la respuesta llega completa.
  assert.equal(await code(fetchPowerMonthly({ latitude: 6, longitude: 6, fetchImpl: reply(icaResponse()) })), 'ok')
})
