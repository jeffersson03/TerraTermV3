import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { analyzeStudy, june2025 } from '../src/features/analysis/utils/study.js'
import { verdicts } from '../src/features/analysis/utils/trend.js'

const dataset = JSON.parse(readFileSync(
  new URL('../src/features/analysis/data/ica-pisco.json', import.meta.url), 'utf8',
))
const study = (variable, place, from, to) => analyzeStudy(dataset, { variable, place, from, to })

function near(actual, expected, tolerance = 0.00006) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`)
}

function checkTrend(trend, { slope, interval, p, verdict }) {
  near(trend.slope, slope)
  near(trend.interval[0], interval[0])
  near(trend.interval[1], interval[1])
  near(trend.p, p, 0.00001)
  assert.equal(trend.verdict, verdict)
}

test('Ica T2M reproduces the verified 2003–2025 example', () => {
  const [ica] = study('T2M', 'ica', 2003, 2025)
  assert.equal(ica.points.length, 23)
  near(ica.points[0].value, 18.746575)
  checkTrend(ica.trend, {
    slope: 0.3748, interval: [0.1731, 0.5765], p: 0.0030967, verdict: verdicts.evidence,
  })
})

test('the period switch updates both TS series and verdicts', () => {
  const [icaLong, piscoLong] = study('TS', 'compare', 1981, 2025)
  const [icaShort, piscoShort] = study('TS', 'compare', 2003, 2025)
  assert.deepEqual(
    [icaLong, piscoLong, icaShort, piscoShort].map(entry => entry.points.length), [45, 45, 23, 23],
  )
  checkTrend(icaLong.trend, {
    slope: 0.1314, interval: [0.0411, 0.2217], p: 0.0056333, verdict: verdicts.evidence,
  })
  checkTrend(piscoLong.trend, {
    slope: -0.2144, interval: [-0.4234, -0.0055], p: 0.0409037, verdict: verdicts.evidence,
  })
  checkTrend(icaShort.trend, {
    slope: 0.1788, interval: [-0.0305, 0.3881], p: 0.1015368, verdict: verdicts.inconclusive,
  })
  checkTrend(piscoShort.trend, {
    slope: 0.0170, interval: [-0.3351, 0.3692], p: 0.4596078, verdict: verdicts.inconclusive,
  })
  assert.equal(piscoShort.trend.s, -29)
})

test('rainfall uses common complete years and keeps June 2025 separate', () => {
  const [power, imerg] = study('PRECTOTCORR', 'ica', 2003, 2025)
  assert.equal(power.points.length, 22)
  assert.deepEqual(power.points.map(point => point.year), imerg.points.map(point => point.year))
  assert.equal(power.points.at(-1).year, 2024)
  near(power.points[0].value, 39.19)
  near(imerg.points[0].value, 157.7080)
  near(power.trend.slope, 68.6529)
  near(imerg.trend.slope, -8.7479)
  assert.equal(power.trend.verdict, verdicts.evidence)
  assert.equal(imerg.trend.verdict, verdicts.inconclusive)
  assert.equal(power.shift.year, 2015)
  assert.equal(imerg.shift, null)

  const june = june2025(dataset)
  near(june.power, 122.4)
  near(june.imerg, 1.30335)
})

test('a valid year remains visible when a period is too short for inference', () => {
  const [ica] = study('T2M', 'ica', 2003, 2003)
  assert.equal(ica.points.length, 1)
  assert.equal(ica.trend.verdict, verdicts.unavailable)
  assert.equal(ica.trend.fit, undefined)
})

test('a short period adds a notice without changing the calculation or verdict', () => {
  const [short] = study('T2M', 'ica', 2023, 2025)
  assert.equal(short.points.length, 3)
  assert.equal(short.trend.shortPeriod, true)
  near(short.trend.slope, -3.9267)
  assert.equal(short.trend.verdict, verdicts.inconclusive)

  const [nineteen] = study('T2M', 'ica', 2007, 2025)
  const [twenty] = study('T2M', 'ica', 2006, 2025)
  assert.deepEqual([nineteen.points.length, nineteen.trend.shortPeriod], [19, true])
  assert.deepEqual([twenty.points.length, twenty.trend.shortPeriod], [20, false])

  const [reference] = study('T2M', 'ica', 2003, 2025)
  assert.equal(reference.trend.shortPeriod, false)
  const [single] = study('T2M', 'ica', 2003, 2003)
  assert.equal(single.trend.shortPeriod, undefined)
})
