import assert from 'node:assert/strict'
import test from 'node:test'
import { parseRegional, splitBbox } from '../src/services/nasa/powerRegionalService.js'
import { averageAnnual, computeRegionTrends, toAnnualMap } from '../src/features/map2d/utils/trendGrid.js'

test('tiles respect the regional API limits (2° to 10° per axis)', () => {
  // Vista de Perú: ~20,3° de latitud y ~19,6° de longitud (antes quedaba un borde de 0,3° → 422)
  const tiles = splitBbox([-87.337, -19.345, -67.687, 0.959])
  assert.equal(tiles.length, 6) // 3 tramos de latitud × 2 de longitud
  for (const [w, s, e, n] of tiles) {
    assert.ok(n - s >= 2 && n - s <= 10, `lat span ${n - s}`)
    assert.ok(e - w >= 2 && e - w <= 10, `lon span ${e - w}`)
  }
  // Un área pequeña se amplía a 2°
  const [[w, s, e, n]] = splitBbox([-76, -12, -75, -11.5])
  assert.ok(Math.abs(n - s - 2) < 1e-9 && Math.abs(e - w - 2) < 1e-9)
})

test('the regional response is parsed into grid points without the annual summary', () => {
  const points = parseRegional({
    header: { fill_value: -999 },
    features: [{ geometry: { coordinates: [-80, -12, 0] }, properties: { parameter: { TS: { 200101: 23.8, 200102: -999, 200113: 20 } } } }],
  }, 'TS')
  assert.equal(points.length, 1)
  assert.deepEqual([points[0].lat, points[0].lon], [-12, -80])
  assert.equal(points[0].years['2001'][0], 23.8)
  assert.equal(points[0].years['2001'][1], null)
  assert.equal(points[0].years['2001'].length, 12)
})

test('a zone averages its grid points and gets a warming trend', () => {
  const years = (offset) => Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [2001 + i, Array(12).fill(20 + offset + 0.03 * i)]),
  )
  const points = [
    { lat: -12, lon: -80, years: years(0) },
    { lat: -12, lon: -79.375, years: years(1) },
    { lat: -5, lon: -70, years: years(5) }, // fuera de la zona
  ]
  const ocean = { id: 'ocean-a', kind: 'ocean', center: { lat: -12, lon: -79.7 }, bbox: [-80.5, -12.5, -79, -11.5] }
  const far = { id: 'ocean-far', kind: 'ocean', center: { lat: 30, lon: 30 }, bbox: [29, 29, 31, 31] }
  const result = computeRegionTrends([ocean, far], points, 2001, 2020)

  const entry = result.get('ocean-a')
  assert.equal(entry.pointCount, 2)
  assert.equal(entry.annual.length, 20)
  assert.ok(Math.abs(entry.annual[0].value - 20.5) < 1e-9)
  assert.ok(Math.abs(entry.trend.slopePerDecade - 0.3) < 1e-9)
  assert.equal(entry.trend.isSignificant, true)
  assert.equal(result.has('ocean-far'), false) // sin puntos cerca: sin color
})

test('incomplete years are dropped before averaging', () => {
  const annual = toAnnualMap({ 2001: Array(12).fill(1), 2002: [...Array(11).fill(1), null] }, 2001, 2002)
  assert.deepEqual([...annual.keys()], [2001])
  assert.deepEqual(averageAnnual([annual, new Map([[2001, 3]])], 2001, 2002), [{ year: 2001, value: 2 }])
})
