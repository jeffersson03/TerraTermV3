import { getLocale } from "@/i18n/languageStore";

// En componentes pasa el `locale` de useT() (ver la nota de formatValues.js sobre React Compiler).

// Oeste: «O» en español, «W» en inglés
function westLetter(locale) {
  return locale.startsWith("en") ? "W" : "O";
}

function formatDegrees(value, locale) {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(value));
}

// 14.07 → "14,07° N" | -14.07 → "14,07° S"
export function formatLatitude(lat, locale = getLocale()) {
  return `${formatDegrees(lat, locale)}° ${lat >= 0 ? "N" : "S"}`;
}

// -75.73 → "75,73° O" (es) / "75.73° W" (en) | 75.73 → "75,73° E"
export function formatLongitude(lon, locale = getLocale()) {
  return `${formatDegrees(lon, locale)}° ${lon >= 0 ? "E" : westLetter(locale)}`;
}
