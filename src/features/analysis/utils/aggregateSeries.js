// Agregación temporal de series [{ date: 'YYYY-MM-DD' | 'YYYY-MM', value }].
// Funciona con datos diarios (mocks, POWER diario) o mensuales (POWER, Giovanni, AppEEARS).

const MIN_COVERAGE = 0.8; // un año con < 80 % de datos no se usa (evita sesgos)

function expectedSamplesPerYear(series) {
  // Si hay fechas con día → diaria (~365); si solo YYYY-MM → mensual (12)
  return series[0]?.date?.length > 7 ? 365 : 12;
}

// Media anual: [{ year, value, count }]. Descarta años incompletos.
export function toAnnualMeans(series) {
  if (!series?.length) return [];
  const minCount = Math.floor(expectedSamplesPerYear(series) * MIN_COVERAGE);
  const byYear = new Map();

  for (const { date, value } of series) {
    if (!Number.isFinite(value)) continue;
    const year = Number(date.slice(0, 4));
    const bucket = byYear.get(year) ?? { sum: 0, count: 0 };
    bucket.sum += value;
    bucket.count += 1;
    byYear.set(year, bucket);
  }

  return [...byYear.entries()]
    .filter(([, bucket]) => bucket.count >= minCount)
    .map(([year, bucket]) => ({ year, value: bucket.sum / bucket.count, count: bucket.count }))
    .sort((a, b) => a.year - b.year);
}

// Anomalía respecto a la media del periodo: útil para comparar regiones con
// climatologías muy distintas (desierto costero vs. altiplano).
export function toAnomalies(annualSeries) {
  if (!annualSeries.length) return [];
  const mean = annualSeries.reduce((sum, p) => sum + p.value, 0) / annualSeries.length;
  return annualSeries.map((p) => ({ ...p, value: p.value - mean }));
}

// Une varias series anuales por año para gráficos multi-serie:
// { piura: [...], puno: [...] } → [{ year, piura, puno }]
export function mergeByYear(seriesByKey) {
  const rows = new Map();
  for (const [key, series] of Object.entries(seriesByKey)) {
    for (const { year, value } of series) {
      rows.set(year, { ...(rows.get(year) ?? { year }), [key]: value });
    }
  }
  return [...rows.values()].sort((a, b) => a.year - b.year);
}
