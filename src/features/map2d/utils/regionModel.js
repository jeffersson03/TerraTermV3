import { geoArea, geoBounds, geoCentroid } from "d3-geo";
import { formatLatitude, formatLongitude } from "@/utils/formatCoordinates";

// Modelo común de "región" que usan el mapa 2D, los paneles y el análisis:
// { id, label, kind: 'land' | 'ocean', center: { lat, lon },
//   bbox: [oeste, sur, este, norte], variables: [...], feature? }

const LAND_VARIABLES = ["precip", "lst"];
const OCEAN_VARIABLES = ["sst"];

// d3-geo espera anillos exteriores en sentido horario; GeoJSON estándar
// (RFC 7946, p. ej. geoBoundaries) los trae al revés y d3 los interpretaría
// como "todo el planeta menos el polígono". Si el área es > medio globo, se invierte.
export function rewindFeature(feature) {
  if (geoArea(feature) <= 2 * Math.PI) return feature;
  const { type, coordinates } = feature.geometry;
  const reverseRings = (polygon) => polygon.map((ring) => [...ring].reverse());
  const rewound = type === "Polygon" ? reverseRings(coordinates) : coordinates.map(reverseRings);
  return { ...feature, geometry: { type, coordinates: rewound } };
}

function toBbox([[west, south], [east, north]]) {
  return [west, south, east, north];
}

export function featureToLandRegion(feature, nameField) {
  const [lon, lat] = geoCentroid(feature);
  const name = feature.properties?.[nameField] ?? feature.properties?.name ?? "Región";
  return {
    id: `land-${feature.properties?.shapeISO ?? feature.id ?? name}`,
    label: name,
    kind: "land",
    center: { lat, lon },
    bbox: toBbox(geoBounds(feature)),
    variables: LAND_VARIABLES,
    feature,
  };
}

// Celda de océano [oeste, sur, este, norte] en grados
export function cellToOceanRegion([west, south, east, north]) {
  const lat = (south + north) / 2;
  const lon = (west + east) / 2;
  return {
    id: `ocean-${lat}-${lon}`,
    label: `Mar ${formatLatitude(lat)} · ${formatLongitude(lon)}`,
    kind: "ocean",
    center: { lat, lon },
    bbox: [west, south, east, north],
    variables: OCEAN_VARIABLES,
  };
}

export function isPointInBbox(lat, lon, [west, south, east, north]) {
  return lat >= south && lat <= north && lon >= west && lon <= east;
}
