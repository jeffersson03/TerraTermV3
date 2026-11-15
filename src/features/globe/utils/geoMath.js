import { geoBounds, geoContains } from "d3-geo";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Convierte un punto 3D de intersección en la esfera (THREE.Vector3)
 * a coordenadas geográficas { lat, lon } en grados decimales.
 * Alinea con la proyección UV estándar de SphereGeometry en Three.js.
 */
export function cartesianToLatLon(point, radius = 1) {
  // Evitar errores de precisión flotante fuera de [-1, 1] en Math.acos
  const clampedY = Math.max(-1, Math.min(1, point.y / radius));
  const lat = 90 - Math.acos(clampedY) * RAD_TO_DEG;

  const rawLon = Math.atan2(point.z, -point.x) * RAD_TO_DEG - 180;
  // Normalizar longitud al rango [-180, 180]
  const lon = ((rawLon + 540) % 360) - 180;

  return { lat, lon };
}

/**
 * Convierte coordenadas geográficas { lat, lon } a posición 3D [x, y, z]
 * sobre una esfera de radio `radius`.
 */
export function latLonToCartesian(lat, lon, radius = 1) {
  const phi = (90 - lat) * DEG_TO_RAD;
  const theta = (lon + 180) * DEG_TO_RAD;

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return [x, y, z];
}

/**
 * Precalcula el rectángulo geográfico de cada país (una sola vez, al cargar).
 * Devuelve [{ feature, bounds: [[oeste, sur], [este, norte]] }].
 */
export function buildCountryIndex(features) {
  return features.map((feature) => ({ feature, bounds: geoBounds(feature) }));
}

/**
 * ¿Está [lat, lon] dentro del rectángulo? Comprobación barata (4 comparaciones).
 * Si oeste > este, el país cruza el antimeridiano (Rusia, Fiyi…).
 */
function isInsideBounds(lat, lon, [[west, south], [east, north]]) {
  if (lat < south || lat > north) return false;
  return west <= east ? lon >= west && lon <= east : lon >= west || lon <= east;
}

/**
 * Busca qué país contiene el punto [lat, lon].
 * 1. Comprueba primero el último país detectado (el cursor suele seguir dentro).
 * 2. Descarta por rectángulo los países que no pueden contenerlo.
 * 3. Solo a los 1–3 candidatos restantes les aplica geoContains (costoso).
 */
export function findCountryAt(lat, lon, countryIndex, lastMatchedFeature = null) {
  if (!countryIndex || countryIndex.length === 0) return null;

  const coords = [lon, lat];

  if (lastMatchedFeature && geoContains(lastMatchedFeature, coords)) {
    return lastMatchedFeature;
  }

  for (const { feature, bounds } of countryIndex) {
    if (feature === lastMatchedFeature) continue;
    if (!isInsideBounds(lat, lon, bounds)) continue;
    if (geoContains(feature, coords)) return feature;
  }

  return null;
}

/**
 * Extrae los segmentos 3D (pares de vértices [x1,y1,z1, x2,y2,z2...])
 * de un único Feature (Polygon o MultiPolygon) para dibujar su contorno
 * resaltado en hover con THREE.LineSegments.
 */
export function buildFeatureOutlinePositions(feature, radius = 1.003) {
  if (!feature || !feature.geometry) return new Float32Array(0);

  const { type, coordinates } = feature.geometry;
  const polygons = type === "Polygon" ? [coordinates] : coordinates;
  const positions = [];

  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [lon1, lat1] = ring[i];
        const [lon2, lat2] = ring[i + 1];

        const [x1, y1, z1] = latLonToCartesian(lat1, lon1, radius);
        const [x2, y2, z2] = latLonToCartesian(lat2, lon2, radius);

        positions.push(x1, y1, z1, x2, y2, z2);
      }
    }
  }

  return new Float32Array(positions);
}

/**
 * Contorno de un rectángulo geográfico [oeste, sur, este, norte] sobre la
 * esfera, como pares de vértices para THREE.LineSegments. Los lados se
 * subdividen para que sigan la curvatura del globo.
 */
export function buildBboxOutlinePositions([west, south, east, north], radius = 1.004, steps = 24) {
  const corners = [
    [south, west],
    [south, east],
    [north, east],
    [north, west],
  ];
  const positions = [];

  for (let side = 0; side < 4; side++) {
    const [lat1, lon1] = corners[side];
    const [lat2, lon2] = corners[(side + 1) % 4];
    for (let i = 0; i < steps; i++) {
      const t1 = i / steps;
      const t2 = (i + 1) / steps;
      positions.push(
        ...latLonToCartesian(lat1 + (lat2 - lat1) * t1, lon1 + (lon2 - lon1) * t1, radius),
        ...latLonToCartesian(lat1 + (lat2 - lat1) * t2, lon1 + (lon2 - lon1) * t2, radius)
      );
    }
  }

  return new Float32Array(positions);
}

/**
 * Genera los vértices 3D (pares de segmentos) para la retícula geográfica
 * consumida por GlobeGraticule.jsx: buildGraticulePositions(radius, stepDeg).
 */
export function buildGraticulePositions(radius = 1, stepDeg = 15, segments = 72) {
  const positions = [];

  // 1. Paralelos (latitudes constantes)
  for (let lat = -90 + stepDeg; lat <= 90 - stepDeg; lat += stepDeg) {
    for (let i = 0; i < segments; i++) {
      const lon1 = -180 + (i * 360) / segments;
      const lon2 = -180 + ((i + 1) * 360) / segments;

      const [x1, y1, z1] = latLonToCartesian(lat, lon1, radius);
      const [x2, y2, z2] = latLonToCartesian(lat, lon2, radius);

      positions.push(x1, y1, z1, x2, y2, z2);
    }
  }

  // 2. Meridianos (longitudes constantes)
  for (let lon = -180; lon < 180; lon += stepDeg) {
    for (let i = 0; i < segments; i++) {
      const lat1 = -90 + (i * 180) / segments;
      const lat2 = -90 + ((i + 1) * 180) / segments;

      const [x1, y1, z1] = latLonToCartesian(lat1, lon, radius);
      const [x2, y2, z2] = latLonToCartesian(lat2, lon, radius);

      positions.push(x1, y1, z1, x2, y2, z2);
    }
  }
  return new Float32Array(positions)
}