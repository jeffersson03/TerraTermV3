export const verdicts = {
  evidence: 'Evidencia de tendencia',
  mixed: 'Métodos en desacuerdo',
  inconclusive: 'Evidencia insuficiente',
  unavailable: 'Datos insuficientes',
}

// Con menos años completos que este umbral se muestra un aviso; el cálculo no cambia.
export const shortPeriodYears = 20

export function mean(values) {
  return values.reduce((total, value) => total + value, 0) / values.length
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// Two-sided 95% Student t critical value, integrating the positive half.
const criticalByDegrees = new Map()
function criticalT(degrees) {
  if (criticalByDegrees.has(degrees)) return criticalByDegrees.get(degrees)

  const odd = degrees % 2
  let atZero = odd ? 1 / Math.PI : 1 / (2 * Math.sqrt(2))
  for (let df = odd ? 1 : 2; df < degrees; df += 2) {
    atZero *= ((df + 1) / df) * Math.sqrt(df / (df + 2))
  }
  const samples = 256
  function halfArea(limit) {
    const step = limit / samples
    let sum = atZero
    for (let i = 1; i <= samples; i++) {
      const weight = i === samples ? 1 : i % 2 ? 4 : 2
      sum += weight * atZero * (1 + (i * step) ** 2 / degrees) ** (-(degrees + 1) / 2)
    }
    return sum * step / 3
  }

  let low = 0
  let high = 16
  for (let i = 0; i < 38; i++) {
    const mid = (low + high) / 2
    if (halfArea(mid) < 0.475) low = mid
    else high = mid
  }
  const critical = (low + high) / 2
  criticalByDegrees.set(degrees, critical)
  return critical
}

function linearFit(points) {
  const center = mean(points.map(({ year }) => year))
  const average = mean(points.map(({ value }) => value))
  const span = points.reduce((sum, { year }) => sum + (year - center) ** 2, 0)
  const slope = points.reduce(
    (sum, { year, value }) => sum + (year - center) * (value - average), 0,
  ) / span
  const at = (year) => average + slope * (year - center)
  return { center, span, slope, at }
}

function neweyWestInterval(points, line) {
  const n = points.length
  // Using calendar years as keys preserves the meaning of a lag across gaps.
  const scores = new Map(points.map(({ year, value }) => [
    year, (year - line.center) * (value - line.at(year)),
  ]))
  let variance = 0
  for (const [year, score] of scores) {
    variance += score ** 2
    for (const lag of [1, 2]) {
      variance += 2 * (1 - lag / 3) * score * (scores.get(year - lag) ?? 0)
    }
  }
  const margin = criticalT(n - 2) * Math.sqrt(Math.max(0, variance) * n / (n - 2)) / line.span
  return [(line.slope - margin) * 10, (line.slope + margin) * 10]
}

// Complement of erf, with error under 1.3e-7 for the normal tail used here.
function normalTwoSided(z) {
  if (z === 0) return 1
  const x = Math.abs(z) / Math.SQRT2
  const t = 1 / (1 + 0.3275911 * x)
  const polynomial = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741)
    * t - 0.284496736) * t + 0.254829592) * t
  return polynomial * Math.exp(-x * x)
}

function rankStatistics(points) {
  const n = points.length
  const counts = new Map()
  const slopes = []
  let s = 0
  for (let i = 0; i < n; i++) {
    const { year, value } = points[i]
    counts.set(value, (counts.get(value) ?? 0) + 1)
    for (let j = i + 1; j < n; j++) {
      const difference = points[j].value - value
      s += Math.sign(difference)
      slopes.push(difference / (points[j].year - year))
    }
  }
  const ties = [...counts.values()].reduce((sum, count) => sum + count * (count - 1) * (2 * count + 5), 0)
  const variance = (n * (n - 1) * (2 * n + 5) - ties) / 18
  const z = variance ? (s - Math.sign(s)) / Math.sqrt(variance) : 0
  return { s, p: normalTwoSided(z), sen: median(slopes) }
}

function atypicalYears(points, sen) {
  const base = points[0].year
  const residuals = points.map(({ year, value }) => value - sen * (year - base))
  const center = median(residuals)
  const deviations = residuals.map(value => Math.abs(value - center))
  const mad = median(deviations)
  return mad ? points.filter((_, i) => 0.67448975 * deviations[i] / mad > 3.5).map(({ year }) => year) : []
}

export function analyzeTrend(points) {
  if (points.length < 3) return { verdict: verdicts.unavailable, n: points.length }
  const line = linearFit(points)
  const interval = neweyWestInterval(points, line)
  const { s, p, sen } = rankStatistics(points)
  const intervalExcludesZero = interval[0] > 0 || interval[1] < 0
  const significant = p < 0.05
  const verdict = intervalExcludesZero && significant
    ? verdicts.evidence
    : intervalExcludesZero || significant ? verdicts.mixed : verdicts.inconclusive
  const first = points[0].year
  const last = points.at(-1).year
  return {
    n: points.length, slope: line.slope * 10, interval, s, p, sen: sen * 10, verdict,
    fit: [first, last].map(year => ({ year, value: line.at(year) })),
    outliers: atypicalYears(points, sen),
    shortPeriod: points.length < shortPeriodYears,
  }
}

export function findLevelShift(points, excludedYears = []) {
  const excluded = new Set(excludedYears)
  const years = points.filter(({ year }) => !excluded.has(year))
  if (years.length < 10) return null
  const line = linearFit(years)
  const lineError = years.reduce((sum, { year, value }) => sum + (value - line.at(year)) ** 2, 0)
  if (lineError <= Number.EPSILON) return null

  let best = null
  for (let split = 5; split <= years.length - 5; split++) {
    const before = years.slice(0, split).map(point => point.value)
    const after = years.slice(split).map(point => point.value)
    const beforeMean = mean(before)
    const afterMean = mean(after)
    const error = before.reduce((sum, value) => sum + (value - beforeMean) ** 2, 0)
      + after.reduce((sum, value) => sum + (value - afterMean) ** 2, 0)
    if (!best || error < best.error) {
      best = { year: years[split].year, error, beforeMean, afterMean }
    }
  }
  return best.error / lineError < 0.70 ? best : null
}
