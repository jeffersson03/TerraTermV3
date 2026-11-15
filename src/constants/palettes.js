// Paletas de variables que NO se dibujan con el shader térmico del globo.
// (La térmica vive en thermalPalette.js porque el shader exige 5 paradas.)
// Hex en sRGB, de menor a mayor valor.

// Precipitación: seco (marrón) → húmedo (azul). Evita rojo/verde.
export const PRECIPITATION_PALETTE = Object.freeze(["#8c510a", "#d8b365", "#f6e8c3", "#5ab4ac", "#01665e", "#0c4a8a"]);
