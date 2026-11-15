import { geoContains } from "d3-geo";
import { analyzeTrend } from "../../analysis/utils/trendStats.js";

// Tendencia por zona a partir de la rejilla regional de NASA POWER (funciones puras).
// Rutas relativas (no `@/`) para poder probarlo con `node --test`.
//
// 1. Cada punto de la rejilla → media anual (solo años con los 12 meses).
// 2. Cada zona toma los puntos que caen dentro (departamento: dentro del polígono;
//    celda de mar: dentro del recuadro). Si ninguno cae dentro (zona muy pequeña),
//    usa el punto más cercano a su centro.
// 3. Serie anual de la zona = media de sus puntos; tendencia = mismo motor que los paneles
//    (pendiente de Sen + Mann-Kendall, utils/trendStats.js).

const MAX_NEAREST_DEG = 1; // distancia máxima del punto de respaldo al centro de la zona

// { '2001': [12] } → Map(año → media) solo con años completos dentro de [from, to]
export function toAnnualMap(years, from, to) {
  const annual = new Map();
  for (let year = from; year <= to; year++) {
    const months = years[year];
    if (months?.length !== 12 || !months.every(Number.isFinite)) continue;
    annual.set(year, months.reduce((sum, value) => sum + value, 0) / 12);
  }
  return annual;
}

function isInBbox(lat, lon, [west, south, east, north]) {
  return lat >= south && lat <= north && lon >= west && lon <= east;
}

function pointsInRegion(region, points) {
  const candidates = points.filter((point) => isInBbox(point.lat, point.lon, region.bbox));
  if (region.kind !== "land" || !region.feature) return candidates;
  return candidates.filter((point) => geoContains(region.feature, [point.lon, point.lat]));
}

function nearestPoint(region, points) {
  let best = null;
  let bestDistance = Infinity;
  for (const point of points) {
    const distance = Math.hypot(point.lat - region.center.lat, point.lon - region.center.lon);
    if (distance < bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }
  return bestDistance <= MAX_NEAREST_DEG ? best : null;
}

// Media por año de varias series anuales; solo años presentes en todas.
export function averageAnnual(annualMaps, from, to) {
  const series = [];
  for (let year = from; year <= to; year++) {
    const values = annualMaps.map((annual) => annual.get(year));
    if (values.length && values.every(Number.isFinite)) {
      series.push({ year, value: values.reduce((sum, value) => sum + value, 0) / values.length });
    }
  }
  return series;
}

/**
 * @param {Array} regions  regiones del mapa 2D (regionModel.js)
 * @param {Array<{lat, lon, years}>} points  rejilla de powerRegionalService
 * @returns {Map<string, { trend, annual, pointCount }>}
 */
export function computeRegionTrends(regions, points, from, to) {
  const withAnnual = points.map((point) => ({ ...point, annual: toAnnualMap(point.years, from, to) }));
  const result = new Map();

  for (const region of regions) {
    let inside = pointsInRegion(region, withAnnual);
    if (inside.length === 0) {
      const nearest = nearestPoint(region, withAnnual);
      inside = nearest ? [nearest] : [];
    }
    if (inside.length === 0) continue;

    const annual = averageAnnual(inside.map((point) => point.annual), from, to);
    result.set(region.id, { trend: analyzeTrend(annual), annual, pointCount: inside.length });
  }
  return result;
}
