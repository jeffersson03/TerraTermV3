// Correlación entre dos series anuales (p. ej. SST del océano vs. lluvia en
// tierra). Funciones puras.

const DEFAULT_ALPHA = 0.05;
const MIN_POINTS = 10;

// Anomalías estandarizadas (z-scores): (valor − media) / desviación típica.
// Permite dibujar variables con unidades distintas en el mismo eje (σ).
export function toStandardAnomalies(annualSeries) {
  const n = annualSeries.length;
  if (n < 2) return [];
  const mean = annualSeries.reduce((sum, p) => sum + p.value, 0) / n;
  const sd = Math.sqrt(annualSeries.reduce((sum, p) => sum + (p.value - mean) ** 2, 0) / (n - 1));
  return annualSeries.map((p) => ({ ...p, value: sd > 0 ? (p.value - mean) / sd : 0 }));
}

// Pares de valores de los años presentes en ambas series
function alignByYear(seriesA, seriesB) {
  const valuesB = new Map(seriesB.map((p) => [p.year, p.value]));
  return seriesA.filter((p) => valuesB.has(p.year)).map((p) => [p.value, valuesB.get(p.year)]);
}

// Coeficiente de Pearson
export function pearson(pairs) {
  const n = pairs.length;
  const meanX = pairs.reduce((s, [x]) => s + x, 0) / n;
  const meanY = pairs.reduce((s, [, y]) => s + y, 0) / n;
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (const [x, y] of pairs) {
    cov += (x - meanX) * (y - meanY);
    varX += (x - meanX) ** 2;
    varY += (y - meanY) ** 2;
  }
  return varX > 0 && varY > 0 ? cov / Math.sqrt(varX * varY) : 0;
}

// --- p-valor con la t de Student (beta incompleta regularizada) ---

function logGamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (const coef of c) ser += coef / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

// Fracción continua de Lentz para la beta incompleta
function betaContinuedFraction(a, b, x) {
  const tiny = 1e-30;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  d = 1 / (Math.abs(d) < tiny ? tiny : d);
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    for (const aa of [(m * (b - m) * x) / ((a + m2 - 1) * (a + m2)), (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1))]) {
      d = 1 + aa * d;
      d = 1 / (Math.abs(d) < tiny ? tiny : d);
      c = 1 + aa / c;
      if (Math.abs(c) < tiny) c = tiny;
      h *= d * c;
    }
    if (Math.abs(d * c - 1) < 1e-10) break;
  }
  return h;
}

function regularizedBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (front * betaContinuedFraction(a, b, x)) / a : 1 - (front * betaContinuedFraction(b, a, 1 - x)) / b;
}

// p-valor bilateral de r con n pares: t = r·√((n−2)/(1−r²)), gl = n − 2
export function correlationPValue(r, n) {
  if (n < 3) return null;
  if (Math.abs(r) >= 1) return 0;
  const df = n - 2;
  const t = r * Math.sqrt(df / (1 - r * r));
  return regularizedBeta(df / (df + t * t), df / 2, 0.5);
}

/**
 * Correlación de dos series anuales [{ year, value }].
 * @returns {{ n, r, pValue, isSignificant, isReliable }}
 */
export function analyzeCorrelation(seriesA, seriesB, { alpha = DEFAULT_ALPHA } = {}) {
  const pairs = alignByYear(seriesA, seriesB);
  const n = pairs.length;
  if (n < 3) return { n, r: null, pValue: null, isSignificant: false, isReliable: false };

  const r = pearson(pairs);
  const pValue = correlationPValue(r, n);
  return { n, r, pValue, isSignificant: n >= MIN_POINTS && pValue < alpha, isReliable: n >= MIN_POINTS };
}
