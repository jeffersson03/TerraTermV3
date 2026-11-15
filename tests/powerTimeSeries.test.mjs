import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getPowerTimeSeries, toMonthlySeries } from '../src/services/nasa/powerTimeSeries.js'
import { fetchPowerMonthly } from '../src/services/nasa/powerService.js'

const dataset = JSON.parse(readFileSync(
  new URL('../src/features/analysis/data/ica-pisco.json', import.meta.url), 'utf8',
))

// Respuesta con la forma real de la API, armada con la copia verificada de Ica.
function powerResponse(latitude, longitude) {
  const parameter = {}
  for (const [name, years] of Object.entries(dataset.power.ica)) {
    parameter[name] = {}
    for (const [year, months] of Object.entries(years)) {
      months.forEach((value, month) => { parameter[name][`${year}${String(month + 1).padStart(2, '0')}`] = value })
    }
  }
  return {
    geometry: { coordinates: [longitude, latitude, 100] },
    properties: { parameter }, header: { fill_value: -999 },
  }
}

const lstVariable = { id: 'lst', unit: '°C', series: { provider: 'power', parameter: 'TS' } }

test('monthly series keep the requested years and skip missing months', () => {
  const series = toMonthlySeries({ 2003: [1, 2, null, 4, 5, 6, 7, 8, 9, 10, 11, 12], 2004: Array(12).fill(3) },
    { start: '2003-01-01', end: '2003-12-31' })
  assert.equal(series.length, 11)
  assert.deepEqual(series[0], { date: '2003-01', value: 1 })
  assert.ok(!series.some(point => point.date === '2003-03'))
})

test('the adapter returns the common { data, meta } contract with real values', async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, json: async () => powerResponse(-20.5, -70.5) })
  const response = await getPowerTimeSeries({
    variable: lstVariable, location: { lat: -20.5, lon: -70.5 },
    period: { start: '2003-01-01', end: '2024-12-31' }, fetchImpl,
  })
  assert.equal(response.data.length, 22 * 12)
  assert.deepEqual(response.data[0], { date: '2003-01', value: dataset.power.ica.TS[2003][0] })
  assert.equal(response.meta.kind, 'estimate')
  assert.equal(response.meta.unit, '°C')
  assert.match(response.meta.source, /NASA POWER/)
})

test('simultaneous requests for the same cell share one call', async () => {
  let calls = 0
  const fetchImpl = async () => {
    calls++
    await new Promise(resolve => setTimeout(resolve, 10))
    return { ok: true, status: 200, json: async () => powerResponse(-21.5, -71.5) }
  }
  const [a, b] = await Promise.all([
    fetchPowerMonthly({ latitude: -21.5, longitude: -71.5, fetchImpl }),
    fetchPowerMonthly({ latitude: -21.5, longitude: -71.5, fetchImpl }),
  ])
  assert.equal(calls, 1)
  assert.equal(a, b)
})

test('an aborted query rejects without returning data', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(
    getPowerTimeSeries({ variable: lstVariable, location: { lat: -22.5, lon: -72.5 }, period: { start: '2003-01-01', end: '2024-12-31' }, signal: controller.signal }),
    { name: 'AbortError' },
  )
})
