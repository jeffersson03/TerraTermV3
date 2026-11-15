import { getLocale } from "@/i18n/languageStore";

// Formateadores según el idioma (es: 23,5 · en-US: 23.5). Se crean una vez por locale.
//
// IMPORTANTE (React Compiler): en componentes, pasa siempre el `locale` de useT() como último
// argumento. El compilador memoriza las llamadas según sus argumentos; si el locale no aparece,
// al cambiar de idioma el número no se vuelve a formatear. Sin `locale` se usa el idioma actual
// (útil fuera de React: servicios, tests).
const numberFormatters = new Map();
const dateFormatters = new Map();

function numberFormatter(locale, options) {
  const key = `${locale}|${JSON.stringify(options)}`;
  if (!numberFormatters.has(key)) numberFormatters.set(key, new Intl.NumberFormat(locale, options));
  return numberFormatters.get(key);
}

function dateFormatter(locale) {
  if (!dateFormatters.has(locale)) {
    dateFormatters.set(locale, new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }));
  }
  return dateFormatters.get(locale);
}

// 23.456 → "23,5" (es) / "23.5" (en) · null → "—"
export function formatNumber(value, maximumFractionDigits = 1, locale = getLocale()) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return numberFormatter(locale, { maximumFractionDigits }).format(value);
}

// 0.134 → "+0,13" · -0.21 → "−0,21" (con signo explícito, para tendencias)
export function formatSigned(value, maximumFractionDigits = 2, locale = getLocale()) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return numberFormatter(locale, { signDisplay: "exceptZero", minimumFractionDigits: maximumFractionDigits, maximumFractionDigits }).format(value);
}

// 0.0312 → "0,031" · 0.0004 → "< 0,001"
export function formatPValue(pValue, locale = getLocale()) {
  if (pValue === null || pValue === undefined) return "—";
  return pValue < 0.001 ? `< ${formatNumber(0.001, 3, locale)}` : formatNumber(pValue, 3, locale);
}

// "2025-03-07" → "07 mar 2025" (es) / "Mar 07, 2025" (en)
export function formatDate(isoDate, locale = getLocale()) {
  if (!isoDate) return "—";
  const date = isoDate.length === 10 ? new Date(`${isoDate}T00:00:00`) : new Date(isoDate);
  return dateFormatter(locale).format(date);
}

// { start, end } → "07 mar 2025 – 07 mar 2026"
export function formatPeriod(period, locale = getLocale()) {
  if (!period) return "—";
  return `${formatDate(period.start, locale)} – ${formatDate(period.end, locale)}`;
}
