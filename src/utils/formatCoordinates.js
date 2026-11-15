const coordinateFormatter = new Intl.NumberFormat("es", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// 14.07 → "14,07° N" | -14.07 → "14,07° S"
export function formatLatitude(lat) {
  return `${coordinateFormatter.format(Math.abs(lat))}° ${lat >= 0 ? "N" : "S"}`;
}

// -75.73 → "75,73° O" | 75.73 → "75,73° E"
export function formatLongitude(lon) {
  return `${coordinateFormatter.format(Math.abs(lon))}° ${lon >= 0 ? "E" : "O"}`;
}
