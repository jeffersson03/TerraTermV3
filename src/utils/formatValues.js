const dateFormatter = new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" });

// 23.456 → "23,5" · null → "—"
export function formatNumber(value, maximumFractionDigits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es", { maximumFractionDigits }).format(value);
}

// 0.134 → "+0,13" · -0.21 → "−0,21" (con signo explícito, para tendencias)
export function formatSigned(value, maximumFractionDigits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es", {
    signDisplay: "exceptZero",
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

// 0.0312 → "0,031" · 0.0004 → "< 0,001"
export function formatPValue(pValue) {
  if (pValue === null || pValue === undefined) return "—";
  return pValue < 0.001 ? "< 0,001" : formatNumber(pValue, 3);
}

// "2025-03-07" → "07 mar 2025"
export function formatDate(isoDate) {
  if (!isoDate) return "—";
  const date = isoDate.length === 10 ? new Date(`${isoDate}T00:00:00`) : new Date(isoDate);
  return dateFormatter.format(date);
}

// { start, end } → "07 mar 2025 – 07 mar 2026"
export function formatPeriod(period) {
  if (!period) return "—";
  return `${formatDate(period.start)} – ${formatDate(period.end)}`;
}
