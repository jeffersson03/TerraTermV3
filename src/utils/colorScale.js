// Interpolación de una paleta hex (paradas equidistantes) → [r, g, b] 0–255.
// Es la misma regla que `thermalLUT` en el shader del globo (EarthGlobe), así
// el mapa 2D y el globo pintan el mismo valor con el mismo color.

const rgbCache = new Map();

function hexToRgb(hex) {
  if (!rgbCache.has(hex)) {
    const value = parseInt(hex.slice(1), 16);
    rgbCache.set(hex, [(value >> 16) & 255, (value >> 8) & 255, value & 255]);
  }
  return rgbCache.get(hex);
}

export function samplePalette(palette, t) {
  const clamped = Math.min(1, Math.max(0, t));
  const scaled = clamped * (palette.length - 1);
  const index = Math.min(palette.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const from = hexToRgb(palette[index]);
  const to = hexToRgb(palette[index + 1]);
  return [
    from[0] + (to[0] - from[0]) * local,
    from[1] + (to[1] - from[1]) * local,
    from[2] + (to[2] - from[2]) * local,
  ];
}
