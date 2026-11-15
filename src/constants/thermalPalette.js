// Paleta térmica ÚNICA, compartida por el shader del globo (EarthGlobe) y la
// futura leyenda (ColorLegend). Hex en sRGB, igual que en CSS.
// 5 paradas equidistantes: posiciones 0, 0.25, 0.5, 0.75 y 1 del rango de la capa.
// El shader espera exactamente 5 paradas (uniform vec3 uThermalStops[5]).
export const THERMAL_PALETTE = Object.freeze([
  "#0d247a", // frío extremo
  "#00adeb", // frío
  "#29d973", // templado
  "#fad124", // cálido
  "#f02414", // caliente / anomalía
]);
