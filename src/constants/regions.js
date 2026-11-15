// Regiones de estudio del dipolo climático. Caso piloto (MVP): Perú.
// Para expandir a otra cuenca o continente basta con añadir regiones aquí y
// un escenario en src/constants/scenarios.js; ningún componente cambia.
//
// Campos:
//   role        → 'wet' (polo húmedo) | 'dry' (polo seco) | 'driver' (forzante oceánico)
//   sensorId    → vista cuyos colores identifican la región (src/constants/sensors.js)
//   center      → punto representativo (series puntuales, p. ej. NASA POWER)
//   bbox        → [oeste, sur, este, norte] en grados: área para promedios
//                 (Giovanni / AppEEARS). Aproximado: CONFIRMAR en la investigación.
//   variables   → variables del catálogo pertinentes para la región
export const REGIONS = Object.freeze({
  piura: {
    id: "piura",
    marker: "A",
    label: "Costa norte · Piura",
    country: "Perú",
    role: "wet",
    sensorId: "aqua",
    center: { lat: -5.19, lon: -80.63 },
    bbox: [-81.3, -6.4, -79.4, -4.1],
    variables: ["precip", "lst"],
    summary: "Lluvias intensas, inundaciones y brotes epidémicos durante eventos El Niño costero.",
  },
  puno: {
    id: "puno",
    marker: "B",
    label: "Sierra sur · Puno",
    country: "Perú",
    role: "dry",
    sensorId: "terra",
    center: { lat: -15.84, lon: -70.02 },
    bbox: [-71.1, -17.3, -68.8, -13.0],
    variables: ["precip", "lst"],
    summary: "Déficit de lluvias y sequías severas en el altiplano.",
  },
  nino12: {
    id: "nino12",
    marker: "Δ",
    label: "Océano · Región Niño 1+2",
    country: "Pacífico oriental",
    role: "driver",
    sensorId: "classic",
    center: { lat: -5, lon: -85 },
    bbox: [-90, -10, -80, 0],
    variables: ["sst"],
    summary: "Anomalías de temperatura del mar frente a Perú y Ecuador que disparan el dipolo.",
  },
});

export function getRegion(regionId) {
  return REGIONS[regionId] ?? null;
}

// Comparaciones de ejemplo para el mapa 2D (botones del panel del país).
// Cada zona se busca entre las regiones cargadas:
//   { kind: 'land', name }      → departamento por nombre (ADM1)
//   { kind: 'ocean', lat, lon } → celda de océano que contiene el punto
// `domain` = vista que se activa para que la selección sea válida.
export const PRESET_COMPARISONS = Object.freeze([
  {
    id: "dipole",
    label: "Dipolo: Piura vs. Puno",
    domain: "terra",
    zones: [
      { kind: "land", name: "Piura" },
      { kind: "land", name: "Puno" },
    ],
  },
  {
    id: "driver",
    label: "Forzante: Niño 1+2 vs. Piura",
    domain: "classic",
    zones: [
      { kind: "ocean", lat: REGIONS.nino12.center.lat, lon: -84 },
      { kind: "land", name: "Piura" },
    ],
  },
]);
