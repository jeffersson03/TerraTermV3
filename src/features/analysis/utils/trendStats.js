// Estadística de tendencias para series climáticas (funciones puras).
//
// - Pendiente de Sen: mediana de todas las pendientes entre pares de puntos.
//   Robusta frente a valores extremos (años El Niño).
// - Prueba de Mann-Kendall: indica si la tendencia es estadísticamente
//   significativa sin suponer distribución normal. Incluye corrección por empates.
//
// Ambas son el estándar en climatología (OMM) para detectar cambios monótonos.

const DEFAULT_ALPHA = 0.05; // nivel de significancia (95 %)
const MIN_POINTS = 10; // con menos años la prueba no es fiable

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

// Función de error (aproximación de Abramowitz-Stegun, error < 1.5e-7)
function erf(x) {
  const sign = Math.sign(x);
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return sign * (1 - poly * Math.exp(-x * x));
}

function normalCdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

// Pendiente de Sen en unidades de `value` por unidad de `x` (aquí: por año)
export function senSlope(points) {
  const slopes = [];
  for (let i = 0; i < points.length - 1; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[j].x - points[i].x;
      if (dx !== 0) slopes.push((points[j].y - points[i].y) / dx);
    }
  }
  return slopes.length ? median(slopes) : 0;
}

// Prueba de Mann-Kendall (bilateral). Devuelve el estadístico S, Z y p-valor.
export function mannKendall(values) {
  const n = values.length;
  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) s += Math.sign(values[j] - values[i]);
  }

  // Varianza con corrección por grupos de valores repetidos
  const tieCounts = Object.values(values.reduce((acc, v) => ({ ...acc, [v]: (acc[v] ?? 0) + 1 }), {}));
  const tieTerm = tieCounts.reduce((sum, t) => sum + t * (t - 1) * (2 * t + 5), 0);
  const variance = (n * (n - 1) * (2 * n + 5) - tieTerm) / 18;

  const z = variance > 0 ? (s > 0 ? (s - 1) : s < 0 ? (s + 1) : 0) / Math.sqrt(variance) : 0;
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));
  return { s, z, pValue };
}

/**
 * Analiza la tendencia de una serie anual [{ year, value }].
 * @returns {{ n, slopePerYear, slopePerDecade, pValue, z, isSignificant, direction, isReliable }}
 *   direction: 'increase' | 'decrease' | 'none'
 *   isReliable: false si hay menos de MIN_POINTS años (no concluir nada)
 */
export function analyzeTrend(annualSeries, { alpha = DEFAULT_ALPHA } = {}) {
  const valid = annualSeries.filter((point) => Number.isFinite(point.value));
  const n = valid.length;
  if (n < 3) return { n, slopePerYear: null, slopePerDecade: null, pValue: null, z: null, isSignificant: false, direction: "none", isReliable: false };

  const slopePerYear = senSlope(valid.map((p) => ({ x: p.year, y: p.value })));
  const { z, pValue } = mannKendall(valid.map((p) => p.value));
  const isSignificant = n >= MIN_POINTS && pValue < alpha;

  return {
    n,
    slopePerYear,
    slopePerDecade: slopePerYear * 10,
    pValue,
    z,
    isSignificant,
    direction: slopePerYear > 0 ? "increase" : slopePerYear < 0 ? "decrease" : "none",
    isReliable: n >= MIN_POINTS,
  };
}
