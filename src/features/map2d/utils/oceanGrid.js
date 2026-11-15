import { findCountryAt } from "@/features/globe/utils/geoMath";
import { cellToOceanRegion } from "@/features/map2d/utils/regionModel";

/**
 * Cuadrícula de celdas de océano dentro de la vista.
 * Una celda se incluye si su centro no cae en ningún país (tierra).
 * Funciona igual para cualquier costa del mundo.
 *
 * @param {[number, number, number, number]} viewBbox [oeste, sur, este, norte]
 * @param {Array} countryIndex  índice de países (buildCountryIndex)
 * @param {number} cellSizeDeg  tamaño de celda en grados
 */
export function buildOceanGrid(viewBbox, countryIndex, cellSizeDeg = 1) {
  const [west, south, east, north] = viewBbox;
  const startLon = Math.floor(west / cellSizeDeg) * cellSizeDeg;
  const startLat = Math.floor(south / cellSizeDeg) * cellSizeDeg;
  const cells = [];

  for (let lat = startLat; lat < north; lat += cellSizeDeg) {
    for (let lon = startLon; lon < east; lon += cellSizeDeg) {
      const centerLat = lat + cellSizeDeg / 2;
      const centerLon = lon + cellSizeDeg / 2;
      if (findCountryAt(centerLat, centerLon, countryIndex)) continue; // es tierra
      cells.push(cellToOceanRegion([lon, lat, lon + cellSizeDeg, lat + cellSizeDeg]));
    }
  }

  return cells;
}

// Región de la cuadrícula que contiene el punto (para presets y búsquedas)
export function findCellAt(cells, lat, lon) {
  return cells.find(({ bbox: [w, s, e, n] }) => lat >= s && lat < n && lon >= w && lon < e) ?? null;
}
