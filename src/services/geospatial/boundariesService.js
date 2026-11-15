import { getJson } from "@/services/api/httpClient";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Divisiones administrativas (GeoJSON, p. ej. geoBoundaries ADM1) de un país.
 * Filtra por `shapeGroup` = ISO alfa-3 si la propiedad existe, para detectar
 * archivos de otro país. Devuelve [] si no hay coincidencias.
 */
export async function getAdminBoundaries({ url, iso3, signal }) {
  const collection = await getJson(url, { cacheTtlMs: ONE_DAY_MS, retries: 0, signal });
  const features = collection?.features ?? [];
  return features.filter((feature) => {
    const group = feature.properties?.shapeGroup;
    return !group || group === iso3;
  });
}
