// Periodos de análisis predefinidos. Una tendencia necesita series largas
// (≥ 10 años); cada preset indica qué fuentes lo cubren.
export const PERIOD_PRESETS = Object.freeze([
  {
    id: "merra2",
    label: "1981–2024",
    period: { start: "1981-01-01", end: "2024-12-31" },
    note: "Cobertura completa de NASA POWER (MERRA-2).",
  },
  {
    id: "modis",
    label: "2001–2024",
    period: { start: "2001-01-01", end: "2024-12-31" },
    note: "Era MODIS / GPM: permite cruzar con vegetación, temperatura de superficie y precipitación satelital.",
  },
]);

export const DEFAULT_PERIOD_PRESET = PERIOD_PRESETS[1];

export function findPeriodPreset(period) {
  return PERIOD_PRESETS.find((preset) => preset.period.start === period.start && preset.period.end === period.end) ?? null;
}
