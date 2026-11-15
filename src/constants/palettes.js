// Paletas de variables que NO se dibujan con el shader térmico del globo.
// (La térmica vive en thermalPalette.js porque el shader exige 5 paradas.)
// Hex en sRGB, de menor a mayor valor.

// Precipitación: seco (marrón) → húmedo (azul). Evita rojo/verde.
export const PRECIPITATION_PALETTE = Object.freeze(["#8c510a", "#d8b365", "#f6e8c3", "#5ab4ac", "#01665e", "#0c4a8a"]);

// Tendencia térmica (divergente, apta para daltonismo, ColorBrewer RdBu):
// enfriamiento (azul) → sin cambio (claro) → calentamiento (rojo).
export const TREND_PALETTE = Object.freeze(["#2166ac", "#67a9cf", "#d1e5f0", "#f7f7f7", "#fddbc7", "#ef8a62", "#b2182b"]);

// Rango simétrico de la escala de tendencia térmica en °C por década (los extremos se saturan).
export const TREND_RANGE_C_PER_DECADE = Object.freeze([-0.5, 0.5]);
