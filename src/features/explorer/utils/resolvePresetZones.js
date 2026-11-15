import { findCellAt } from "@/features/map2d/utils/oceanGrid";

// "Piura" == "piura" == "PIURA"; ignora tildes
function normalize(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/**
 * Convierte las zonas de una comparación de ejemplo (PRESET_COMPARISONS) en
 * regiones reales del mapa. Devuelve null si alguna no existe (p. ej. no hay
 * departamentos cargados).
 */
export function resolvePresetZones(preset, { landRegions, oceanRegions }) {
  const regions = preset.zones.map((zone) =>
    zone.kind === "land"
      ? landRegions.find((region) => normalize(region.label) === normalize(zone.name)) ?? null
      : findCellAt(oceanRegions, zone.lat, zone.lon)
  );
  return regions.every(Boolean) ? regions : null;
}
